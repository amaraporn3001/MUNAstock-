import React, { useState } from 'react';
import {
  ItemDefinition,
  StockRecord,
  ProcedureCategory,
} from '../types';
import { BEDSIDE_ITEMS, PROCEDURE_CATEGORIES } from '../data/defaultData';
import {
  PackagePlus,
  PackageMinus,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Boxes,
  Calendar,
  Layers,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface RecordTabProps {
  persons: string[];
  items: ItemDefinition[];
  records: StockRecord[];
  currentUser: string;
  selectedPerson: string;
  onSelectPerson: (person: string) => void;
  onAddRecord: (record: Omit<StockRecord, 'id'>) => void;
  onOpenManagePatients?: () => void;
}

export const RecordTab: React.FC<RecordTabProps> = ({
  persons,
  items,
  records,
  currentUser,
  selectedPerson,
  onSelectPerson,
  onAddRecord,
  onOpenManagePatients,
}) => {
  const [subTab, setSubTab] = useState<'stock' | 'procedure'>('stock');
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customDateTime, setCustomDateTime] = useState<string>('');

  // Procedure form states
  const [procCategory, setProcCategory] = useState<ProcedureCategory | ''>('');
  const [procCount, setProcCount] = useState<number>(1);

  // Oxygen
  const [swi1000Checked, setSwi1000Checked] = useState(false);
  const [swi1000Qty, setSwi1000Qty] = useState(1);

  // NG
  const [ng14Checked, setNg14Checked] = useState(false);
  const [ng14Qty, setNg14Qty] = useState(1);

  // Suction
  const [oralChecked, setOralChecked] = useState(false);
  const [oralQty, setOralQty] = useState(1);
  const [suct16Checked, setSuct16Checked] = useState(false);
  const [suct16Qty, setSuct16Qty] = useState(1);

  // Wound
  const [dryWoundChecked, setDryWoundChecked] = useState(false);
  const [dryWoundCount, setDryWoundCount] = useState(1);
  const [dryWoundLoc, setDryWoundLoc] = useState('');
  const [nss5Checked, setNss5Checked] = useState(false);
  const [nss5Qty, setNss5Qty] = useState(1);
  const [nss100Checked, setNss100Checked] = useState(false);
  const [nss100Qty, setNss100Qty] = useState(1);

  const [infectWoundChecked, setInfectWoundChecked] = useState(false);
  const [infectWoundCount, setInfectWoundCount] = useState(1);
  const [infectWoundLoc, setInfectWoundLoc] = useState('');
  const [infectNss5Checked, setInfectNss5Checked] = useState(false);
  const [infectNss5Qty, setInfectNss5Qty] = useState(1);
  const [infectNss100Checked, setInfectNss100Checked] = useState(false);
  const [infectNss100Qty, setInfectNss100Qty] = useState(1);
  const [infectNss1000Checked, setInfectNss1000Checked] = useState(false);
  const [infectNss1000Qty, setInfectNss1000Qty] = useState(1);

  const [gauze33Checked, setGauze33Checked] = useState(false);
  const [gauze33Qty, setGauze33Qty] = useState(1);
  const [gauze44Checked, setGauze44Checked] = useState(false);
  const [gauze44Qty, setGauze44Qty] = useState(1);
  const [gauze55Checked, setGauze55Checked] = useState(false);
  const [gauze55Qty, setGauze55Qty] = useState(1);
  const [bactiChecked, setBactiChecked] = useState(false);
  const [bactiQty, setBactiQty] = useState(1);
  const [topgChecked, setTopgChecked] = useState(false);
  const [topgQty, setTopgQty] = useState(1);

  // Catheter
  const [cathDrainChecked, setCathDrainChecked] = useState(false);
  const [cathDrainQty, setCathDrainQty] = useState(1);
  const [cathRetainChecked, setCathRetainChecked] = useState(false);
  const [cathRetainQty, setCathRetainQty] = useState(1);

  const [foleyChecked, setFoleyChecked] = useState(false);
  const [foleyQty, setFoleyQty] = useState(1);
  const [surgGloveChecked, setSurgGloveChecked] = useState(false);
  const [surgGloveQty, setSurgGloveQty] = useState(1);
  const [urineBagChecked, setUrineBagChecked] = useState(false);
  const [urineBagQty, setUrineBagQty] = useState(1);
  const [swi10Checked, setSwi10Checked] = useState(false);
  const [swi10Qty, setSwi10Qty] = useState(1);
  const [nss100CathChecked, setNss100CathChecked] = useState(false);
  const [nss100CathQty, setNss100CathQty] = useState(1);

  // Injection
  const [needleChecked, setNeedleChecked] = useState(false);
  const [needleQty, setNeedleQty] = useState(1);
  const [syringeChecked, setSyringeChecked] = useState(false);
  const [syringeQty, setSyringeQty] = useState(1);
  const [procExtraDetail, setProcExtraDetail] = useState('');

  // Notification message
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  // Calculate balance for currently selected person & item
  const selectedItem = items.find((i) => i.name === selectedItemName);
  const currentItemBalance = React.useMemo(() => {
    if (!selectedPerson || !selectedItemName) return null;
    return records
      .filter((r) => r.person_name === selectedPerson && r.record_type === 'transaction' && r.item_name === selectedItemName)
      .reduce((sum, r) => sum + (r.action_type === 'receive' ? r.quantity : -r.quantity), 0);
  }, [selectedPerson, selectedItemName, records]);

  // Handle stock receive/withdraw
  const handleSaveStock = (type: 'receive' | 'withdraw') => {
    if (!selectedPerson) {
      showToast('กรุณาเลือกชื่อผู้ป่วย', 'warning');
      return;
    }
    if (!selectedItemName) {
      showToast('กรุณาเลือกรายการของใช้', 'warning');
      return;
    }
    if (!quantity || quantity <= 0) {
      showToast('กรุณาระบุจำนวนที่ถูกต้อง (มากกว่า 0)', 'warning');
      return;
    }

    const timestamp = customDateTime ? new Date(customDateTime).toISOString() : new Date().toISOString();

    onAddRecord({
      person_name: selectedPerson,
      item_name: selectedItemName,
      item_unit: selectedItem?.unit || 'ชิ้น',
      quantity: Number(quantity),
      action_type: type,
      performed_by: currentUser || 'ผู้ใช้ทั่วไป',
      timestamp,
      record_type: 'transaction',
    });

    showToast(
      type === 'receive'
        ? `บันทึกรับเข้า "${selectedItemName}" จำนวน ${quantity} ${selectedItem?.unit || ''} สำเร็จ`
        : `บันทึกเบิกออก "${selectedItemName}" จำนวน ${quantity} ${selectedItem?.unit || ''} สำเร็จ`,
      'success'
    );

    setQuantity(1);
  };

  // Handle procedure save
  const handleSaveProcedure = () => {
    if (!selectedPerson) {
      showToast('กรุณาเลือกชื่อผู้ป่วย', 'warning');
      return;
    }
    if (!procCategory) {
      showToast('กรุณาเลือกหมวดหัตถการ', 'warning');
      return;
    }

    const timestamp = customDateTime ? new Date(customDateTime).toISOString() : new Date().toISOString();
    const supplies: Record<string, number> = {};
    let detailParts: string[] = [];
    let woundLoc = '';

    const catNameMap: Record<string, string> = {
      oxygen: 'การให้ออกซิเจน',
      ng: 'ใส่สายยาง NG',
      suction: 'การดูดเสมหะ (Suction)',
      wound: 'ทำแผล',
      catheter: 'ใส่สายสวนปัสสาวะ (F/C)',
      bronchodilator: 'พ่นยาขยายหลอดลม (ใช้ออกซิเจนติดผนัง)',
      injection: 'ฉีดยา (IV/IM/SC)',
    };

    if (procCategory === 'oxygen') {
      if (swi1000Checked && swi1000Qty > 0) {
        supplies['SWI 1000 ml'] = swi1000Qty;
      }
      detailParts.push(`ให้ออกซิเจน ${procCount} ครั้ง/วัน`);
    } else if (procCategory === 'ng') {
      if (ng14Checked && ng14Qty > 0) {
        supplies['สาย NG No.14, 16'] = ng14Qty;
      }
      detailParts.push(`ใส่สายยาง NG ${procCount} ครั้ง`);
    } else if (procCategory === 'suction') {
      if (oralChecked && oralQty > 0) supplies['Oral airway'] = oralQty;
      if (suct16Checked && suct16Qty > 0) supplies['สายดูดเสมหะ No.16'] = suct16Qty;
      detailParts.push(`ดูดเสมหะ ${procCount} ครั้ง`);
    } else if (procCategory === 'wound') {
      let totalNss5 = 0;
      let totalNss100 = 0;
      let totalNss1000 = 0;

      if (dryWoundChecked) {
        detailParts.push(`แผลแห้ง/เล็ก (${dryWoundCount} ตำแหน่ง)`);
        if (dryWoundLoc) woundLoc += `แผลแห้ง: ${dryWoundLoc} `;
        if (nss5Checked && nss5Qty > 0) totalNss5 += nss5Qty;
        if (nss100Checked && nss100Qty > 0) totalNss100 += nss100Qty;
      }
      if (infectWoundChecked) {
        detailParts.push(`แผลติดเชื้อ/เปิด (${infectWoundCount} ตำแหน่ง)`);
        if (infectWoundLoc) woundLoc += `แผลเปิด: ${infectWoundLoc} `;
        if (infectNss5Checked && infectNss5Qty > 0) totalNss5 += infectNss5Qty;
        if (infectNss100Checked && infectNss100Qty > 0) totalNss100 += infectNss100Qty;
        if (infectNss1000Checked && infectNss1000Qty > 0) totalNss1000 += infectNss1000Qty;
      }
      if (totalNss5 > 0) supplies['NSS 5ml'] = totalNss5;
      if (totalNss100 > 0) supplies['NSS 100ml'] = totalNss100;
      if (totalNss1000 > 0) supplies['NSS 1000ml'] = totalNss1000;

      if (gauze33Checked && gauze33Qty > 0) supplies['Gauze ปลอดเชื้อ 3*3'] = gauze33Qty;
      if (gauze44Checked && gauze44Qty > 0) supplies['Gauze ปลอดเชื้อ 4*4'] = gauze44Qty;
      if (gauze55Checked && gauze55Qty > 0) supplies['Gauze ปลอดเชื้อ 5*5'] = gauze55Qty;
      if (bactiChecked && bactiQty > 0) supplies['Bactigras'] = bactiQty;
      if (topgChecked && topgQty > 0) supplies['Top gauze'] = topgQty;
    } else if (procCategory === 'catheter') {
      if (cathDrainChecked && cathDrainQty > 0) detailParts.push(`สวนปัสสาวะทิ้ง ${cathDrainQty} ครั้ง`);
      if (cathRetainChecked && cathRetainQty > 0) detailParts.push(`สวนปัสสาวะคาสาย ${cathRetainQty} ครั้ง`);
      if (foleyChecked && foleyQty > 0) supplies['Foley cath'] = foleyQty;
      if (surgGloveChecked && surgGloveQty > 0) supplies['Surgical glove'] = surgGloveQty;
      if (urineBagChecked && urineBagQty > 0) supplies['Urine bag 2000ml'] = urineBagQty;
      if (swi10Checked && swi10Qty > 0) supplies['SWI 10ml'] = swi10Qty;
      if (nss100CathChecked && nss100CathQty > 0) supplies['NSS 100ml'] = nss100CathQty;
    } else if (procCategory === 'bronchodilator') {
      detailParts.push(`พ่นยา ${procCount} ครั้ง`);
    } else if (procCategory === 'injection') {
      if (needleChecked && needleQty > 0) supplies['เข็ม'] = needleQty;
      if (syringeChecked && syringeQty > 0) supplies['Syringe'] = syringeQty;
      detailParts.push(`ฉีดยา ${procCount} ครั้ง`);
      if (procExtraDetail) detailParts.push(procExtraDetail);
    }

    onAddRecord({
      person_name: selectedPerson,
      item_name: catNameMap[procCategory] || procCategory,
      item_unit: '',
      quantity: 0,
      action_type: 'procedure',
      performed_by: currentUser || 'ผู้ใช้ทั่วไป',
      timestamp,
      record_type: 'procedure',
      procedure_category: procCategory,
      procedure_detail: detailParts.join(' | '),
      procedure_count: procCount,
      supplies_used: JSON.stringify(supplies),
      wound_location: woundLoc.trim(),
    });

    showToast(`บันทึกหัตถการ "${catNameMap[procCategory]}" สำเร็จ`, 'success');

    // Reset procedure form counts
    setProcCount(1);
    setProcExtraDetail('');
    if (procCategory === 'wound') {
      setDryWoundChecked(false);
      setDryWoundLoc('');
      setInfectWoundChecked(false);
      setInfectWoundLoc('');
      setNss5Checked(false);
      setNss100Checked(false);
      setInfectNss5Checked(false);
      setInfectNss100Checked(false);
      setInfectNss1000Checked(false);
      setGauze33Checked(false);
      setGauze44Checked(false);
      setGauze55Checked(false);
      setBactiChecked(false);
      setTopgChecked(false);
    }
  };

  const isItemAlertActive =
    selectedItem && selectedItem.alert_enabled !== false && selectedItem.threshold > 0;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Patient Selector Card */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-purple-200/70">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs sm:text-sm font-bold text-slate-800">
            เลือกชื่อผู้ป่วย <span className="text-rose-500">*</span>
          </label>
          {onOpenManagePatients && (
            <button
              type="button"
              onClick={onOpenManagePatients}
              className="text-2xs sm:text-xs text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200 transition font-semibold flex items-center gap-1"
              title="เพิ่มหรือลบรายชื่อผู้ป่วยในหอผู้ป่วย"
            >
              <UserPlus className="w-3 h-3 text-purple-600" />
              <span>เพิ่ม/ลบรายชื่อผู้ป่วย</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <div className="sm:col-span-2">
            <select
              id="record-person"
              value={selectedPerson}
              onChange={(e) => onSelectPerson(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-3 py-1.5 text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="">
                {persons.length === 0
                  ? '-- ยังไม่มีรายชื่อผู้ป่วยในระบบ (กดเพิ่มผู้ป่วย) --'
                  : '-- เลือกชื่อผู้ป่วย --'}
              </option>
              {persons.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {selectedPerson ? (
            <div className="text-xs bg-purple-50 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200/80 flex items-center justify-between">
              <span className="text-purple-700 font-medium">ผู้ป่วย:</span>
              <span className="font-bold text-sm text-purple-900">{selectedPerson}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic px-2">
              {persons.length === 0 ? 'รอเพิ่มรายชื่อผู้ป่วย' : 'ยังไม่ได้เลือกผู้ป่วย'}
            </div>
          )}
        </div>

        {persons.length === 0 && (
          <div className="mt-2 text-xs bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <span>ยังไม่มีรายชื่อผู้ป่วยในระบบ สามารถกดปุ่มเพื่อเพิ่มชื่อหรือเตียงผู้ป่วยได้ทันที</span>
            {onOpenManagePatients && (
              <button
                type="button"
                onClick={onOpenManagePatients}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-2.5 py-1 rounded-lg shrink-0 transition"
              >
                + เพิ่มผู้ป่วย
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Action Box */}
      <div className="bg-white rounded-2xl shadow-xs border border-purple-200/70 overflow-hidden">
        {/* Sub-tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1 gap-1.5">
          <button
            type="button"
            id="subtab-stock"
            onClick={() => setSubTab('stock')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              subTab === 'stock'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>รับ / เบิกของใช้</span>
          </button>
          <button
            type="button"
            id="subtab-procedure"
            onClick={() => setSubTab('procedure')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              subTab === 'procedure'
                ? 'bg-pink-600 text-white shadow-xs shadow-pink-200'
                : 'text-slate-600 hover:text-pink-700 hover:bg-pink-50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>ลงหัตถการ</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-3.5 sm:p-4">
          {/* Feedback Toast */}
          {message && (
            <div
              className={`mb-3 p-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium transition-all ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : message.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* SUBTAB 1: Stock Receive / Withdraw */}
          {subTab === 'stock' && (
            <div className="space-y-2.5 sm:space-y-3">
              {/* Item selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                  ชื่อของใช้ <span className="text-rose-500">*</span>
                </label>
                <select
                  id="item-select"
                  value={selectedItemName}
                  onChange={(e) => setSelectedItemName(e.target.value)}
                  className="w-full border border-purple-200 rounded-xl px-3 py-1.5 text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- เลือกรายการของใช้ --</option>
                  {items.map((it) => (
                    <option key={it.name} value={it.name}>
                      {it.name} ({it.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Live Balance Badge */}
              {selectedPerson && selectedItemName && currentItemBalance !== null && (
                <div
                  className={`p-2 px-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                    currentItemBalance < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : currentItemBalance === 0 && BEDSIDE_ITEMS.includes(selectedItemName)
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : isItemAlertActive && currentItemBalance <= (selectedItem?.threshold || 0)
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">
                      ยอด {selectedPerson}:
                    </span>
                    <span className="font-bold text-sm sm:text-base">{currentItemBalance}</span>
                    <span>{selectedItem?.unit || 'ชิ้น'}</span>
                  </div>

                  <div>
                    {currentItemBalance < 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white">
                        ยืมแผนก ({Math.abs(currentItemBalance)})
                      </span>
                    ) : currentItemBalance === 0 && BEDSIDE_ITEMS.includes(selectedItemName) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-700 text-white">
                        กำลังเปิดใช้งานข้างเตียง
                      </span>
                    ) : isItemAlertActive && currentItemBalance <= (selectedItem?.threshold || 0) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-white">
                        ใกล้หมด
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        พร้อมใช้งาน
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                  จำนวน ({selectedItem?.unit || 'ชิ้น'}) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 max-w-sm flex-wrap">
                  <div className="flex items-center border border-purple-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:bg-purple-50 active:bg-purple-100 font-bold text-base border-r border-purple-100 transition"
                      title="ลดจำนวน"
                    >
                      -
                    </button>
                    <input
                      id="item-qty"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 sm:w-16 text-center py-1 text-base font-bold text-slate-900 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:bg-purple-50 active:bg-purple-100 font-bold text-base border-l border-purple-100 transition"
                      title="เพิ่มจำนวน"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition min-h-[36px] min-w-[34px] active:scale-95 ${
                          quantity === num
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-200'
                        }`}
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Receive vs Withdraw */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                <button
                  type="button"
                  id="receive-btn"
                  onClick={() => handleSaveStock('receive')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition hover:shadow min-h-[44px]"
                >
                  <PackagePlus className="w-4.5 h-4.5" />
                  <span>รับเข้าสต็อก</span>
                </button>

                <button
                  type="button"
                  id="withdraw-btn"
                  onClick={() => handleSaveStock('withdraw')}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition hover:shadow min-h-[44px]"
                >
                  <PackageMinus className="w-4.5 h-4.5" />
                  <span>เบิกใช้งาน</span>
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB 2: Bedside Procedures */}
          {subTab === 'procedure' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                  เลือกหมวดหัตถการ <span className="text-pink-600">*</span>
                </label>
                <select
                  id="proc-category"
                  value={procCategory}
                  onChange={(e) => setProcCategory(e.target.value as ProcedureCategory)}
                  className="w-full border border-pink-200 rounded-xl px-3 py-1.5 text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium shadow-2xs"
                >
                  <option value="">-- เลือกหมวดหัตถการ --</option>
                  {PROCEDURE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category-specific dynamic forms */}
              {procCategory && (
                <div className="bg-pink-50/60 border border-pink-200/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
                  {/* 1. Oxygen */}
                  {procCategory === 'oxygen' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pink-950">การให้ออกซิเจน</span>
                        <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                          <span>จำนวน (ต่อวัน):</span>
                          <input
                            type="number"
                            min="1"
                            value={procCount}
                            onChange={(e) => setProcCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          />
                        </label>
                      </div>
                      <div className="border-t border-pink-100 pt-3">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-800">
                          <input
                            type="checkbox"
                            checked={swi1000Checked}
                            onChange={(e) => setSwi1000Checked(e.target.checked)}
                            className="rounded text-pink-600 focus:ring-pink-400 w-4 h-4"
                          />
                          <span>SWI 1000 ml (ขวด)</span>
                        </label>
                        {swi1000Checked && (
                          <div className="ml-6 mt-1 flex items-center gap-2 text-xs text-slate-600">
                            <span>จำนวนที่ใช้:</span>
                            <input
                              type="number"
                              min="1"
                              value={swi1000Qty}
                              onChange={(e) => setSwi1000Qty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 bg-white border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                            />
                            <span>ขวด</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. NG Tube */}
                  {procCategory === 'ng' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pink-950">ใส่สายยาง NG</span>
                        <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                          <span>จำนวนครั้ง:</span>
                          <input
                            type="number"
                            min="1"
                            value={procCount}
                            onChange={(e) => setProcCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          />
                        </label>
                      </div>
                      <div className="border-t border-pink-100 pt-3">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-800">
                          <input
                            type="checkbox"
                            checked={ng14Checked}
                            onChange={(e) => setNg14Checked(e.target.checked)}
                            className="rounded text-pink-600 focus:ring-pink-400 w-4 h-4"
                          />
                          <span>สาย NG No.14, 16 (เส้น)</span>
                        </label>
                        {ng14Checked && (
                          <div className="ml-6 mt-1 flex items-center gap-2 text-xs text-slate-600">
                            <span>จำนวนที่ใช้:</span>
                            <input
                              type="number"
                              min="1"
                              value={ng14Qty}
                              onChange={(e) => setNg14Qty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 bg-white border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                            />
                            <span>เส้น</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Suction */}
                  {procCategory === 'suction' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pink-950">การดูดเสมหะ (Suction)</span>
                        <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                          <span>จำนวนครั้ง:</span>
                          <input
                            type="number"
                            min="1"
                            value={procCount}
                            onChange={(e) => setProcCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          />
                        </label>
                      </div>
                      <div className="border-t border-pink-100 pt-3 space-y-2">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-800">
                            <input
                              type="checkbox"
                              checked={oralChecked}
                              onChange={(e) => setOralChecked(e.target.checked)}
                              className="rounded text-pink-600 focus:ring-pink-400 w-4 h-4"
                            />
                            <span>Oral airway No.80, 90, 100 (อัน)</span>
                          </label>
                          {oralChecked && (
                            <div className="ml-6 mt-1 flex items-center gap-2 text-xs text-slate-600">
                              <span>จำนวน:</span>
                              <input
                                type="number"
                                min="1"
                                value={oralQty}
                                onChange={(e) => setOralQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 bg-white border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-slate-800">
                            <input
                              type="checkbox"
                              checked={suct16Checked}
                              onChange={(e) => setSuct16Checked(e.target.checked)}
                              className="rounded text-pink-600 focus:ring-pink-400 w-4 h-4"
                            />
                            <span>สายดูดเสมหะ No.16 (เส้น)</span>
                          </label>
                          {suct16Checked && (
                            <div className="ml-6 mt-1 flex items-center gap-2 text-xs text-slate-600">
                              <span>จำนวน:</span>
                              <input
                                type="number"
                                min="1"
                                value={suct16Qty}
                                onChange={(e) => setSuct16Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 bg-white border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Wound */}
                  {procCategory === 'wound' && (
                    <div className="space-y-4">
                      <span className="font-bold text-pink-950 block">ทำแผล (Wound Dressing)</span>

                      {/* Wound Type 1: Dry wound */}
                      <div className="bg-white p-3 rounded-xl border border-pink-100 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dryWoundChecked}
                            onChange={(e) => setDryWoundChecked(e.target.checked)}
                            className="rounded text-pink-600 focus:ring-pink-400 w-4 h-4"
                          />
                          <span>แผลแห้ง / ขนาดเล็ก (&lt; 3x3 cms)</span>
                        </label>
                        {dryWoundChecked && (
                          <div className="ml-6 space-y-2 pt-1 text-xs">
                            <div className="flex gap-2 items-center flex-wrap">
                              <label className="flex items-center gap-1 text-slate-700">
                                <span>จำนวนตำแหน่ง:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={dryWoundCount}
                                  onChange={(e) => setDryWoundCount(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-slate-800 focus:ring-pink-400"
                                />
                              </label>
                              <input
                                type="text"
                                placeholder="ระบุตำแหน่งแผล (เช่น ก้นกบ, แขนขวา)"
                                value={dryWoundLoc}
                                onChange={(e) => setDryWoundLoc(e.target.value)}
                                className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-pink-400"
                              />
                            </div>
                            <div className="flex gap-4 items-center flex-wrap pt-1 border-t border-slate-100">
                              <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={nss5Checked}
                                  onChange={(e) => setNss5Checked(e.target.checked)}
                                  className="rounded text-pink-600 focus:ring-pink-400"
                                />
                                <span>NSS 5 ml</span>
                                {nss5Checked && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={nss5Qty}
                                    onChange={(e) => setNss5Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 border border-pink-200 rounded px-1 text-center font-bold focus:ring-pink-400"
                                  />
                                )}
                              </label>

                              <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={nss100Checked}
                                  onChange={(e) => setNss100Checked(e.target.checked)}
                                  className="rounded text-pink-600 focus:ring-pink-400"
                                />
                                <span>NSS 100 ml</span>
                                {nss100Checked && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={nss100Qty}
                                    onChange={(e) => setNss100Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 border border-pink-200 rounded px-1 text-center font-bold focus:ring-pink-400"
                                  />
                                )}
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wound Type 2: Infected / Open wound */}
                      <div className="bg-white p-3 rounded-xl border border-pink-100 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={infectWoundChecked}
                            onChange={(e) => setInfectWoundChecked(e.target.checked)}
                            className="rounded text-pink-600 focus:ring-pink-400 w-4 h-4"
                          />
                          <span>แผลติดเชื้อ / แผลเปิด</span>
                        </label>
                        {infectWoundChecked && (
                          <div className="ml-6 space-y-2 pt-1 text-xs">
                            <div className="flex gap-2 items-center flex-wrap">
                              <label className="flex items-center gap-1 text-slate-700">
                                <span>จำนวนตำแหน่ง:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={infectWoundCount}
                                  onChange={(e) => setInfectWoundCount(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-slate-800 focus:ring-pink-400"
                                />
                              </label>
                              <input
                                type="text"
                                placeholder="ระบุตำแหน่งแผลติดเชื้อ"
                                value={infectWoundLoc}
                                onChange={(e) => setInfectWoundLoc(e.target.value)}
                                className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:ring-pink-400"
                              />
                            </div>
                            <div className="flex gap-4 items-center flex-wrap pt-1 border-t border-slate-100">
                              <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={infectNss5Checked}
                                  onChange={(e) => setInfectNss5Checked(e.target.checked)}
                                  className="rounded text-pink-600 focus:ring-pink-400"
                                />
                                <span>NSS 5 ml</span>
                                {infectNss5Checked && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={infectNss5Qty}
                                    onChange={(e) => setInfectNss5Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 border border-pink-200 rounded px-1 text-center font-bold focus:ring-pink-400"
                                  />
                                )}
                              </label>

                              <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={infectNss100Checked}
                                  onChange={(e) => setInfectNss100Checked(e.target.checked)}
                                  className="rounded text-pink-600 focus:ring-pink-400"
                                />
                                <span>NSS 100 ml</span>
                                {infectNss100Checked && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={infectNss100Qty}
                                    onChange={(e) => setInfectNss100Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 border border-pink-200 rounded px-1 text-center font-bold focus:ring-pink-400"
                                  />
                                )}
                              </label>

                              <label className="flex items-center gap-1 cursor-pointer text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={infectNss1000Checked}
                                  onChange={(e) => setInfectNss1000Checked(e.target.checked)}
                                  className="rounded text-pink-600 focus:ring-pink-400"
                                />
                                <span>NSS 1000 ml</span>
                                {infectNss1000Checked && (
                                  <input
                                    type="number"
                                    min="1"
                                    value={infectNss1000Qty}
                                    onChange={(e) => setInfectNss1000Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 border border-pink-200 rounded px-1 text-center font-bold focus:ring-pink-400"
                                  />
                                )}
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Wound dressing supplies */}
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-pink-950 block">อุปกรณ์ทำแผลเพิ่มเติมจาก set DW:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={gauze33Checked}
                                onChange={(e) => setGauze33Checked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Gauze ปลอดเชื้อ 3*3</span>
                            </span>
                            {gauze33Checked && (
                              <input
                                type="number"
                                min="1"
                                value={gauze33Qty}
                                onChange={(e) => setGauze33Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={gauze44Checked}
                                onChange={(e) => setGauze44Checked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Gauze ปลอดเชื้อ 4*4</span>
                            </span>
                            {gauze44Checked && (
                              <input
                                type="number"
                                min="1"
                                value={gauze44Qty}
                                onChange={(e) => setGauze44Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={gauze55Checked}
                                onChange={(e) => setGauze55Checked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Gauze ปลอดเชื้อ 5*5</span>
                            </span>
                            {gauze55Checked && (
                              <input
                                type="number"
                                min="1"
                                value={gauze55Qty}
                                onChange={(e) => setGauze55Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={bactiChecked}
                                onChange={(e) => setBactiChecked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Bactigras (แผ่น)</span>
                            </span>
                            {bactiChecked && (
                              <input
                                type="number"
                                min="1"
                                value={bactiQty}
                                onChange={(e) => setBactiQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={topgChecked}
                                onChange={(e) => setTopgChecked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Top gauze (แผ่น)</span>
                            </span>
                            {topgChecked && (
                              <input
                                type="number"
                                min="1"
                                value={topgQty}
                                onChange={(e) => setTopgQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Catheter (F/C) */}
                  {procCategory === 'catheter' && (
                    <div className="space-y-3">
                      <span className="font-bold text-pink-950 block">ใส่สายสวนปัสสาวะ (F/C)</span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-pink-100">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={cathDrainChecked}
                              onChange={(e) => setCathDrainChecked(e.target.checked)}
                              className="rounded text-pink-600 focus:ring-pink-400"
                            />
                            <span>สวนปัสสาวะทิ้ง (ครั้ง)</span>
                          </span>
                          {cathDrainChecked && (
                            <input
                              type="number"
                              min="1"
                              value={cathDrainQty}
                              onChange={(e) => setCathDrainQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                            />
                          )}
                        </label>

                        <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-pink-100">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={cathRetainChecked}
                              onChange={(e) => setCathRetainChecked(e.target.checked)}
                              className="rounded text-pink-600 focus:ring-pink-400"
                            />
                            <span>สวนปัสสาวะคาสาย (ครั้ง)</span>
                          </span>
                          {cathRetainChecked && (
                            <input
                              type="number"
                              min="1"
                              value={cathRetainQty}
                              onChange={(e) => setCathRetainQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                            />
                          )}
                        </label>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-pink-950 block">อุปกรณ์ที่ใช้:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={foleyChecked}
                                onChange={(e) => setFoleyChecked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Foley cath (เส้น)</span>
                            </span>
                            {foleyChecked && (
                              <input
                                type="number"
                                min="1"
                                value={foleyQty}
                                onChange={(e) => setFoleyQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={surgGloveChecked}
                                onChange={(e) => setSurgGloveChecked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Surgical glove (คู่)</span>
                            </span>
                            {surgGloveChecked && (
                              <input
                                type="number"
                                min="1"
                                value={surgGloveQty}
                                onChange={(e) => setSurgGloveQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={urineBagChecked}
                                onChange={(e) => setUrineBagChecked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>Urine bag 2000ml (ถุง)</span>
                            </span>
                            {urineBagChecked && (
                              <input
                                type="number"
                                min="1"
                                value={urineBagQty}
                                onChange={(e) => setUrineBagQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={swi10Checked}
                                onChange={(e) => setSwi10Checked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>SWI 10 ml (อัน)</span>
                            </span>
                            {swi10Checked && (
                              <input
                                type="number"
                                min="1"
                                value={swi10Qty}
                                onChange={(e) => setSwi10Qty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>

                          <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-pink-100 sm:col-span-2">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <input
                                type="checkbox"
                                checked={nss100CathChecked}
                                onChange={(e) => setNss100CathChecked(e.target.checked)}
                                className="rounded text-pink-600 focus:ring-pink-400"
                              />
                              <span>NSS 100 ml (ขวด)</span>
                            </span>
                            {nss100CathChecked && (
                              <input
                                type="number"
                                min="1"
                                value={nss100CathQty}
                                onChange={(e) => setNss100CathQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 border border-pink-200 rounded px-1.5 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                              />
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Bronchodilator */}
                  {procCategory === 'bronchodilator' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pink-950">พ่นยาขยายหลอดลม (ใช้ออกซิเจนติดผนัง)</span>
                        <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                          <span>จำนวนครั้ง:</span>
                          <input
                            type="number"
                            min="1"
                            value={procCount}
                            onChange={(e) => setProcCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 7. Injection */}
                  {procCategory === 'injection' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pink-950">ฉีดยา (IV / IM / SC)</span>
                        <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
                          <span>จำนวนครั้ง:</span>
                          <input
                            type="number"
                            min="1"
                            value={procCount}
                            onChange={(e) => setProcCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                        <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-pink-100">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={needleChecked}
                              onChange={(e) => setNeedleChecked(e.target.checked)}
                              className="rounded text-pink-600 focus:ring-pink-400"
                            />
                            <span>เข็มฉีดยา</span>
                          </span>
                          {needleChecked && (
                            <input
                              type="number"
                              min="1"
                              value={needleQty}
                              onChange={(e) => setNeedleQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                            />
                          )}
                        </label>

                        <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-pink-100">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={syringeChecked}
                              onChange={(e) => setSyringeChecked(e.target.checked)}
                              className="rounded text-pink-600 focus:ring-pink-400"
                            />
                            <span>Syringe</span>
                          </span>
                          {syringeChecked && (
                            <input
                              type="number"
                              min="1"
                              value={syringeQty}
                              onChange={(e) => setSyringeQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 border border-pink-200 rounded px-2 py-0.5 text-center font-bold text-slate-800 focus:ring-pink-400"
                            />
                          )}
                        </label>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-bold text-pink-950 mb-1">
                          รายละเอียดเพิ่มเติม (เช่น ชื่อยา, ตำแหน่งฉีด):
                        </label>
                        <textarea
                          rows={2}
                          value={procExtraDetail}
                          onChange={(e) => setProcExtraDetail(e.target.value)}
                          placeholder="ระบุชื่อยา หรือตำแหน่งที่ฉีด"
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Save Procedure Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      id="save-proc-btn"
                      onClick={handleSaveProcedure}
                      className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition hover:shadow shadow-pink-200 active:scale-[0.99]"
                    >
                      <Stethoscope className="w-5 h-5" />
                      <span>บันทึกข้อมูลหัตถการ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
