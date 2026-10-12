import React, { useState } from 'react';
import { StockRecord } from '../types';
import { Trash2, Stethoscope, AlertTriangle, X, Check, Filter } from 'lucide-react';

interface DeleteAllProceduresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetIds: string[]) => void;
  allProcedureRecords: StockRecord[];
  filteredProcedureRecords: StockRecord[];
  isFiltered: boolean;
}

export const DeleteAllProceduresModal: React.FC<DeleteAllProceduresModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  allProcedureRecords,
  filteredProcedureRecords,
  isFiltered,
}) => {
  const hasFilterDifference =
    isFiltered &&
    filteredProcedureRecords.length > 0 &&
    filteredProcedureRecords.length !== allProcedureRecords.length;

  const [scope, setScope] = useState<'filtered' | 'all'>(
    hasFilterDifference ? 'filtered' : 'all'
  );
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const selectedTargets =
    scope === 'filtered' && hasFilterDifference
      ? filteredProcedureRecords
      : allProcedureRecords;

  const handleConfirm = () => {
    setIsDeleting(true);
    const ids = selectedTargets.map((r) => r.id);
    onConfirm(ids);
    setIsDeleting(false);
    onClose();
  };

  // Preview up to 3 items
  const previewList = selectedTargets.slice(0, 3);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-all-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-100 overflow-hidden animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="delete-all-modal-title" className="text-base sm:text-lg font-bold leading-tight">
                ลบรายการหัตถการ
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                ยืนยันการลบประวัติการทำหัตถการ
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

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {/* Warning Banner */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">คำเตือนสำคัญ:</span>
              <span className="text-rose-700 block text-[11px] leading-relaxed">
                การลบนี้จะลบรายการหัตถการออกจากระบบและฐานข้อมูล Firebase อย่างถาวร ไม่สามารถกู้คืนได้ และจะไม่กระทบต่อประวัติการรับเข้าหรือเบิกของใช้
              </span>
            </div>
          </div>

          {/* Scope Selector if filtered */}
          {hasFilterDifference && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                เลือกขอบเขตการลบ:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                    scope === 'filtered'
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-300'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-rose-600" />
                      <span>ลบเฉพาะรายการหัตถการตามตัวกรองที่เลือก</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ลบเฉพาะรายการที่ตรงกับเงื่อนไขการค้นหา/วันที่ปัจจุบัน
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold shrink-0">
                    {filteredProcedureRecords.length} รายการ
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                    scope === 'all'
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-300'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                      <span>ลบรายการหัตถการทั้งหมดในระบบ</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ลบประวัติหัตถการทุกรายการทั้งหมดในวอร์ด
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold shrink-0">
                    {allProcedureRecords.length} รายการ
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Details Summary Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">จำนวนที่จะถูกลบ:</span>
              <span className="font-bold text-rose-600 text-sm">
                {selectedTargets.length} รายการ
              </span>
            </div>

            {/* Preview items */}
            {previewList.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 block">
                  ตัวอย่างรายการที่จะถูกลบ:
                </span>
                {previewList.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-1.5 bg-white rounded-lg border border-slate-100 text-[11px] flex items-center justify-between gap-2 text-slate-700"
                  >
                    <div className="truncate">
                      <span className="font-semibold text-slate-800">{rec.person_name}</span>
                      <span className="text-pink-600 ml-1.5">• {rec.item_name}</span>
                    </div>
                    <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                      {rec.timestamp ? rec.timestamp.slice(0, 10) : ''}
                    </span>
                  </div>
                ))}
                {selectedTargets.length > 3 && (
                  <div className="text-[10px] text-slate-400 text-center pt-0.5">
                    และอีก {selectedTargets.length - 3} รายการ...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            id="btn-confirm-delete-all-procedures"
            onClick={handleConfirm}
            disabled={isDeleting || selectedTargets.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-rose-300/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันลบ {selectedTargets.length} รายการ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
