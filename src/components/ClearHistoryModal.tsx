import React, { useState, useMemo } from 'react';
import {
  Eraser,
  X,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  Trash2,
  Download,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ItemDefinition, StockRecord } from '../types';
import { bulkClearHistoryInFirestore } from '../lib/firebase';
import { generateHistoryCSV } from '../utils/csvExportHelper';

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: StockRecord[];
  persons: string[];
  items: ItemDefinition[];
  currentUser: string;
  deletedRecordIds?: string[];
  onClearSuccess: (deletedIds: string[], addedRecords: StockRecord[]) => void;
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  persons,
  items,
  currentUser,
  deletedRecordIds = [],
  onClearSuccess,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [targetPerson, setTargetPerson] = useState<string>(''); // empty = all patients
  const [recordCategory, setRecordCategory] = useState<'all' | 'transactions_only' | 'procedures_only'>('all');
  const [cutOffDate, setCutOffDate] = useState<string>(todayStr);
  const [preserveBalances, setPreserveBalances] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Active records excluding deleted ones
  const activeRecords = useMemo(() => {
    const s = new Set<string>(deletedRecordIds);
    try {
      const saved = localStorage.getItem('aging_ward_deleted_record_ids');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) arr.forEach((id) => s.add(id));
      }
    } catch {
      // ignore
    }
    return records.filter(
      (r) =>
        r &&
        r.id &&
        !s.has(r.id) &&
        !r.is_deleted &&
        !r.deleted &&
        r.status !== 'deleted'
    );
  }, [records, deletedRecordIds]);

  // Quick preset dates
  const handlePresetDate = (preset: 'today' | 'yesterday' | '7days' | 'month' | '3months') => {
    const now = new Date();
    if (preset === 'today') {
      setCutOffDate(now.toISOString().slice(0, 10));
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 86400000);
      setCutOffDate(y.toISOString().slice(0, 10));
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 86400000);
      setCutOffDate(past.toISOString().slice(0, 10));
    } else if (preset === 'month') {
      const past = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      setCutOffDate(past.toISOString().slice(0, 10));
    } else if (preset === '3months') {
      const past = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      setCutOffDate(past.toISOString().slice(0, 10));
    }
  };

  // Records that match criteria to be deleted
  const recordsToClear = useMemo(() => {
    return activeRecords.filter((r) => {
      // 1. Person filter
      if (targetPerson && r.person_name !== targetPerson) return false;

      // 2. Category filter
      if (recordCategory === 'transactions_only' && r.record_type !== 'transaction') return false;
      if (recordCategory === 'procedures_only' && r.record_type !== 'procedure') return false;

      // 3. Cut-off date filter (strictly on or before cutOffDate)
      const recordDate = (r.timestamp || '').slice(0, 10);
      if (cutOffDate && recordDate > cutOffDate) return false;

      // Do not re-clear opening balances that match this exact date to avoid cycles
      if (r.performed_by?.includes('ยอดยกมา') && recordDate === cutOffDate) return false;

      return true;
    });
  }, [activeRecords, targetPerson, recordCategory, cutOffDate]);

  // Calculate opening balance records to preserve balance 100%
  const openingBalanceRecords = useMemo(() => {
    if (!preserveBalances) return [];

    // Only transactions affect stock balance
    const transactionsBeingDeleted = recordsToClear.filter((r) => r.record_type === 'transaction');
    if (transactionsBeingDeleted.length === 0) return [];

    // Group net by person -> item_name
    const personItemNet: Record<string, Record<string, { net: number; unit: string }>> = {};

    transactionsBeingDeleted.forEach((r) => {
      const p = r.person_name;
      const it = r.item_name;
      if (!p || !it) return;

      if (!personItemNet[p]) personItemNet[p] = {};
      if (!personItemNet[p][it]) {
        const itemDef = items.find((i) => i.name === it);
        personItemNet[p][it] = {
          net: 0,
          unit: r.item_unit || itemDef?.unit || 'ชิ้น',
        };
      }

      const qty = Number(r.quantity) || 0;
      if (r.action_type === 'receive') {
        personItemNet[p][it].net += qty;
      } else {
        personItemNet[p][it].net -= qty;
      }
    });

    const newRecords: StockRecord[] = [];
    const timestamp = `${cutOffDate}T23:59:59.999Z`;

    Object.entries(personItemNet).forEach(([person, itemMap]) => {
      Object.entries(itemMap).forEach(([itemName, data]) => {
        if (data.net !== 0) {
          const isPositive = data.net > 0;
          const cleanId = `ob_${encodeURIComponent(person)}_${encodeURIComponent(itemName)}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 7)}`;

          newRecords.push({
            id: cleanId,
            person_name: person,
            record_type: 'transaction',
            item_name: itemName,
            item_unit: data.unit,
            quantity: Math.abs(data.net),
            action_type: isPositive ? 'receive' : 'withdraw',
            performed_by: 'ระบบ (ยอดยกมาคงเหลือ)',
            timestamp,
            notes: `ยอดยกมาจากการเคลียร์ประวัติถึงวันที่ ${cutOffDate} (คงเหลือสุทธิเดิม ${isPositive ? '+' : ''}${data.net} ${data.unit})`,
          });
        }
      });
    });

    return newRecords;
  }, [recordsToClear, preserveBalances, cutOffDate, items]);

  if (!isOpen) return null;

  // Export backup CSV before clearing
  const handleDownloadBackup = () => {
    if (recordsToClear.length === 0) return;
    const csvContent = generateHistoryCSV(recordsToClear, { itemizeSupplies: true });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `backup-aging-ward-before-clear-${targetPerson ? targetPerson + '-' : ''}${cutOffDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform the actual clear & opening balance creation
  const handleExecuteClear = async () => {
    if (recordsToClear.length === 0) {
      setErrorMessage('ไม่พบรายการที่ตรงกับเงื่อนไขในการเคลียร์');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const idsToDelete = recordsToClear.map((r) => r.id);

      // Execute in Firestore
      await bulkClearHistoryInFirestore(idsToDelete, openingBalanceRecords);

      // Also persist deleted IDs in localStorage for immediate reflection
      try {
        const saved = localStorage.getItem('aging_ward_deleted_record_ids');
        const currentList = saved ? JSON.parse(saved) : [];
        const merged = Array.from(new Set([...currentList, ...idsToDelete]));
        localStorage.setItem('aging_ward_deleted_record_ids', JSON.stringify(merged));
      } catch {
        // ignore
      }

      setSuccessMessage(
        `เคลียร์ประวัติสำเร็จ! ลบออกจาก Firebase ${idsToDelete.length} รายการ ${
          openingBalanceRecords.length > 0
            ? `และตั้งยอดยกมา ${openingBalanceRecords.length} รายการ (ยอดคงเหลือเท่าเดิม)`
            : ''
        }`
      );

      // Notify parent to update local state immediately
      onClearSuccess(idsToDelete, openingBalanceRecords);

      setTimeout(() => {
        setIsProcessing(false);
        setShowConfirmStep(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Clear history error:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Firebase: ' + (err?.message || 'ไม่สามารถลบข้อมูลได้'));
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-purple-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Eraser className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">เคลียร์ประวัติข้อมูล &amp; ตั้งยอดยกมา</h2>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.2 rounded-full border border-white/30">
                  Firebase Cleanup
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                ล้างข้อมูลประวัติเก่าเพื่อลดภาระฐานข้อมูล โดยรักษายอดคงเหลือในหน้าสรุปยอดเท่าเดิม 100%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {!showConfirmStep ? (
            <>
              {/* 1. Target Person */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>1. เลือกรายชื่อผู้ป่วยที่ต้องการเคลียร์</span>
                </label>
                <select
                  value={targetPerson}
                  onChange={(e) => setTargetPerson(e.target.value)}
                  className="w-full border border-purple-200/90 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">-- เคลียร์ผู้ป่วยทุกคนในวอร์ด --</option>
                  {persons.map((p) => (
                    <option key={p} value={p}>
                      ผู้ป่วย: {p}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 block">
                  {targetPerson
                    ? `จะเคลียร์เฉพาะข้อมูลของผู้ป่วย "${targetPerson}" เท่านั้น`
                    : 'จะเคลียร์ข้อมูลของผู้ป่วยทั้งหมดในระบบ'}
                </span>
              </div>

              {/* 2. Category selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>2. เลือกประเภทข้อมูลที่จะเคลียร์</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordCategory('all')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                      recordCategory === 'all'
                        ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>ทั้งหมด</span>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      ทั้งของใช้และหัตถการ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordCategory('transactions_only')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                      recordCategory === 'transactions_only'
                        ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>เฉพาะของใช้</span>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      ประวัติรับเข้า / เบิกใช้
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordCategory('procedures_only')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                      recordCategory === 'procedures_only'
                        ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>เฉพาะหัตถการ</span>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      ประวัติทำแผล, NG, Suction ฯลฯ
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Cut-off Date */}
              <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>3. เลือกวันที่ตัดรอบ (เคลียร์ข้อมูลก่อนหรือถึงวันที่)</span>
                  </label>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    ถึงวันที่: {cutOffDate}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">ปุ่มลัด:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetDate('yesterday')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700 transition cursor-pointer"
                  >
                    ถึงเมื่อวาน
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate('7days')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700 transition cursor-pointer"
                  >
                    เก่ากว่า 7 วัน
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate('month')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700 transition cursor-pointer"
                  >
                    เก่ากว่า 1 เดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate('3months')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700 transition cursor-pointer"
                  >
                    เก่ากว่า 3 เดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetDate('today')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700 transition cursor-pointer"
                  >
                    ทั้งหมดถึงวันนี้
                  </button>
                </div>

                <input
                  type="date"
                  value={cutOffDate}
                  onChange={(e) => setCutOffDate(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* 4. Preserve Balances Checkbox */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 rounded-2xl border border-emerald-200/90 space-y-1.5 shadow-2xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveBalances}
                    onChange={(e) => setPreserveBalances(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-950 block">
                      รักษายอดคงเหลือในหน้าสรุปยอดให้เท่าเดิม 100% (สร้างยอดยกมาอัตโนมัติ)
                    </span>
                    <span className="text-[11px] text-emerald-800/90 block mt-0.5 leading-relaxed">
                      ระบบจะคำนวณยอดคงเหลือสุทธิเดิมของแต่ละของใช้ และบันทึกเป็น <strong>"ยอดยกมา" (Opening Balance)</strong> ไว้ 1 บรรทัดแทนประวัติที่ถูกลบทั้งหมด ทำให้ยอดคงเหลือหน้าสรุปยอดไม่เปลี่ยนแปลง แต่ลดจำนวนแถวใน Firebase ได้มหาศาล
                    </span>
                  </div>
                </label>
              </div>

              {/* 5. Impact preview */}
              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-purple-950">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-600" />
                    <span>ผลการประมวลผลที่จะเกิดขึ้น:</span>
                  </span>
                  <span className="text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                    พบ {recordsToClear.length} รายการ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-slate-500 block">จะลบออกจาก Firebase:</span>
                    <strong className="text-sm text-rose-600 block mt-0.5">
                      {recordsToClear.length} รายการ
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-slate-500 block">จะสร้างยอดยกมาคงสต็อก:</span>
                    <strong className="text-sm text-emerald-600 block mt-0.5">
                      {preserveBalances ? openingBalanceRecords.length : 0} รายการ
                    </strong>
                  </div>
                </div>

                {recordsToClear.length > 0 && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">
                      💡 ช่วยลดจำนวนเอกสารใน Firebase ลงได้:{' '}
                      <strong className="text-purple-700">
                        {Math.max(0, recordsToClear.length - (preserveBalances ? openingBalanceRecords.length : 0))} รายการ
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="text-purple-700 hover:text-purple-900 font-semibold underline flex items-center gap-1 cursor-pointer"
                      title="ดาวน์โหลดไฟล์สำรองข้อมูลก่อนเคลียร์"
                    >
                      <Download className="w-3 h-3" />
                      <span>สำรองข้อมูล CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <div className="space-y-3.5 py-2">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>โปรดยืนยันการเคลียร์ประวัติข้อมูล</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  คุณกำลังจะลบประวัติจำนวน <strong>{recordsToClear.length} รายการ</strong> ออกจากฐานข้อมูล Firebase สำหรับผู้ป่วย: <strong>{targetPerson || 'ทุกคนในวอร์ด'}</strong> ที่บันทึกก่อนวันที่ <strong>{cutOffDate}</strong>
                </p>
                {preserveBalances && (
                  <div className="text-xs bg-white/80 p-2.5 rounded-xl border border-amber-200 text-emerald-800 font-medium">
                    🛡️ <strong>ยอดคงเหลือปลอดภัย:</strong> ระบบจะตั้งยอดยกมา {openingBalanceRecords.length} รายการรองรับไว้ ทำให้ยอดคงเหลือในหน้าสรุปยอดเท่าเดิม 100%
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span>สรุปการดำเนินการ:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>ลบประวัติออกจาก Firebase Firestore ({recordsToClear.length} รายการ)</li>
                  {preserveBalances && (
                    <li>บันทึกยอดยกมาทดแทน ({openingBalanceRecords.length} รายการ)</li>
                  )}
                  <li>ตัดข้อมูลเก่าออกจากเครื่องและหน่วยความจำทันที</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-purple-100 bg-slate-50/80 flex items-center justify-between gap-2">
          {!showConfirmStep ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => {
                  if (recordsToClear.length === 0) {
                    setErrorMessage('ไม่พบรายการที่ตรงกับเงื่อนไขในการเคลียร์');
                    return;
                  }
                  setShowConfirmStep(true);
                }}
                disabled={recordsToClear.length === 0 || isProcessing}
                className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>ตรวจสอบและดำเนินการ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmStep(false)}
                disabled={isProcessing}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                ย้อนกลับ
              </button>

              <button
                type="button"
                onClick={handleExecuteClear}
                disabled={isProcessing}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>กำลังเคลียร์ข้อมูลใน Firebase...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ยืนยันลบประวัติ {recordsToClear.length} รายการ</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
