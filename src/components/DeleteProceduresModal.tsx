import React, { useState, useEffect, useMemo } from 'react';
import { StockRecord } from '../types';
import {
  Stethoscope,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface DeleteProceduresModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: string[];
  records: StockRecord[];
  deletedRecordIds?: string[];
  initialPerson?: string;
  initialDate?: string; // YYYY-MM-DD
  onConfirmDelete: (personName: string, dateStr: string, recordIds: string[]) => void;
}

export const DeleteProceduresModal: React.FC<DeleteProceduresModalProps> = ({
  isOpen,
  onClose,
  persons,
  records,
  deletedRecordIds = [],
  initialPerson = '',
  initialDate = '',
  onConfirmDelete,
}) => {
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const [targetPerson, setTargetPerson] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(getTodayStr());
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setTargetPerson(initialPerson || persons[0] || '');
      setTargetDate(initialDate || getTodayStr());
      setIsConfirmedCheckbox(false);
      setIsDeleting(false);
    }
  }, [isOpen, initialPerson, initialDate, persons]);

  // Helper format Thai date
  const formatThaiDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10) + 543;
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const thaiMonths = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${d} ${thaiMonths[m - 1]} ${y}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Find matching procedure records for targetPerson and targetDate
  const matchingProcedures = useMemo(() => {
    if (!targetPerson || !targetDate) return [];
    const deletedSet = new Set(deletedRecordIds);
    try {
      const saved = localStorage.getItem('aging_ward_deleted_record_ids');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) arr.forEach((id: string) => deletedSet.add(id));
      }
    } catch {
      // ignore
    }

    return records
      .filter((r) => {
        if (!r || !r.id) return false;
        if (deletedSet.has(r.id) || r.is_deleted || r.deleted || r.status === 'deleted') {
          return false;
        }
        if (r.record_type !== 'procedure') return false;
        if (r.person_name !== targetPerson) return false;
        return r.timestamp.slice(0, 10) === targetDate;
      })
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [records, targetPerson, targetDate, deletedRecordIds]);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (matchingProcedures.length === 0 || !targetPerson || !targetDate) return;
    setIsDeleting(true);
    const ids = matchingProcedures.map((r) => r.id);
    onConfirmDelete(targetPerson, targetDate, ids);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-procedures-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 p-4 sm:p-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="delete-procedures-title" className="text-base sm:text-lg font-bold leading-tight">
                  ลบหัตถการเฉพาะรายชื่อ &amp; วันที่
                </h2>
                <span className="text-[10px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full border border-white/30">
                  หน้าประวัติ
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                เลือกระบุชื่อผู้ป่วย และวันที่ เพื่อลบรายการหัตถการที่ต้องการ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/20 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm">
          {/* Inputs Section */}
          <div className="bg-rose-50/50 rounded-2xl p-3.5 border border-rose-100 space-y-3">
            {/* Person selector */}
            <div>
              <label htmlFor="del-proc-person" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-600" />
                <span>1. เลือกรายชื่อผู้ป่วยที่ต้องการลบหัตถการ:</span>
              </label>
              <select
                id="del-proc-person"
                value={targetPerson}
                onChange={(e) => setTargetPerson(e.target.value)}
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                {persons.length === 0 ? (
                  <option value="">ไม่มีรายชื่อผู้ป่วยในระบบ</option>
                ) : (
                  persons.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date selector with quick buttons */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="del-proc-date" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>2. เลือกวันที่ที่ต้องการลบ:</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetDate(getTodayStr())}
                    className={`text-[11px] px-2 py-0.5 rounded-lg font-semibold transition cursor-pointer ${
                      targetDate === getTodayStr()
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-100/60'
                    }`}
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate(getYesterdayStr())}
                    className={`text-[11px] px-2 py-0.5 rounded-lg font-semibold transition cursor-pointer ${
                      targetDate === getYesterdayStr()
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-100/60'
                    }`}
                  >
                    เมื่อวาน
                  </button>
                </div>
              </div>
              <input
                id="del-proc-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          {/* Procedure Records Found Summary */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-pink-600" />
                <span>รายการหัตถการที่พบในระบบ:</span>
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  matchingProcedures.length > 0
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                พบ {matchingProcedures.length} รายการ
              </span>
            </div>

            {matchingProcedures.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-1.5">
                <Info className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  ไม่พบรายการหัตถการของ {targetPerson || 'ผู้ป่วยที่เลือก'} ในวันที่ {formatThaiDate(targetDate)}
                </p>
                <p className="text-[11px] text-slate-400">
                  โปรดตรวจสอบชื่อผู้ป่วยหรือเปลี่ยนวันที่ที่ต้องการลบใหม่อีกครั้ง
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                  {matchingProcedures.map((proc, idx) => {
                    const timeStr = new Date(proc.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    let suppliesSummary = '';
                    if (proc.supplies_used) {
                      try {
                        const supObj = JSON.parse(proc.supplies_used);
                        suppliesSummary = Object.entries(supObj)
                          .filter(([_, v]) => Number(v) > 0)
                          .map(([k, v]) => `${k} x${v}`)
                          .join(', ');
                      } catch {
                        // ignore
                      }
                    }

                    return (
                      <div
                        key={proc.id}
                        className="p-2.5 rounded-xl bg-pink-50/70 border border-pink-100 text-xs flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 flex-wrap">
                            <span className="text-[11px] bg-white text-pink-700 border border-pink-200 px-1.5 py-0.2 rounded-md font-mono">
                              #{idx + 1}
                            </span>
                            <span className="text-pink-800">{proc.item_name}</span>
                            {proc.procedure_count && (
                              <span className="text-slate-500 font-normal">
                                ({proc.procedure_count} ครั้ง)
                              </span>
                            )}
                          </div>

                          {proc.procedure_detail && (
                            <div className="text-slate-600 text-[11px]">
                              <span className="font-semibold text-slate-700">รายละเอียด:</span>{' '}
                              {proc.procedure_detail}
                            </div>
                          )}
                          {proc.wound_location && (
                            <div className="text-slate-600 text-[11px]">
                              <span className="font-semibold text-slate-700">ตำแหน่งแผล:</span>{' '}
                              {proc.wound_location}
                            </div>
                          )}
                          {suppliesSummary && (
                            <div className="text-slate-500 text-[11px] truncate">
                              <span className="font-semibold text-slate-700">อุปกรณ์:</span>{' '}
                              {suppliesSummary}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-slate-400 shrink-0">
                          <div className="font-semibold text-slate-700 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{timeStr} น.</span>
                          </div>
                          <div>ผู้บันทึก: {proc.performed_by}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Safety check confirmation */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">คำเตือนความปลอดภัย:</span>
                      <span className="text-amber-800 block text-[11px] leading-relaxed">
                        การลบนี้จะมีผลเฉพาะ <strong>รายการหัตถการ</strong> ของ <strong>"{targetPerson}"</strong> ในวันที่ <strong>{formatThaiDate(targetDate)}</strong> เท่านั้น รายการเบิก/รับของใช้ของผู้ป่วยจะไม่ได้รับผลกระทบ
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 border-t border-amber-200/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isConfirmedCheckbox}
                      onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
                      className="rounded border-amber-300 text-rose-600 focus:ring-rose-400 cursor-pointer w-4 h-4"
                    />
                    <span className="text-xs font-bold text-amber-950">
                      ฉันยืนยันต้องการลบรายการหัตถการทั้ง {matchingProcedures.length} รายการนี้ออกจากระบบ
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-rose-100 bg-slate-50/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white text-xs sm:text-sm transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={matchingProcedures.length === 0 || !isConfirmedCheckbox || isDeleting}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-rose-300/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isDeleting
                ? 'กำลังลบ...'
                : `ยืนยันลบหัตถการ (${matchingProcedures.length} รายการ)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
