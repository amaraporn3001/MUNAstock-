import React, { useState, useMemo } from 'react';
import { StockRecord } from '../types';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  Layers,
  FileText,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Stethoscope,
  X,
} from 'lucide-react';

interface HistoryTabProps {
  records: StockRecord[];
  persons: string[];
  onDeleteRequest: (record: StockRecord) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  records,
  persons,
  onDeleteRequest,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick date presets
  const handleQuickDate = (preset: 'today' | '7days' | 'month' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const d = now.toISOString().slice(0, 10);
      setFromDate(d);
      setToDate(d);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 86400000);
      setFromDate(past.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(now.toISOString().slice(0, 10));
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedPerson && r.person_name !== selectedPerson) return false;
        if (selectedType && r.record_type !== selectedType) return false;
        if (fromDate && r.timestamp.slice(0, 10) < fromDate) return false;
        if (toDate && r.timestamp.slice(0, 10) > toDate) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchItem = (r.item_name || '').toLowerCase().includes(q);
          const matchPerson = (r.person_name || '').toLowerCase().includes(q);
          const matchUser = (r.performed_by || '').toLowerCase().includes(q);
          const matchDetail = (r.procedure_detail || '').toLowerCase().includes(q);
          const matchWound = (r.wound_location || '').toLowerCase().includes(q);
          if (!matchItem && !matchPerson && !matchUser && !matchDetail && !matchWound) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [records, selectedPerson, selectedType, fromDate, toDate, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredRecords.length) return;
    const headers = ['วันเวลา', 'เตียง/ผู้ป่วย', 'ประเภท', 'รายการ', 'จำนวน/ครั้ง', 'หน่วย', 'การกระทำ', 'รายละเอียด/ตำแหน่งแผล', 'อุปกรณ์ที่ใช้', 'ผู้บันทึก'];
    const rows = filteredRecords.map((r) => {
      const dt = new Date(r.timestamp).toLocaleString('th-TH');
      let suppliesStr = '';
      if (r.supplies_used) {
        try {
          const sup = JSON.parse(r.supplies_used);
          suppliesStr = Object.entries(sup)
            .filter(([_, v]) => Number(v) > 0)
            .map(([k, v]) => `${k}:${v}`)
            .join('; ');
        } catch {
          suppliesStr = r.supplies_used;
        }
      }
      return [
        `"${dt}"`,
        `"${r.person_name}"`,
        `"${r.record_type === 'procedure' ? 'หัตถการ' : 'ของใช้'}"`,
        `"${r.item_name}"`,
        `"${r.record_type === 'procedure' ? r.procedure_count || 1 : r.quantity}"`,
        `"${r.item_unit || ''}"`,
        `"${r.action_type === 'receive' ? 'รับเข้า' : r.action_type === 'withdraw' ? 'เบิกออก' : 'หัตถการ'}"`,
        `"${(r.procedure_detail || '') + (r.wound_location ? ' ' + r.wound_location : '')}"`,
        `"${suppliesStr}"`,
        `"${r.performed_by}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aging-ward-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-purple-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-purple-50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-800 text-sm">ตัวกรองค้นหาประวัติ</h3>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400">เลือกช่วง:</span>
            <button
              type="button"
              onClick={() => handleQuickDate('today')}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('7days')}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition"
            >
              7 วัน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('month')}
              className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition"
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('all')}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition"
            >
              ทั้งหมด
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date from */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">จากวันที่</label>
            <input
              id="hist-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ถึงวันที่</label>
            <input
              id="hist-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Bed selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">เตียง (ผู้ป่วย)</label>
            <select
              id="hist-person"
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">ทุกเตียง</option>
              {persons.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Record type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทรายการ</label>
            <select
              id="hist-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">ทั้งหมด</option>
              <option value="transaction">รับ / เบิกของใช้</option>
              <option value="procedure">หัตถการรายเตียง</option>
            </select>
          </div>
        </div>

        {/* Search bar & summary line */}
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อของใช้, หัตถการ, ตำแหน่งแผล, หรือผู้บันทึก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>พบ {filteredRecords.length} รายการ</span>
            {filteredRecords.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-medium border border-purple-100 transition"
                title="ดาวน์โหลดไฟล์ Excel/CSV สำหรับส่งเวร"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Items List */}
      <div id="history-list" className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-purple-100 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">ไม่พบประวัติรายการตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-400">ลองเปลี่ยนช่วงวันที่ หรือล้างตัวกรองเพื่อดูรายการทั้งหมด</p>
          </div>
        ) : (
          filteredRecords.map((r) => {
            const dt = new Date(r.timestamp);
            const dateStr = dt.toLocaleDateString('th-TH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const timeStr = dt.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Parse supplies if procedure
            let suppliesList: string[] = [];
            if (r.record_type === 'procedure' && r.supplies_used) {
              try {
                const supObj = JSON.parse(r.supplies_used);
                suppliesList = Object.entries(supObj)
                  .filter(([_, v]) => Number(v) > 0)
                  .map(([k, v]) => `${k} x${v}`);
              } catch {
                suppliesList = [];
              }
            }

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-purple-50 hover:border-purple-200 transition flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      เตียง: {r.person_name}
                    </span>

                    {/* Action Badge */}
                    {r.record_type === 'procedure' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                        <Stethoscope className="w-3 h-3 text-pink-600" />
                        <span>หัตถการ: {r.item_name}</span>
                      </span>
                    ) : r.action_type === 'receive' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>รับเข้าสต็อก</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>เบิกใช้งาน</span>
                      </span>
                    )}

                    {r.record_type === 'transaction' && (
                      <span className="text-sm font-semibold text-slate-800">
                        {r.item_name}{' '}
                        <span className="font-bold text-purple-700">
                          x{r.quantity} {r.item_unit}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Procedure Details */}
                  {r.record_type === 'procedure' && (
                    <div className="text-xs text-slate-700 space-y-1 bg-pink-50/70 p-2.5 rounded-xl border border-pink-100">
                      {r.procedure_detail && (
                        <div>
                          <span className="font-semibold text-pink-950">รายละเอียด:</span>{' '}
                          {r.procedure_detail}
                        </div>
                      )}
                      {r.wound_location && (
                        <div>
                          <span className="font-semibold text-pink-950">ตำแหน่งแผล:</span>{' '}
                          {r.wound_location}
                        </div>
                      )}
                      {suppliesList.length > 0 && (
                        <div>
                          <span className="font-semibold text-pink-950">อุปกรณ์ที่ใช้:</span>{' '}
                          {suppliesList.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta info: practitioner & timestamp */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>ผู้บันทึก: {r.performed_by || 'ไม่ระบุ'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr} เวลา {timeStr} น.</span>
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onDeleteRequest(r)}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
