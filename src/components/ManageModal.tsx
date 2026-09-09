import React, { useState } from 'react';
import { ItemDefinition } from '../types';
import {
  Plus,
  X,
  Package,
  Trash2,
  RefreshCw,
  Pencil,
  Check,
  Bell,
  BellOff,
} from 'lucide-react';

interface ManageModalProps {
  isOpen: boolean;
  items: ItemDefinition[];
  onClose: () => void;
  onAddItem: (item: ItemDefinition) => void;
  onDeleteItem?: (itemName: string) => void;
  onEditItem?: (oldName: string, updatedItem: ItemDefinition) => void;
  onUpdateItem?: (itemName: string, updated: Partial<ItemDefinition>) => void;
  onResetData: () => void;
}

export const ManageModal: React.FC<ManageModalProps> = ({
  isOpen,
  items,
  onClose,
  onAddItem,
  onDeleteItem,
  onEditItem,
  onUpdateItem,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');

  // New Item states
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('ชิ้น');
  const [newItemAlertEnabled, setNewItemAlertEnabled] = useState(true);
  const [newItemThreshold, setNewItemThreshold] = useState(1);
  const [itemError, setItemError] = useState('');

  // Full Editing Item state
  const [editingItem, setEditingItem] = useState<ItemDefinition | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemUnit, setEditItemUnit] = useState('ชิ้น');
  const [editItemAlertEnabled, setEditItemAlertEnabled] = useState(true);
  const [editItemThreshold, setEditItemThreshold] = useState(1);
  const [editItemError, setEditItemError] = useState('');

  if (!isOpen) return null;

  // ITEM HANDLERS
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name) {
      setItemError('กรุณากรอกชื่อของใช้');
      return;
    }
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      setItemError('มีชื่อของใช้นี้ในระบบแล้ว');
      return;
    }

    onAddItem({
      name,
      unit: newItemUnit.trim() || 'ชิ้น',
      threshold: newItemAlertEnabled ? (Number(newItemThreshold) || 1) : 0,
      alert_enabled: newItemAlertEnabled,
    });

    setNewItemName('');
    setNewItemUnit('ชิ้น');
    setNewItemThreshold(1);
    setNewItemAlertEnabled(true);
    setItemError('');
  };

  const handleDeleteItem = (itemName: string) => {
    if (window.confirm(`ต้องการลบรายการ "${itemName}" ออกจากระบบใช่หรือไม่?`)) {
      if (onDeleteItem) {
        onDeleteItem(itemName);
      }
    }
  };

  const startEditItem = (item: ItemDefinition) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemUnit(item.unit);
    setEditItemAlertEnabled(item.alert_enabled !== false && item.threshold > 0);
    setEditItemThreshold(item.threshold > 0 ? item.threshold : 1);
    setEditItemError('');
  };

  const cancelEditItem = () => {
    setEditingItem(null);
    setEditItemName('');
    setEditItemUnit('ชิ้น');
    setEditItemThreshold(1);
    setEditItemAlertEnabled(true);
    setEditItemError('');
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedName = editItemName.trim();
    if (!trimmedName) {
      setEditItemError('กรุณากรอกชื่อของใช้');
      return;
    }

    if (
      trimmedName.toLowerCase() !== editingItem.name.toLowerCase() &&
      items.some((i) => i.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setEditItemError('มีชื่อรายการของใช้นี้ในระบบแล้ว');
      return;
    }

    const updated: ItemDefinition = {
      name: trimmedName,
      unit: editItemUnit.trim() || 'ชิ้น',
      threshold: editItemAlertEnabled ? (Number(editItemThreshold) || 1) : 0,
      alert_enabled: editItemAlertEnabled,
    };

    if (onEditItem) {
      onEditItem(editingItem.name, updated);
    } else if (onUpdateItem) {
      onUpdateItem(editingItem.name, updated);
    }

    cancelEditItem();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-purple-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-slate-900 text-base">จัดการรายการของใช้</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-purple-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            id="tab-manage-items"
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'items'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            รายการของใช้ ({items.length})
          </button>
          <button
            type="button"
            id="tab-manage-settings"
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            ตั้งค่าข้อมูล
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Items */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Form to Add New Item */}
              <form onSubmit={handleAddItem} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                <span className="text-xs font-bold text-purple-900 block">เพิ่มรายการของใช้ชนิดใหม่:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">ชื่อของใช้ *</label>
                    <input
                      type="text"
                      placeholder="เช่น สำลีก้อนปลอดเชื้อ"
                      value={newItemName}
                      onChange={(e) => {
                        setNewItemName(e.target.value);
                        if (itemError) setItemError('');
                      }}
                      className="w-full bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">หน่วยนับ *</label>
                    <input
                      type="text"
                      placeholder="เช่น ชิ้น, แผ่น, ซอง, กล่อง"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Notification alert toggle */}
                <div className="bg-white p-2.5 rounded-lg border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={newItemAlertEnabled}
                      onChange={(e) => setNewItemAlertEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-purple-300"
                    />
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {newItemAlertEnabled ? (
                        <Bell className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <BellOff className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      เปิดการแจ้งเตือนใกล้หมด
                    </span>
                  </label>

                  {newItemAlertEnabled && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600">เตือนเมื่อเหลือน้อยกว่าหรือเท่ากับ:</span>
                      <input
                        type="number"
                        min="1"
                        value={newItemThreshold}
                        onChange={(e) => setNewItemThreshold(Math.max(1, Number(e.target.value)))}
                        className="w-16 bg-purple-50/50 border border-purple-200 rounded px-2 py-1 text-xs text-center font-bold text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                      <span className="text-slate-500">{newItemUnit || 'ชิ้น'}</span>
                    </div>
                  )}
                </div>

                {itemError && <p className="text-rose-600 text-xs">{itemError}</p>}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มของใช้</span>
                  </button>
                </div>
              </form>

              {/* Editing Form Modal Card if an item is being edited */}
              {editingItem && (
                <form
                  onSubmit={handleSaveEditItem}
                  className="bg-purple-100/60 p-4 rounded-xl border border-purple-300 shadow-sm space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-purple-700" />
                      แก้ไขรายการ: <span className="underline decoration-purple-400">{editingItem.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={cancelEditItem}
                      className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ยกเลิก</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-2xs font-semibold text-slate-700 mb-1">ชื่อของใช้ *</label>
                      <input
                        type="text"
                        value={editItemName}
                        onChange={(e) => {
                          setEditItemName(e.target.value);
                          if (editItemError) setEditItemError('');
                        }}
                        className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-slate-700 mb-1">หน่วยนับ *</label>
                      <input
                        type="text"
                        value={editItemUnit}
                        onChange={(e) => setEditItemUnit(e.target.value)}
                        className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Edit alert options */}
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={editItemAlertEnabled}
                        onChange={(e) => setEditItemAlertEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-purple-300"
                      />
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        {editItemAlertEnabled ? (
                          <Bell className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        เปิดการแจ้งเตือนใกล้หมด
                      </span>
                    </label>

                    {editItemAlertEnabled && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">เตือนเมื่อเหลือน้อยกว่าหรือเท่ากับ:</span>
                        <input
                          type="number"
                          min="1"
                          value={editItemThreshold}
                          onChange={(e) => setEditItemThreshold(Math.max(1, Number(e.target.value)))}
                          className="w-16 bg-purple-50 border border-purple-300 rounded px-2 py-1 text-xs text-center font-bold text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <span className="text-slate-500">{editItemUnit || 'ชิ้น'}</span>
                      </div>
                    )}
                  </div>

                  {editItemError && <p className="text-rose-600 text-xs font-medium">{editItemError}</p>}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEditItem}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึกการแก้ไข</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>รายการของใช้ที่มีอยู่ ({items.length} รายการ)</span>
                  <span>สามารถแก้ไขชื่อ หน่วย หรือลบรายการเดิมได้</span>
                </div>

                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {items.map((it) => {
                    const isAlertOn = it.alert_enabled !== false && it.threshold > 0;
                    const isCurrentEditing = editingItem?.name === it.name;

                    return (
                      <div
                        key={it.name}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          isCurrentEditing
                            ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200'
                            : 'bg-white border-purple-100 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-semibold text-xs text-slate-800 truncate">
                            {it.name}
                          </span>
                          <span className="text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal shrink-0">
                            หน่วย: {it.unit}
                          </span>
                          {isAlertOn ? (
                            <span className="text-2xs bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                              <Bell className="w-2.5 h-2.5 text-amber-600" />
                              เตือน ≤ {it.threshold}
                            </span>
                          ) : (
                            <span className="text-2xs bg-slate-50 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-normal shrink-0">
                              ปิดเตือน
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditItem(it)}
                            className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                            title="แก้ไขข้อมูลของใช้"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteItem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(it.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="ลบรายการของใช้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Settings & Data Reset */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">การจัดเก็บข้อมูลและการสำรอง</h4>
                <p>
                  ข้อมูลสต็อกของใช้และประวัติหัตถการจะถูกบันทึกลงในเบราว์เซอร์ของอุปกรณ์นี้อย่างปลอดภัย
                  เพื่อให้พยาบาลและเจ้าหน้าที่เวรสามารถเรียกดูและบันทึกได้อย่างรวดเร็ว
                </p>
              </div>

              <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/50 space-y-2">
                <span className="font-bold text-rose-800 block">รีเซ็ตข้อมูลตัวอย่างเริ่มต้น:</span>
                <p className="text-rose-700">
                  หากต้องการคืนค่าข้อมูลเริ่มต้นของ Aging Ward และชุดข้อมูลสาธิต สามารถกดปุ่มด้านล่าง
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('ต้องการรีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นของ Aging Ward ใช่หรือไม่?')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="px-3 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตข้อมูลตั้งต้น</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
