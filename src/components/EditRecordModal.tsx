import React, { useState, useEffect } from 'react';
import { StockRecord, ItemDefinition } from '../types';
import { PROCEDURE_CATEGORIES } from '../data/defaultData';
import {
  Pencil,
  X,
  Check,
  Calendar,
  Clock,
  User,
  Package,
  Stethoscope,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

interface EditRecordModalProps {
  isOpen: boolean;
  record: StockRecord | null;
  persons: string[];
  items?: ItemDefinition[];
  onClose: () => void;
  onSave: (updatedRecord: StockRecord) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  record,
  persons,
  items = [],
  onClose,
  onSave,
}) => {
  const [personName, setPersonName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemUnit, setItemUnit] = useState('ชิ้น');
  const [quantity, setQuantity] = useState<number>(1);
  const [actionType, setActionType] = useState<'receive' | 'withdraw' | 'procedure'>('withdraw');
  const [performedBy, setPerformedBy] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [procedureDetail, setProcedureDetail] = useState('');
  const [woundLocation, setWoundLocation] = useState('');
  const [procedureCount, setProcedureCount] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Populate form whenever record changes
  useEffect(() => {
    if (!record) return;

    setPersonName(record.person_name || '');
    setItemName(record.item_name || '');
    setItemUnit(record.item_unit || 'ชิ้น');
    setQuantity(record.quantity || 1);
    setActionType(record.action_type || 'withdraw');
    setPerformedBy(record.performed_by || '');
    setProcedureDetail(record.procedure_detail || '');
    setWoundLocation(record.wound_location || '');
    setProcedureCount(record.procedure_count || 1);
    setNotes(record.notes || '');
    setError('');

    // Parse date and time from timestamp
    try {
      const dt = new Date(record.timestamp);
      if (!isNaN(dt.getTime())) {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const min = String(dt.getMinutes()).padStart(2, '0');
        setDateStr(`${yyyy}-${mm}-${dd}`);
        setTimeStr(`${hh}:${min}`);
      } else {
        const now = new Date();
        setDateStr(now.toISOString().slice(0, 10));
        setTimeStr('12:00');
      }
    } catch {
      const now = new Date();
      setDateStr(now.toISOString().slice(0, 10));
      setTimeStr('12:00');
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPerson = personName.trim();
    if (!cleanPerson) {
      setError('กรุณาระบุชื่อผู้ป่วยหรือเตียง');
      return;
    }

    const cleanItem = itemName.trim();
    if (!cleanItem) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }

    if (record.record_type === 'transaction' && (quantity <= 0 || isNaN(quantity))) {
      setError('จำนวนต้องมากกว่า 0');
      return;
    }

    if (record.record_type === 'procedure' && (procedureCount <= 0 || isNaN(procedureCount))) {
      setError('จำนวนครั้งหัตถการต้องมากกว่า 0');
      return;
    }

    // Build timestamp from dateStr and timeStr
    let updatedTimestamp = record.timestamp;
    if (dateStr) {
      const [hh, min] = (timeStr || '12:00').split(':');
      const dt = new Date(dateStr);
      dt.setHours(parseInt(hh, 10) || 12, parseInt(min, 10) || 0, 0, 0);
      updatedTimestamp = dt.toISOString();
    }

    const updatedRecord: StockRecord = {
      ...record,
      person_name: cleanPerson,
      item_name: cleanItem,
      item_unit: itemUnit.trim() || 'ชิ้น',
      quantity: record.record_type === 'transaction' ? Number(quantity) : 1,
      action_type: record.record_type === 'procedure' ? 'procedure' : (actionType as 'receive' | 'withdraw'),
      performed_by: performedBy.trim() || 'ไม่ระบุ',
      timestamp: updatedTimestamp,
      procedure_detail: procedureDetail.trim(),
      wound_location: woundLocation.trim(),
      procedure_count: record.record_type === 'procedure' ? Number(procedureCount) : undefined,
      notes: notes.trim(),
    };

    onSave(updatedRecord);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-100/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400 p-4 sm:p-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="edit-modal-title" className="text-base sm:text-lg font-bold leading-tight">
                แก้ไขข้อมูลบันทึก
              </h2>
              <p className="text-xs text-purple-100">
                {record.record_type === 'procedure' ? 'หัตถการผู้ป่วย' : 'รายการของใช้ (รับเข้า / เบิกออก)'}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Patient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อผู้ป่วย / เตียง <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full border border-purple-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              >
                <option value="">-- เลือกผู้ป่วย --</option>
                {persons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                {/* Fallback if current person name is custom or not in persons array */}
                {personName && !persons.includes(personName) && (
                  <option value={personName}>{personName}</option>
                )}
              </select>
            </div>
          </div>

          {/* 2. Transaction vs Procedure Details */}
          {record.record_type === 'transaction' ? (
            <div className="space-y-3 p-3 bg-purple-50/40 rounded-2xl border border-purple-100">
              {/* Action Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเภทการกระทำ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('receive')}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                      actionType === 'receive'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>รับเข้าสต็อก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('withdraw')}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                      actionType === 'withdraw'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>เบิกใช้งาน</span>
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อของใช้ <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={items.some((i) => i.name === itemName) ? itemName : ''}
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected) {
                        setItemName(selected);
                        const match = items.find((i) => i.name === selected);
                        if (match?.unit) setItemUnit(match.unit);
                      }
                    }}
                    className="flex-1 border border-purple-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                  >
                    <option value="">-- เลือกจากรายการมาตรฐาน --</option>
                    {items.map((it) => (
                      <option key={it.name} value={it.name}>
                        {it.name} ({it.unit})
                      </option>
                    ))}
                  </select>
                </div>
                {/* Editable free text if custom item */}
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="หรือพิมพ์ชื่อรายการของใช้..."
                  className="w-full mt-1.5 border border-purple-200/70 rounded-xl px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวน <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-purple-50 active:bg-purple-100 font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-1 text-sm font-bold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-purple-50 active:bg-purple-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หน่วย
                  </label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="เช่น ชิ้น, ห่อ, ขวด"
                    className="w-full border border-purple-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
              {/* Procedure Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมวดหัตถการ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={PROCEDURE_CATEGORIES.some((c) => c.label === itemName) ? itemName : ''}
                  onChange={(e) => {
                    if (e.target.value) setItemName(e.target.value);
                  }}
                  className="w-full border border-pink-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 font-medium"
                >
                  <option value="">-- เลือกหมวดหัตถการ --</option>
                  {PROCEDURE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.label}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="หรือพิมพ์ชื่อหัตถการ..."
                  className="w-full mt-1.5 border border-pink-200/70 rounded-xl px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* Procedure Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จำนวนครั้ง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={procedureCount}
                  onChange={(e) => setProcedureCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* Procedure Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดหัตถการ
                </label>
                <textarea
                  rows={2}
                  value={procedureDetail}
                  onChange={(e) => setProcedureDetail(e.target.value)}
                  placeholder="เช่น เบอร์สายยาง, ขนาดยา, จำนวนที่ใช้"
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* Wound Location if wound procedure */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่งแผล (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={woundLocation}
                  onChange={(e) => setWoundLocation(e.target.value)}
                  placeholder="เช่น แผลกดทับที่ก้นกบ, แผลผ่าตัดหน้าท้อง"
                  className="w-full border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>
          )}

          {/* 3. Date & Time of Record */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>วันที่บันทึก</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full border border-purple-200/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>เวลา</span>
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full border border-purple-200/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />
            </div>
          </div>

          {/* 4. Performed By */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>ผู้บันทึกข้อมูล</span>
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="ระบุชื่อพยาบาลหรือผู้ช่วย"
              className="w-full border border-purple-200/80 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-purple-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-400 hover:from-purple-600 hover:to-indigo-500 text-white font-bold transition text-sm shadow-md shadow-purple-300/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
