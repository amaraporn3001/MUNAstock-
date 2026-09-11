import React, { useState, useMemo } from 'react';
import { ItemDefinition, StockRecord, BedSummaryItem } from '../types';
import { BEDSIDE_ITEMS } from '../data/defaultData';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  BarChart2,
  Plus,
  Minus,
  User,
  Info,
  Download,
} from 'lucide-react';

interface SummaryTabProps {
  persons: string[];
  items: ItemDefinition[];
  records: StockRecord[];
  selectedPerson: string;
  onSelectPerson: (person: string) => void;
  onQuickAction: (person: string, itemName: string, type: 'receive' | 'withdraw') => void;
  onOpenExport?: () => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  persons,
  items,
  records,
  selectedPerson,
  onSelectPerson,
  onQuickAction,
  onOpenExport,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'borrowed'>('all');

  // Calculate current balances for the selected bed
  const summaryData = useMemo(() => {
    if (!selectedPerson) return { itemsList: [], diaperAvg: null, underpadAvg: null };

    // Filter transactions for this bed
    const personRecords = records
      .filter((r) => r.person_name === selectedPerson && r.record_type === 'transaction')
      .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

    const totals: Record<string, number> = {};
    const recordedNames = new Set<string>();

    personRecords.forEach((r) => {
      if (!r.item_name) return;
      recordedNames.add(r.item_name);
      if (!totals[r.item_name]) totals[r.item_name] = 0;
      const qty = Number(r.quantity) || 0;
      totals[r.item_name] += r.action_type === 'receive' ? qty : -qty;
    });

    // Build standard items list
    const itemsList: BedSummaryItem[] = [];

    // First add standard catalog items
    items.forEach((it) => {
      const qty = totals[it.name] ?? 0;
      const isRecorded = recordedNames.has(it.name);
      // Only display if recorded or if it's a critical item
      if (!isRecorded && qty === 0) return;

      const isAlertActive = it.alert_enabled !== false && it.threshold > 0;
      const isBorrowed = qty < 0;
      const isLow = isAlertActive && qty <= it.threshold && qty >= 0;
      const isBedsideActive = qty === 0 && BEDSIDE_ITEMS.includes(it.name);

      itemsList.push({
        name: it.name,
        unit: it.unit,
        quantity: qty,
        threshold: it.threshold,
        isBorrowed,
        isLow,
        isBedsideActive,
        isCustom: false,
      });
    });

    // Next add any custom recorded items
    recordedNames.forEach((name) => {
      if (items.some((i) => i.name === name)) return;
      const qty = totals[name] || 0;
      const lastRec = personRecords.find((r) => r.item_name === name);
      const unit = lastRec?.item_unit || 'ชิ้น';
      const isBorrowed = qty < 0;
      const isLow = qty <= 1 && qty >= 0;
      const isBedsideActive = qty === 0 && BEDSIDE_ITEMS.includes(name);

      itemsList.push({
        name,
        unit,
        quantity: qty,
        threshold: 1,
        isBorrowed,
        isLow,
        isBedsideActive,
        isCustom: true,
      });
    });

    // Average Diaper & Underpad Usage
    const withdrawRecords = personRecords.filter((r) => r.action_type === 'withdraw');

    const calcAvg = (targetItem: string) => {
      const targetWithdraws = withdrawRecords.filter((r) => r.item_name === targetItem);
      if (!targetWithdraws.length) return null;
      const totalQty = targetWithdraws.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
      const uniqueDays = new Set(targetWithdraws.map((r) => new Date(r.timestamp).toDateString())).size;
      const avgDay = uniqueDays > 0 ? totalQty / uniqueDays : 0;
      const avgMonth = Math.round(avgDay * 30);
      return {
        totalQty,
        uniqueDays,
        avgDay: avgDay.toFixed(1),
        avgMonth,
      };
    };

    return {
      itemsList,
      diaperAvg: calcAvg('แพมเพิส'),
      underpadAvg: calcAvg('แผ่นรองซับ'),
    };
  }, [selectedPerson, items, records]);

