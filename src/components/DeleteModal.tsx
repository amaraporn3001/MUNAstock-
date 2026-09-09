import React from 'react';
import { StockRecord } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  record: StockRecord | null;
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  record,
  isOpen,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบรายการนี้?</h3>

          <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 text-left space-y-1 border border-slate-100">
            <div>
              <span className="font-semibold">เตียง:</span> {record.person_name}
            </div>
            <div>
              <span className="font-semibold">รายการ:</span> {record.item_name}
            </div>
            <div>
              <span className="font-semibold">ประเภท:</span>{' '}
              {record.record_type === 'procedure'
                ? 'หัตถการ'
                : record.action_type === 'receive'
                ? `รับเข้า (${record.quantity} ${record.item_unit})`
                : `เบิกออก (${record.quantity} ${record.item_unit})`}
            </div>
            <div>
              <span className="font-semibold">ผู้บันทึก:</span> {record.performed_by}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            เมื่อลบแล้ว ยอดคงเหลือในระบบจะถูกคำนวณใหม่ทันที
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 text-sm transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition shadow-sm"
          >
            ยืนยันลบ
          </button>
        </div>
      </div>
    </div>
  );
};
