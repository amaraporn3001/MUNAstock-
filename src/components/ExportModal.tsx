import React, { useState } from 'react';
import { Download, FileSpreadsheet, X, Calendar, User, CheckCircle2, Layers, FileText } from 'lucide-react';
import { ItemDefinition, StockRecord } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: StockRecord[];
  persons: string[];
  items: ItemDefinition[];
  selectedPerson?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  records,
  persons,
  items,
  selectedPerson,
}) => {
  const [exportType, setExportType] = useState<'history' | 'all_patients_stock' | 'patient_stock'>('history');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('today');
  const [targetPerson, setTargetPerson] = useState<string>(selectedPerson || '');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [isExportSuccess, setIsExportSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter records according to selection
  const getFilteredRecords = () => {
    let filtered = [...records];

    // Person filter
    if (targetPerson) {
      filtered = filtered.filter((r) => r.person_name === targetPerson);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      filtered = filtered.filter((r) => r.timestamp >= todayStart);
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((r) => r.timestamp >= sevenDaysAgo);
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      filtered = filtered.filter((r) => r.timestamp >= monthStart);
    } else if (customFrom || customTo) {
      if (customFrom) {
        const fromTs = new Date(customFrom).setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => r.timestamp >= fromTs);
      }
      if (customTo) {
        const toTs = new Date(customTo).setHours(23, 59, 59, 999);
        filtered = filtered.filter((r) => r.timestamp <= toTs);
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  const handleExport = () => {
    let csvContent = '';
    let fileName = '';
    const dateStamp = new Date().toISOString().slice(0, 10);

    if (exportType === 'history') {
      const data = getFilteredRecords();
      const headers = [
        'วันที่',
        'เวลา',
        'ชื่อผู้ป่วย',
        'ประเภทรายการ',
        'รายการของใช้/หัตถการ',
        'จำนวน',
        'หน่วย',
        'การกระทำ',
        'อุปกรณ์ที่ใช้ประกอบ',
        'ผู้บันทึก',
      ];

      const rows = data.map((r) => {
        const dt = new Date(r.timestamp);
        const dateStr = dt.toLocaleDateString('th-TH');
        const timeStr = dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const typeLabel = r.record_type === 'procedure' ? 'หัตถการ' : 'ของใช้';
        const actionLabel =
          r.action_type === 'receive'
            ? 'รับเข้าสต็อก'
            : r.action_type === 'withdraw'
            ? 'เบิกใช้'
            : r.action_type === 'borrow'
            ? 'ยืมแผนก'
            : 'ทำหัตถการ';

        let suppliesStr = '';
        if (r.supplies_used) {
          try {
            const parsed = JSON.parse(r.supplies_used);
            suppliesStr = Object.entries(parsed)
              .map(([k, v]) => `${k} (${v})`)
              .join('; ');
          } catch {
            suppliesStr = r.supplies_used;
          }
        }

        return [
          `"${dateStr}"`,
          `"${timeStr}"`,
          `"${r.person_name}"`,
          `"${typeLabel}"`,
          `"${r.item_name}"`,
          r.quantity,
          `"${r.item_unit || 'ชิ้น'}"`,
          `"${actionLabel}"`,
          `"${suppliesStr.replace(/"/g, '""')}"`,
          `"${r.performed_by}"`,
        ].join(',');
      });

      csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      fileName = `aging-ward-history-${targetPerson ? targetPerson + '-' : ''}${dateStamp}.csv`;
    } else if (exportType === 'all_patients_stock') {
      // Matrix: Patients x Items
      const itemNames = items.map((i) => i.name);
      const headers = ['ชื่อผู้ป่วย', ...itemNames.map((name) => `"${name}"`)];

      const rows = persons.map((person) => {
        const pRecords = records.filter(
          (r) => r.person_name === person && r.record_type === 'transaction'
        );
        const balances: Record<string, number> = {};
        pRecords.forEach((r) => {
          balances[r.item_name] =
            (balances[r.item_name] || 0) + (r.action_type === 'receive' ? r.quantity : -r.quantity);
        });

        const rowValues = itemNames.map((itName) => balances[itName] || 0);
        return [`"${person}"`, ...rowValues].join(',');
      });

      csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      fileName = `aging-ward-stock-all-patients-${dateStamp}.csv`;
    } else if (exportType === 'patient_stock') {
      const personToUse = targetPerson || persons[0];
      const pRecords = records.filter(
        (r) => r.person_name === personToUse && r.record_type === 'transaction'
      );
      const balances: Record<string, number> = {};
      pRecords.forEach((r) => {
        balances[r.item_name] =
          (balances[r.item_name] || 0) + (r.action_type === 'receive' ? r.quantity : -r.quantity);
      });

      const headers = ['ชื่อผู้ป่วย', 'รายการของใช้', 'ยอดคงเหลือ', 'หน่วย', 'สถานะ'];
      const rows = items.map((it) => {
        const qty = balances[it.name] || 0;
        const status =
          qty < 0 ? 'ยืมแผนก' : qty <= (it.threshold || 0) ? 'ใกล้หมด' : 'พร้อมใช้งาน';
        return [`"${personToUse}"`, `"${it.name}"`, qty, `"${it.unit}"`, `"${status}"`].join(',');
      });

      csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      fileName = `aging-ward-stock-${personToUse}-${dateStamp}.csv`;
    }

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportSuccess(true);
    setTimeout(() => {
      setIsExportSuccess(false);
      onClose();
    }, 1200);
  };

  const previewCount = getFilteredRecords().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-purple-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">ส่งออกข้อมูลเป็น CSV (Excel)</h2>
              <p className="text-xs text-purple-200">ดาวน์โหลดรายงานข้อมูลสต็อกและประวัติการเบิก</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Format selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              เลือกรูปแบบรายงานที่ต้องการส่งออก
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1 */}
              <button
                type="button"
                onClick={() => setExportType('history')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  exportType === 'history'
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    exportType === 'history'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-900 block">
                    ประวัติการเบิกของใช้ &amp; หัตถการ (Log รายการ)
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    รายละเอียดบันทึกทุกรายการ พร้อมวันเวลา, ผู้ป่วย, จำนวน และชื่อผู้ปฏิบัติงาน
                  </span>
                </div>
              </button>

              {/* Option 2 */}
              <button
                type="button"
                onClick={() => setExportType('all_patients_stock')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  exportType === 'all_patients_stock'
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    exportType === 'all_patients_stock'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-900 block">
                    ตารางสรุปสต็อกคงเหลือผู้ป่วยทุกคน (All Patients Matrix)
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    ตารางสรุปยอดคงเหลือของใช้ทุกชิ้น แยกตามรายชื่อผู้ป่วยทั้งหมดในวอร์ด
                  </span>
                </div>
              </button>

              {/* Option 3 */}
              <button
                type="button"
                onClick={() => setExportType('patient_stock')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  exportType === 'patient_stock'
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    exportType === 'patient_stock'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-900 block">
                    สรุปยอดสต็อกคงเหลือเฉพาะผู้ป่วยรายคน
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    รายงานสรุปรายการของใช้และสถานะเฉพาะผู้ป่วยที่ระบุ
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Filtering controls when applicable */}
          {exportType === 'history' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-purple-100/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                ตัวกรองช่วงเวลา (ประวัติ)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'today', label: 'วันนี้' },
                  { id: '7days', label: '7 วันย้อนหลัง' },
                  { id: 'month', label: 'เดือนนี้' },
                  { id: 'all', label: 'ทั้งหมด' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDateFilter(d.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                      dateFilter === d.id
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  กรองเฉพาะผู้ป่วย:
                </label>
                <select
                  value={targetPerson}
                  onChange={(e) => setTargetPerson(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- ผู้ป่วยทุกคน --</option>
                  {persons.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-purple-800 font-medium pt-1">
                📊 พบข้อมูลประวัติที่จะส่งออก: <strong>{previewCount} รายการ</strong>
              </div>
            </div>
          )}

          {exportType === 'patient_stock' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-purple-100/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700">เลือกชื่อผู้ป่วย</label>
              <select
                value={targetPerson || persons[0]}
                onChange={(e) => setTargetPerson(e.target.value)}
                className="w-full border border-purple-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
              >
                {persons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ไฟล์ CSV รองรับภาษาไทยสมบูรณ์ (UTF-8 with BOM) เปิดใน Microsoft Excel ได้ทันที</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-purple-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white text-sm transition min-h-[44px]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            id="btn-confirm-export-csv"
            onClick={handleExport}
            className="py-2.5 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md shadow-purple-700/20 transition flex items-center gap-2 min-h-[44px] active:scale-98"
          >
            {isExportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>ดาวน์โหลดสำเร็จ!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์ CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