  // Ward summary statistics
  const wardStats = useMemo(() => {
    let totalBorrowedCount = 0;
    let totalLowCount = 0;

    persons.forEach((person) => {
      const pRecords = records.filter(
        (r) => r.person_name === person && r.record_type === 'transaction'
      );
      const totals: Record<string, number> = {};
      pRecords.forEach((r) => {
        totals[r.item_name] = (totals[r.item_name] || 0) + (r.action_type === 'receive' ? r.quantity : -r.quantity);
      });

      items.forEach((it) => {
        const qty = totals[it.name];
        const isAlertActive = it.alert_enabled !== false && it.threshold > 0;
        if (qty !== undefined) {
          if (qty < 0) totalBorrowedCount++;
          else if (isAlertActive && qty <= it.threshold) totalLowCount++;
        }
      });
    });

    return { totalBorrowedCount, totalLowCount };
  }, [persons, items, records]);

  // Filter items by status
  const displayedItems = useMemo(() => {
    if (filterMode === 'low') {
      return summaryData.itemsList.filter((i) => i.isLow);
    }
    if (filterMode === 'borrowed') {
      return summaryData.itemsList.filter((i) => i.isBorrowed);
    }
    return summaryData.itemsList;
  }, [summaryData.itemsList, filterMode]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Top Controls: Bed selector & quick status chips */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-purple-100 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              เลือกผู้ป่วยที่ต้องการดูสรุปสต็อก <span className="text-rose-500">*</span>
            </label>
            <select
              id="sum-person"
              value={selectedPerson}
              onChange={(e) => onSelectPerson(e.target.value)}
              className="w-full border border-purple-200 rounded-xl px-3 py-1.5 text-sm sm:text-base text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            >
              <option value="">-- เลือกชื่อผู้ป่วย --</option>
              {persons.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Quick ward alert metrics */}
          <div className="flex gap-2">
            <div className="flex-1 bg-rose-50 border border-rose-100 rounded-xl p-1.5 sm:p-2 text-center">
              <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700 block">ยืมแผนก</span>
              <span className="text-base sm:text-lg font-bold text-rose-900 leading-tight">
                {wardStats.totalBorrowedCount}
              </span>
            </div>
            <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-1.5 sm:p-2 text-center">
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 block">ใกล้หมด</span>
              <span className="text-base sm:text-lg font-bold text-amber-900 leading-tight">
                {wardStats.totalLowCount}
              </span>
            </div>
          </div>
        </div>

        {selectedPerson && (
          <div className="flex items-center justify-between border-t border-purple-50 pt-1.5 flex-wrap gap-1.5">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-0.5">กรอง:</span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`text-xs px-2 py-0.5 rounded-lg font-medium transition ${
                  filterMode === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({summaryData.itemsList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('low')}
                className={`text-xs px-2 py-0.5 rounded-lg font-medium transition ${
                  filterMode === 'low'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                ใกล้หมด
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('borrowed')}
                className={`text-xs px-2 py-0.5 rounded-lg font-medium transition ${
                  filterMode === 'borrowed'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                ยืมแผนก
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">
                ผู้ป่วย: <strong className="text-purple-700">{selectedPerson}</strong>
              </span>
              {onOpenExport && (
                <button
                  type="button"
                  id="btn-summary-export-csv"
                  onClick={onOpenExport}
                  className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200/80 transition"
                  title="ส่งออกรายงานข้อมูลสต็อกเป็นไฟล์ CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออก CSV</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stock Items List for Selected Patient */}
      <div id="summary-list" className="space-y-1.5">
        {!selectedPerson ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-purple-100 space-y-1.5">
            <User className="w-8 h-8 text-purple-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              กรุณาเลือกผู้ป่วยด้านบนเพื่อดูยอดคงเหลือของใช้
            </p>
            <p className="text-xs text-slate-400">
              ระบบจะคำนวณยอดรับเข้า-เบิกออก และแสดงสถานะเปิดใช้งานข้างเตียง/ยืมแผนกโดยอัตโนมัติ
            </p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-purple-100">
            <p className="text-sm text-slate-500 font-medium">ยังไม่มีข้อมูลของใช้สำหรับผู้ป่วยรายนี้</p>
            <p className="text-xs text-slate-400 mt-0.5">
              ไปที่แท็บ "คีย์ข้อมูล" เพื่อบันทึกรับเข้าของใช้สำหรับผู้ป่วยรายนี้ได้ทันที
            </p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.name}
              className={`rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 shadow-xs transition-all flex items-center justify-between gap-2.5 ${
                item.isBorrowed
                  ? 'bg-rose-950 text-white border-l-4 border-rose-600 shadow-md'
                  : item.isLow
                  ? 'bg-amber-50/80 border-l-4 border-amber-500 text-slate-800'
                  : 'bg-white border border-purple-50 text-slate-800'
              }`}
            >
              {/* Item Info */}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.isBorrowed && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300 animate-pulse shrink-0" />
                  )}
                  {item.isLow && !item.isBorrowed && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}

                  <span className="font-bold text-xs sm:text-sm truncate">{item.name}</span>
                  <span
                    className={`text-[11px] ${
                      item.isBorrowed ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    ({item.unit})
                  </span>

                  {/* Badges */}
                  {item.isBorrowed && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-800 text-rose-100 border border-rose-700">
                      ยืมแผนก
                    </span>
                  )}

                  {item.isBedsideActive && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      กำลังเปิดใช้งานข้างเตียง
                    </span>
                  )}

                  {item.isLow && !item.isBorrowed && !item.isBedsideActive && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      ใกล้หมด
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity & Quick actions */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Balance number */}
                <div className="text-right">
                  <span
                    className={`text-base sm:text-lg font-black leading-tight ${
                      item.isBorrowed
                        ? 'text-white'
                        : item.isLow
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {item.quantity}
                  </span>
                  <span
                    className={`text-[10px] block leading-none ${
                      item.isBorrowed ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    {item.unit}
                  </span>
                </div>

                {/* Quick Add/Withdraw buttons */}
                <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => onQuickAction(selectedPerson, item.name, 'receive')}
                    className={`p-1.5 rounded-lg transition min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95 shadow-2xs ${
                      item.isBorrowed
                        ? 'bg-rose-800 text-white hover:bg-rose-700'
                        : 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200'
                    }`}
                    title={`รับเข้า ${item.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAction(selectedPerson, item.name, 'withdraw')}
                    className={`p-1.5 rounded-lg transition min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95 shadow-2xs ${
                      item.isBorrowed
                        ? 'bg-rose-800 text-white hover:bg-rose-700'
                        : 'bg-rose-100/80 text-rose-800 hover:bg-rose-200'
                    }`}
                    title={`เบิกใช้ ${item.name}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Average Consumption Analysis Section (Moved below stock list) */}
      {selectedPerson && (summaryData.diaperAvg || summaryData.underpadAvg) && (
        <div
          id="avg-section"
          className="bg-white rounded-xl p-3 sm:p-3.5 shadow-xs border border-purple-100 space-y-2"
        >
          <div className="flex items-center gap-1.5 text-purple-800 pb-1.5 border-b border-purple-50">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-xs sm:text-sm">
              📊 คำนวณอัตราเฉลี่ยการเบิกใช้ ({selectedPerson})
            </h3>
          </div>

          <div id="avg-content" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Diapers */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-xs">แพมเพิส (ผู้ใหญ่)</span>
                <span className="text-[10px] text-purple-600 bg-white px-1.5 py-0.2 rounded-full font-medium">
                  เบิกไปแล้ว {summaryData.diaperAvg?.totalQty || 0} ชิ้น
                </span>
              </div>
              {summaryData.diaperAvg ? (
                <div className="text-xs text-slate-700 space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <span>เฉลี่ยต่อวัน:</span>
                    <span className="text-sm font-bold text-purple-700">
                      {summaryData.diaperAvg.avgDay} <span className="text-[11px] font-normal">ชิ้น/วัน</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-purple-100/80 pt-0.5">
                    <span>ประมาณการ 30 วัน:</span>
                    <span className="text-xs font-bold text-purple-800">
                      {summaryData.diaperAvg.avgMonth} ชิ้น/เดือน
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">ยังไม่มีประวัติการเบิกแพมเพิส</p>
              )}
            </div>

            {/* Underpads */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 text-xs">แผ่นรองซับ (Underpads)</span>
                <span className="text-[10px] text-purple-600 bg-white px-1.5 py-0.2 rounded-full font-medium">
                  เบิกไปแล้ว {summaryData.underpadAvg?.totalQty || 0} แผ่น
                </span>
              </div>
              {summaryData.underpadAvg ? (
                <div className="text-xs text-slate-700 space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <span>เฉลี่ยต่อวัน:</span>
                    <span className="text-sm font-bold text-purple-700">
                      {summaryData.underpadAvg.avgDay} <span className="text-[11px] font-normal">แผ่น/วัน</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-purple-100/80 pt-0.5">
                    <span>ประมาณการ 30 วัน:</span>
                    <span className="text-xs font-bold text-purple-800">
                      {summaryData.underpadAvg.avgMonth} แผ่น/เดือน
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">ยังไม่มีประวัติการเบิกแผ่นรองซับ</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
