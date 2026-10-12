import React, { useState, useMemo } from 'react';
import { StockRecord, ItemDefinition } from '../types';
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
  Pencil,
  Table as TableIcon,
  LayoutGrid,
  Eraser,
} from 'lucide-react';
import { EditRecordModal } from './EditRecordModal';
import { generateHistoryCSV } from '../utils/csvExportHelper';

interface HistoryTabProps {
  records: StockRecord[];
  persons: string[];
  items?: ItemDefinition[];
  deletedRecordIds?: string[];
  onDeleteRequest: (record: StockRecord) => void;
  onUpdateRecord?: (record: StockRecord) => void;
  onOpenClearHistory?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  records,
  persons,
  items = [],
  deletedRecordIds = [],
  onDeleteRequest,
  onUpdateRecord,
  onOpenClearHistory,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingRecord, setEditingRecord] = useState<StockRecord | null>(null);

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

  // Helper to get active non-deleted records
  const getDeletedRecordIdsSet = (): Set<string> => {
    const s = new Set<string>(deletedRecordIds);
    try {
      const saved = localStorage.getItem('aging_ward_deleted_record_ids');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          arr.forEach((id) => s.add(id));
        }
      }
    } catch {
      // ignore
    }
    return s;
  };

  // Filter records (strictly excluding any confirmed deleted records)
  const filteredRecords = useMemo(() => {
    const deletedSet = getDeletedRecordIdsSet();
    return records
      .filter((r) => {
        if (!r || !r.id) return false;
        // Never include any confirmed deleted record
        if (deletedSet.has(r.id) || r.is_deleted || r.deleted || r.status === 'deleted') {
          return false;
        }

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
  }, [records, selectedPerson, selectedType, fromDate, toDate, searchQuery, deletedRecordIds]);

  // Export CSV with itemized supplies for accurate SUM
  const handleExportCSV = () => {
    if (!filteredRecords.length) return;
    const csvContent = generateHistoryCSV(filteredRecords, { itemizeSupplies: true });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aging-ward-history-itemized-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Filter Card */}
      <div className="bg-white/95 rounded-2xl p-3 sm:p-3.5 shadow-xs border border-purple-100 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1.5 pb-1.5 border-b border-purple-50">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-500" />
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">ตัวกรองค้นหาประวัติ</h3>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] text-slate-400">เลือกช่วง:</span>
            <button
              type="button"
              onClick={() => handleQuickDate('today')}
              className={`text-xs px-2.5 py-0.5 rounded-lg font-medium transition ${
                fromDate === todayStr && toDate === todayStr
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-400 text-white font-semibold shadow-2xs'
                  : 'bg-purple-50/70 text-purple-700 hover:bg-purple-100/70'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('7days')}
              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50/70 text-purple-700 hover:bg-purple-100/70 font-medium transition"
            >
              7 วัน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('month')}
              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50/70 text-purple-700 hover:bg-purple-100/70 font-medium transition"
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('all')}
              className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition"
            >
              ทั้งหมด
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Date from */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">จากวันที่</label>
            <input
              id="hist-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-purple-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ถึงวันที่</label>
            <input
              id="hist-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-purple-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Person selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ชื่อผู้ป่วย</label>
            <select
              id="hist-person"
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full border border-purple-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">ผู้ป่วยทุกคน</option>
              {persons.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Record type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ประเภทรายการ</label>
            <select
              id="hist-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-purple-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">ทั้งหมด</option>
              <option value="transaction">รับ / เบิกของใช้</option>
              <option value="procedure">หัตถการผู้ป่วย</option>
            </select>
          </div>
        </div>

        {/* Search bar & summary line with View Mode Toggle */}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="ค้นหาของใช้, หัตถการ, ตำแหน่งแผล, ผู้บันทึก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs border border-purple-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View mode toggle (Table / Cards) */}
          <div className="flex items-center bg-purple-50/80 p-0.5 rounded-lg border border-purple-100">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-700 hover:bg-purple-100/60'
              }`}
              title="แสดงเป็นตาราง (Table View)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ตาราง</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-700 hover:bg-purple-100/60'
              }`}
              title="แสดงเป็นการ์ด (Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ด</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-medium">พบ {filteredRecords.length} รายการ</span>

            {onOpenClearHistory && (
              <button
                type="button"
                onClick={onOpenClearHistory}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition cursor-pointer shadow-2xs"
                title="เคลียร์ประวัติเก่าเพื่อลดภาระ Firebase โดยคงยอดสต็อกเท่าเดิม"
              >
                <Eraser className="w-3.5 h-3.5 text-amber-600" />
                <span>เคลียร์ประวัติ (ยอดยกมา)</span>
              </button>
            )}

            {filteredRecords.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-100 transition cursor-pointer"
                title="ดาวน์โหลดไฟล์ Excel/CSV สำหรับส่งเวร"
              >
                <Download className="w-3 h-3" />
                <span>ส่งออก CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Items Display */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-purple-100 space-y-1.5 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">ไม่พบประวัติรายการตามเงื่อนไขที่เลือก</p>
          <p className="text-xs text-slate-400">ลองเปลี่ยนช่วงวันที่ หรือล้างตัวกรองเพื่อดูรายการทั้งหมด</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-xs border border-purple-100 overflow-hidden">
          <div className="sm:hidden px-3 py-1.5 bg-purple-50/70 border-b border-purple-100 text-[11px] text-purple-700 font-medium flex items-center justify-between">
            <span>👉 เลื่อนหน้าจอแนวนอนเพื่อดูตารางแบบเต็ม</span>
            <span className="font-bold">{filteredRecords.length} แถว</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/40 text-slate-700 font-bold border-b border-purple-100">
                  <th className="py-2.5 px-3 whitespace-nowrap">วัน-เวลา</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ผู้ป่วย / เตียง</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ประเภท</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">รายการ</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center">จำนวน</th>
                  <th className="py-2.5 px-3 min-w-[220px]">รายละเอียด / อุปกรณ์ที่ใช้</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ผู้บันทึก</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-slate-700">
                {filteredRecords.map((r, index) => {
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

                  const isProcedure = r.record_type === 'procedure';
                  const isReceive = r.action_type === 'receive';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-purple-50/60 transition-colors ${
                        index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="font-semibold text-slate-800 text-xs">{dateStr}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{timeStr} น.</div>
                      </td>

                      {/* Patient Name / Bed */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          <span>{r.person_name}</span>
                        </div>
                      </td>

                      {/* Record Type Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        {isProcedure ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                            <Stethoscope className="w-3 h-3 text-pink-600" />
                            <span>หัตถการ</span>
                          </span>
                        ) : isReceive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            <span>รับเข้าสต็อก</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            <span>เบิกใช้งาน</span>
                          </span>
                        )}
                      </td>

                      {/* Item Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {r.item_name}
                        </span>
                      </td>

                      {/* Quantity / Count */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center align-top">
                        {isProcedure ? (
                          <span className="inline-block px-2 py-0.5 bg-pink-50 text-pink-700 font-bold rounded-lg text-xs border border-pink-100">
                            {r.procedure_count || 1} ครั้ง
                          </span>
                        ) : isReceive ? (
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-100">
                            +{r.quantity} {r.item_unit}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-lg text-xs border border-rose-100">
                            -{r.quantity} {r.item_unit}
                          </span>
                        )}
                      </td>

                      {/* Details / Supplies */}
                      <td className="py-2.5 px-3 align-top">
                        {isProcedure ? (
                          <div className="space-y-1">
                            {r.procedure_detail && (
                              <div className="text-[11px] text-slate-700">
                                <span className="font-bold text-pink-900">รายละเอียด:</span>{' '}
                                {r.procedure_detail}
                              </div>
                            )}
                            {r.wound_location && (
                              <div className="text-[11px] text-slate-700">
                                <span className="font-bold text-pink-900">ตำแหน่งแผล:</span>{' '}
                                {r.wound_location}
                              </div>
                            )}
                            {suppliesList.length > 0 && (
                              <div className="text-[11px] flex flex-wrap gap-1 pt-0.5">
                                <span className="font-bold text-pink-900 shrink-0">อุปกรณ์:</span>
                                {suppliesList.map((sup, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-pink-50 text-pink-700 px-1.5 py-0.2 rounded border border-pink-100 text-[10px] font-medium"
                                  >
                                    {sup}
                                  </span>
                                ))}
                              </div>
                            )}
                            {!r.procedure_detail && !r.wound_location && suppliesList.length === 0 && (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Recorded By */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1 font-medium text-slate-600 text-xs">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{r.performed_by || 'ไม่ระบุ'}</span>
                        </div>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(r)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            title="แก้ไขการคีย์ข้อมูลรายการนี้"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRequest(r)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-purple-50/40 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            <span>แสดงรายการทั้งหมด {filteredRecords.length} รายการ</span>
            <span className="text-[11px] text-purple-700 font-medium">ตารางประวัติเรียลไทม์</span>
          </div>
        </div>
      ) : (
        /* CARD VIEW (Alternative) */
        <div id="history-list" className="space-y-1.5">
          {filteredRecords.map((r) => {
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
                className="bg-white rounded-xl py-2 px-3 sm:py-2.5 sm:px-3.5 shadow-xs border border-purple-50 hover:border-purple-200 transition flex items-start justify-between gap-2.5 group"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      ผู้ป่วย: {r.person_name}
                    </span>

                    {/* Action Badge */}
                    {r.record_type === 'procedure' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                        <Stethoscope className="w-3 h-3 text-pink-600" />
                        <span>หัตถการ: {r.item_name}</span>
                      </span>
                    ) : r.action_type === 'receive' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>รับเข้าสต็อก</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>เบิกใช้งาน</span>
                      </span>
                    )}

                    {r.record_type === 'transaction' && (
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {r.item_name}{' '}
                        <span className="font-bold text-purple-700">
                          x{r.quantity} {r.item_unit}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Procedure Details */}
                  {r.record_type === 'procedure' && (
                    <div className="text-[11px] text-slate-700 space-y-0.5 bg-pink-50/70 p-1.5 px-2.5 rounded-lg border border-pink-100">
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
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>ผู้บันทึก: {r.performed_by || 'ไม่ระบุ'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {dateStr} เวลา {timeStr} น.
                      </span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Edit (Pencil) & Delete (Trash) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(r)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50/80 rounded-lg transition cursor-pointer"
                    title="แก้ไขการคีย์ข้อมูลรายการนี้"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRequest(r)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        persons={persons}
        items={items}
        onClose={() => setEditingRecord(null)}
        onSave={(updated) => {
          if (onUpdateRecord) {
            onUpdateRecord(updated);
          }
        }}
      />
    </div>
  );
};
