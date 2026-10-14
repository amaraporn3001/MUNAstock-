import React, { useState, useMemo, useEffect } from 'react';
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
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
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
  onBatchDeleteRecords?: (recordIds: string[]) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  records,
  persons,
  items = [],
  deletedRecordIds = [],
  onDeleteRequest,
  onUpdateRecord,
  onOpenClearHistory,
  onBatchDeleteRecords,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingRecord, setEditingRecord] = useState<StockRecord | null>(null);

  // Checkbox (tikbox) selection state in main table/cards
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // Modal states for procedure deletion
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isDeletePatientProceduresModalOpen, setIsDeletePatientProceduresModalOpen] = useState(false);
  const [patientToDeleteProcedures, setPatientToDeleteProcedures] = useState<string>('');
  const [modalSelectedProcIds, setModalSelectedProcIds] = useState<Set<string>>(new Set());

  // Secondary confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'modal_selected' | 'modal_all' | 'table_selected';
    title: string;
    description: string;
    recordIds: string[];
    patientName?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
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

  // All active valid records (excluding deleted)
  const activeRecords = useMemo(() => {
    const deletedSet = getDeletedRecordIdsSet();
    return records.filter(
      (r) =>
        r &&
        r.id &&
        !deletedSet.has(r.id) &&
        !r.is_deleted &&
        !r.deleted &&
        r.status !== 'deleted'
    );
  }, [records, deletedRecordIds]);

  // Total counts for badge display
  const totalProcedureCount = useMemo(() => {
    return activeRecords.filter((r) => r.record_type === 'procedure').length;
  }, [activeRecords]);

  const totalStockCount = useMemo(() => {
    return activeRecords.filter((r) => r.record_type === 'transaction').length;
  }, [activeRecords]);

  // Procedure counts grouped by patient name
  const proceduresCountByPatient = useMemo(() => {
    const counts: Record<string, number> = {};
    activeRecords.forEach((r) => {
      if (r.record_type === 'procedure' && r.person_name) {
        counts[r.person_name] = (counts[r.person_name] || 0) + 1;
      }
    });
    return counts;
  }, [activeRecords]);

  // Patients who have at least 1 procedure
  const patientsWithProcedures = useMemo(() => {
    return persons.filter((p) => (proceduresCountByPatient[p] || 0) > 0);
  }, [persons, proceduresCountByPatient]);

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

  // Non-deleted procedure records for target patient in modal or selected person
  const targetPatient = patientToDeleteProcedures || selectedPerson;
  const modalPatientProcedureRecords = useMemo(() => {
    if (!targetPatient) return [];
    return activeRecords
      .filter((r) => r.person_name === targetPatient && r.record_type === 'procedure')
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [activeRecords, targetPatient]);

  // Procedure records for selected patient in main view
  const currentPersonProcedureRecords = useMemo(() => {
    if (!selectedPerson) return [];
    return activeRecords
      .filter((r) => r.person_name === selectedPerson && r.record_type === 'procedure')
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [activeRecords, selectedPerson]);

  // Count of procedures among currently filtered records
  const filteredProcedureCount = useMemo(() => {
    return filteredRecords.filter((r) => r.record_type === 'procedure').length;
  }, [filteredRecords]);

  // Master checkbox states in main view
  const isAllVisibleSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedRecordIds.has(r.id));

  // Modal selection helpers
  const isAllModalSelected =
    modalPatientProcedureRecords.length > 0 &&
    modalPatientProcedureRecords.every((r) => modalSelectedProcIds.has(r.id));

  // Auto-init modal patient when opened
  useEffect(() => {
    if (isDeletePatientProceduresModalOpen) {
      if (!patientToDeleteProcedures) {
        const initial = selectedPerson || patientsWithProcedures[0] || persons[0] || '';
        setPatientToDeleteProcedures(initial);
      }
      setModalSelectedProcIds(new Set());
    }
  }, [isDeletePatientProceduresModalOpen]);

  // Main table checkbox toggle handlers
  const handleToggleSelect = (id: string) => {
    setSelectedRecordIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedRecordIds(new Set());
    } else {
      const allIds = new Set(filteredRecords.map((r) => r.id));
      setSelectedRecordIds(allIds);
    }
  };

  const handleSelectAllVisibleProcedures = () => {
    const procIds = filteredRecords
      .filter((r) => r.record_type === 'procedure')
      .map((r) => r.id);
    setSelectedRecordIds(new Set(procIds));
  };

  // Modal tikbox toggle handlers
  const handleToggleModalItem = (id: string) => {
    setModalSelectedProcIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleModalSelectAll = () => {
    if (isAllModalSelected) {
      setModalSelectedProcIds(new Set());
    } else {
      setModalSelectedProcIds(new Set(modalPatientProcedureRecords.map((r) => r.id)));
    }
  };

  // Open modal for specific patient
  const handleOpenProcedureModalForPatient = (patientName: string) => {
    setPatientToDeleteProcedures(patientName);
    setModalSelectedProcIds(new Set());
    setIsDeletePatientProceduresModalOpen(true);
  };

  // Trigger delete from Modal: 1) Selected items with tikbox
  const handleTriggerDeleteModalSelected = () => {
    if (modalSelectedProcIds.size === 0) return;
    const ids = Array.from(modalSelectedProcIds);
    setConfirmAction({
      isOpen: true,
      type: 'modal_selected',
      title: `ยืนยันลบรายการหัตถการที่เลือก (${ids.length} รายการ)?`,
      description: `ระบบจะลบรายการหัตถการที่ติ๊กเลือกจำนวน ${ids.length} รายการ ของ "${patientToDeleteProcedures}" ออกจากระบบและ Firebase อย่างถาวร`,
      recordIds: ids,
      patientName: patientToDeleteProcedures,
    });
  };

  // Trigger delete from Modal: 2) All procedures for patient
  const handleTriggerDeleteModalAll = () => {
    if (modalPatientProcedureRecords.length === 0) return;
    const ids = modalPatientProcedureRecords.map((r) => r.id);
    setConfirmAction({
      isOpen: true,
      type: 'modal_all',
      title: `ยืนยันลบประวัติหัตถการทั้งหมดของ "${patientToDeleteProcedures}"?`,
      description: `ระบบจะลบประวัติหัตถการทั้งหมดจำนวน ${ids.length} รายการ ของ "${patientToDeleteProcedures}" ออกจากระบบและ Firebase อย่างถาวร (ยอดคงเหลือของใช้และสต็อกจะไม่ได้รับผลกระทบ)`,
      recordIds: ids,
      patientName: patientToDeleteProcedures,
    });
  };

  // Trigger delete for selected items in main table/cards
  const handleTriggerDeleteTableSelected = () => {
    if (selectedRecordIds.size === 0) return;
    const ids = Array.from(selectedRecordIds);
    setConfirmAction({
      isOpen: true,
      type: 'table_selected',
      title: `ยืนยันลบรายการที่เลือก (${ids.length} รายการ)?`,
      description: `รายการที่ติ๊กเลือกจำนวน ${ids.length} รายการ จะถูกลบออกจากตารางประวัติและ Firebase อย่างถาวร`,
      recordIds: ids,
    });
  };

  // Execute confirmed deletion
  const handleExecuteConfirmedDelete = () => {
    if (!confirmAction) return;
    const { recordIds, patientName, type } = confirmAction;
    if (!recordIds || recordIds.length === 0) {
      setConfirmAction(null);
      return;
    }

    if (onBatchDeleteRecords) {
      onBatchDeleteRecords(recordIds);
    } else {
      recordIds.forEach((id) => {
        const rec = records.find((r) => r.id === id);
        if (rec) onDeleteRequest(rec);
      });
    }

    // Deselect from main selection and modal selection
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      recordIds.forEach((id) => next.delete(id));
      return next;
    });

    setModalSelectedProcIds((prev) => {
      const next = new Set(prev);
      recordIds.forEach((id) => next.delete(id));
      return next;
    });

    if (type === 'modal_all') {
      showToast(`ลบประวัติหัตถการทั้งหมดของ "${patientName}" สำเร็จ (${recordIds.length} รายการ)`);
    } else if (type === 'modal_selected') {
      showToast(`ลบรายการหัตถการที่เลือกสำเร็จ (${recordIds.length} รายการ) ของ ${patientName}`);
    } else {
      showToast(`ลบรายการที่เลือกสำเร็จ (${recordIds.length} รายการ)`);
    }

    setConfirmAction(null);
    setIsDeleteSelectedModalOpen(false);
  };

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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Main Category Navigation Tabs (ทั้งหมด / ประวัติหัตถการ / รับ-เบิกของใช้) */}
      <div className="flex items-center gap-1.5 p-1 bg-white/95 rounded-2xl border border-purple-100 shadow-xs flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedType('')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedType === ''
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ประวัติทั้งหมด</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedType === '' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
          }`}>
            {activeRecords.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-history-procedure"
          onClick={() => setSelectedType('procedure')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedType === 'procedure'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs shadow-pink-200'
              : 'text-pink-700 hover:bg-pink-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>ประวัติหัตถการ</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedType === 'procedure' ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700'
          }`}>
            {totalProcedureCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('transaction')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedType === 'transaction'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
              : 'text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>รับ / เบิกของใช้</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedType === 'transaction' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {totalStockCount}
          </span>
        </button>
      </div>

      {/* Dedicated Procedure History Banner (Active when 'procedure' is selected) */}
      {selectedType === 'procedure' && (
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border-2 border-pink-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>หน้าจัดการประวัติหัตถการ</span>
                  <span className="text-[11px] font-semibold bg-pink-100 text-pink-800 px-2 py-0.2 rounded-full border border-pink-200">
                    {filteredProcedureCount} รายการที่แสดง
                  </span>
                </h4>
                <p className="text-[11px] text-pink-900 mt-0.5">
                  มี Tikbox ให้เลือกลบรายการหัตถการตามรายชื่อที่เลือก หรือเลือกลบประวัติหัตถการทั้งหมดตามรายชื่อที่เลือกได้
                </p>
              </div>
            </div>

            {/* Main procedure manager modal launcher */}
            <button
              type="button"
              onClick={() => {
                setPatientToDeleteProcedures(selectedPerson || patientsWithProcedures[0] || persons[0] || '');
                setIsDeletePatientProceduresModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
              <span>เปิดหน้าต่างเลือกลบหัตถการตามชื่อผู้ป่วย</span>
            </button>
          </div>

          {/* Quick Patient Procedure Status & Direct Actions */}
          {selectedPerson ? (
            <div className="p-2.5 bg-white/90 rounded-xl border border-pink-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-pink-950">ผู้ป่วยที่เลือก:</span>
                <span className="font-extrabold text-sm text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-200">
                  {selectedPerson}
                </span>
                <span className="text-slate-500 font-medium">
                  (มีประวัติหัตถการ {currentPersonProcedureRecords.length} รายการ)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentPersonProcedureRecords.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const ids = currentPersonProcedureRecords.map((r) => r.id);
                        setSelectedRecordIds(new Set(ids));
                        showToast(`ติ๊กเลือกหัตถการทั้งหมดของ "${selectedPerson}" (${ids.length} รายการ)`);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-pink-700" />
                      <span>ติ๊กเลือกทั้งหมดของ {selectedPerson}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenProcedureModalForPatient(selectedPerson)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>เลือกลบ / ลบทั้งหมดของ {selectedPerson}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 bg-white/70 rounded-xl border border-pink-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
              <span className="text-[11px] text-pink-900 font-medium">
                💡 เลือกชื่อผู้ป่วยในตัวกรองด้านล่าง เพื่อดูหรือติ๊กลบประวัติหัตถการเฉพาะบุคคลได้รวดเร็ว
              </span>
              {patientsWithProcedures.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">ผู้ป่วยที่มีหัตถการ:</span>
                  {patientsWithProcedures.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPerson(p)}
                      className="px-2 py-0.5 bg-pink-100/70 hover:bg-pink-200 text-pink-900 rounded-md text-[11px] font-semibold transition cursor-pointer"
                    >
                      {p} ({proceduresCountByPatient[p]})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
              className={`text-xs px-2.5 py-0.5 rounded-lg font-medium transition cursor-pointer ${
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
              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50/70 text-purple-700 hover:bg-purple-100/70 font-medium transition cursor-pointer"
            >
              7 วัน
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('month')}
              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50/70 text-purple-700 hover:bg-purple-100/70 font-medium transition cursor-pointer"
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDate('all')}
              className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition cursor-pointer"
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
              className="w-full border border-purple-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            >
              <option value="">ผู้ป่วยทุกคน</option>
              {persons.map((p) => (
                <option key={p} value={p}>
                  {p} {proceduresCountByPatient[p] ? `(${proceduresCountByPatient[p]} หัตถการ)` : ''}
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
              className="w-full border border-purple-200/80 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            >
              <option value="">ทั้งหมด</option>
              <option value="procedure">🩺 หัตถการผู้ป่วย</option>
              <option value="transaction">📦 รับ / เบิกของใช้</option>
            </select>
          </div>
        </div>

        {/* Quick Procedure Delete Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-purple-50">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setPatientToDeleteProcedures(selectedPerson || patientsWithProcedures[0] || persons[0] || '');
                setIsDeletePatientProceduresModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-lg text-xs font-bold border border-pink-200 transition cursor-pointer shadow-2xs"
              title="เลือกลบประวัติหัตถการตามรายชื่อผู้ป่วย (มี Tikbox เลือกทีละรายการ หรือเลือกลบทั้งหมด)"
            >
              <Stethoscope className="w-3.5 h-3.5 text-pink-600" />
              <span>เลือกลบประวัติหัตถการตามรายชื่อ...</span>
            </button>

            {selectedPerson && currentPersonProcedureRecords.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenProcedureModalForPatient(selectedPerson)}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition cursor-pointer"
                title={`จัดการประวัติหัตถการของ ${selectedPerson}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>ลบหัตถการของ {selectedPerson} ({currentPersonProcedureRecords.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {filteredProcedureCount > 0 && (
              <button
                type="button"
                onClick={handleSelectAllVisibleProcedures}
                className="text-pink-700 underline font-semibold hover:text-pink-900 cursor-pointer text-xs"
              >
                ติ๊กเลือกเฉพาะหัตถการในตาราง ({filteredProcedureCount})
              </button>
            )}
          </div>
        </div>

        {/* Search bar & view toggle */}
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

      {/* Checkbox (Tikbox) Batch Action Floating Bar in Main View */}
      {selectedRecordIds.size > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-2.5 px-4 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-rose-950 font-bold">
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span>
              ติ๊กเลือกอยู่ <span className="text-rose-700 text-sm font-black">{selectedRecordIds.size}</span> รายการ
            </span>
            <button
              type="button"
              onClick={() => setSelectedRecordIds(new Set())}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer font-normal"
            >
              ยกเลิกการเลือกทั้งหมด
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerDeleteTableSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>ลบรายการที่ติ๊กเลือก ({selectedRecordIds.size} รายการ)</span>
            </button>
          </div>
        </div>
      )}

      {/* History Items Display */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-purple-100 space-y-1.5 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">ไม่พบประวัติรายการตามเงื่อนไขที่เลือก</p>
          <p className="text-xs text-slate-400">ลองเปลี่ยนช่วงวันที่ หรือเลือกประเภทรายการอื่นเพื่อดูประวัติ</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-xs border border-purple-100 overflow-hidden">
          <div className="px-3 py-1.5 bg-purple-50/70 border-b border-purple-100 text-[11px] text-purple-700 font-medium flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <span>👉 เลื่อนหน้าจอแนวนอนเพื่อดูตารางแบบเต็ม</span>
              {filteredProcedureCount > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllVisibleProcedures}
                  className="text-pink-700 underline font-semibold hover:text-pink-900 cursor-pointer"
                >
                  ติ๊กเลือกหัตถการทั้งหมดในตาราง ({filteredProcedureCount})
                </button>
              )}
            </div>
            <span className="font-bold">{filteredRecords.length} แถว</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/40 text-slate-700 font-bold border-b border-purple-100">
                  {/* Tikbox Master Checkbox Column */}
                  <th className="py-2.5 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 cursor-pointer"
                      title={isAllVisibleSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดง'}
                    />
                  </th>
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
                  const isSelected = selectedRecordIds.has(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-rose-100/70 hover:bg-rose-100'
                          : isProcedure
                          ? index % 2 === 1
                            ? 'bg-pink-50/30 hover:bg-pink-50/60'
                            : 'bg-white hover:bg-pink-50/60'
                          : index % 2 === 1
                          ? 'bg-slate-50/40 hover:bg-purple-50/50'
                          : 'bg-white hover:bg-purple-50/50'
                      }`}
                    >
                      {/* Checkbox (Tikbox) */}
                      <td className="py-2.5 px-3 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 cursor-pointer"
                        />
                      </td>

                      {/* Date & Time */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="font-semibold text-slate-800 text-xs">{dateStr}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{timeStr} น.</div>
                      </td>

                      {/* Patient Name / Bed */}
                      <td className="py-2.5 px-3 whitespace-nowrap align-top">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isProcedure ? 'bg-pink-500' : 'bg-purple-500'}`} />
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
            <span>แสดง {filteredRecords.length} รายการ</span>
            <span className="text-[11px] text-purple-700 font-medium">ตารางประวัติเรียลไทม์</span>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="space-y-2">
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
            const isSelected = selectedRecordIds.has(r.id);

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'border-rose-400 bg-rose-50/50 shadow-xs'
                    : isProcedure
                    ? 'border-pink-200/80 hover:border-pink-300 shadow-2xs'
                    : 'border-purple-100 hover:border-purple-200 shadow-2xs'
                }`}
              >
                {/* Tikbox in Card */}
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(r.id)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 cursor-pointer"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{r.person_name}</span>
                      {isProcedure ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                          <Stethoscope className="w-3 h-3 text-pink-600" />
                          <span>หัตถการ</span>
                        </span>
                      ) : isReceive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          <span>รับเข้า</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          <span>เบิกออก</span>
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {isProcedure ? (
                        <span className="font-bold text-pink-700 text-sm">
                          {r.procedure_count || 1} ครั้ง
                        </span>
                      ) : (
                        <span
                          className={`font-bold text-sm ${
                            isReceive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isReceive ? '+' : '-'}
                          {r.quantity} {r.item_unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                    {r.item_name}
                  </div>

                  {isProcedure && (
                    <div className="bg-pink-50/50 p-2 rounded-xl text-xs space-y-0.5 text-slate-700 border border-pink-100/60">
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

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{r.performed_by || 'ไม่ระบุ'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr} {timeStr} น.</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
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

      {/* ========================================================================= */}
      {/* MODAL: จัดการและลบประวัติหัตถการตามรายชื่อผู้ป่วย (มี Tikbox เลือกทีละรายการ หรือ เลือกลบทั้งหมด) */}
      {/* ========================================================================= */}
      {isDeletePatientProceduresModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-pink-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    จัดการ &amp; ลบประวัติหัตถการตามรายชื่อผู้ป่วย
                  </h3>
                  <p className="text-xs text-pink-100 mt-0.5">
                    มี Tikbox ให้เลือกติ๊กลบเฉพาะรายการ หรือเลือกลบประวัติหัตถการทั้งหมดตามรายชื่อที่เลือก
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeletePatientProceduresModalOpen(false)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Select Patient Dropdown & Quick Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  เลือกรายชื่อผู้ป่วยที่ต้องการจัดการหัตถการ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={patientToDeleteProcedures}
                  onChange={(e) => {
                    setPatientToDeleteProcedures(e.target.value);
                    setModalSelectedProcIds(new Set());
                  }}
                  className="w-full border-2 border-pink-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold cursor-pointer"
                >
                  <option value="">-- กรุณาเลือกชื่อผู้ป่วย --</option>
                  {persons.map((p) => {
                    const cnt = proceduresCountByPatient[p] || 0;
                    return (
                      <option key={p} value={p}>
                        {p} — {cnt > 0 ? `มีประวัติหัตถการ ${cnt} รายการ` : 'ไม่มีประวัติหัตถการ'}
                      </option>
                    );
                  })}
                </select>

                {/* Quick patient chip buttons */}
                {patientsWithProcedures.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-400">เลือกเร็วตามผู้ป่วยที่มีหัตถการ:</span>
                    {patientsWithProcedures.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPatientToDeleteProcedures(p);
                          setModalSelectedProcIds(new Set());
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                          patientToDeleteProcedures === p
                            ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                            : 'bg-pink-50 hover:bg-pink-100 text-pink-800 border-pink-200'
                        }`}
                      >
                        {p} ({proceduresCountByPatient[p]})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Procedure Checklist Container */}
              {patientToDeleteProcedures ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-pink-50/80 rounded-xl border border-pink-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pink-950">ผู้ป่วย: {patientToDeleteProcedures}</span>
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-pink-200 font-bold text-pink-700">
                        ทั้งหมด {modalPatientProcedureRecords.length} รายการ
                      </span>
                    </div>

                    {modalPatientProcedureRecords.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-600">
                          ติ๊กเลือกอยู่{' '}
                          <strong className="text-pink-700 font-extrabold text-xs">
                            {modalSelectedProcIds.size}
                          </strong>{' '}
                          รายการ
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleModalSelectAll}
                          className="px-2 py-0.5 bg-white hover:bg-pink-100 text-pink-800 border border-pink-200 rounded font-semibold text-[11px] cursor-pointer"
                        >
                          {isAllModalSelected ? 'ล้างการติ๊ก' : 'ติ๊กเลือกทั้งหมด'}
                        </button>
                      </div>
                    )}
                  </div>

                  {modalPatientProcedureRecords.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                      <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">ผู้ป่วยรายนี้ไม่มีประวัติหัตถการในระบบ</p>
                      <p className="text-[11px] text-slate-400">สามารถเลือกผู้ป่วยรายอื่นจากรายการด้านบนได้ครับ</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Master Tikbox Header */}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50/60 rounded-lg text-xs font-semibold text-purple-900 border border-purple-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllModalSelected}
                            onChange={handleToggleModalSelectAll}
                            className="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 cursor-pointer"
                          />
                          <span>Tikbox เลือกทั้งหมด ({modalPatientProcedureRecords.length} รายการ)</span>
                        </label>
                        <span className="text-[11px] text-slate-400">ติ๊กที่รายการเพื่อเลือก</span>
                      </div>

                      {/* Scrollable list of procedure items with Tikbox */}
                      <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                        {modalPatientProcedureRecords.map((pr) => {
                          const dt = new Date(pr.timestamp);
                          const dateStr = dt.toLocaleDateString('th-TH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          });
                          const timeStr = dt.toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          let suppliesList: string[] = [];
                          if (pr.supplies_used) {
                            try {
                              const supObj = JSON.parse(pr.supplies_used);
                              suppliesList = Object.entries(supObj)
                                .filter(([_, v]) => Number(v) > 0)
                                .map(([k, v]) => `${k} x${v}`);
                            } catch {
                              suppliesList = [];
                            }
                          }

                          const isChecked = modalSelectedProcIds.has(pr.id);

                          return (
                            <div
                              key={pr.id}
                              onClick={() => handleToggleModalItem(pr.id)}
                              className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                isChecked
                                  ? 'bg-pink-100/70 border-pink-400 shadow-xs ring-1 ring-pink-300'
                                  : 'bg-white hover:bg-pink-50/50 border-pink-100'
                              }`}
                            >
                              {/* Tikbox */}
                              <div className="pt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleModalItem(pr.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 cursor-pointer"
                                />
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {pr.item_name}
                                    </span>
                                    <span className="text-[11px] font-bold bg-pink-100 text-pink-800 px-2 py-0.2 rounded-full border border-pink-200">
                                      {pr.procedure_count || 1} ครั้ง
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{dateStr} เวลา {timeStr} น.</span>
                                  </div>
                                </div>

                                {(pr.procedure_detail || pr.wound_location) && (
                                  <div className="text-xs text-slate-700 bg-white/70 p-1.5 rounded-lg border border-pink-100/70">
                                    {pr.procedure_detail && (
                                      <div>
                                        <span className="font-semibold text-pink-950">รายละเอียด:</span>{' '}
                                        {pr.procedure_detail}
                                      </div>
                                    )}
                                    {pr.wound_location && (
                                      <div>
                                        <span className="font-semibold text-pink-950">ตำแหน่งแผล:</span>{' '}
                                        {pr.wound_location}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {suppliesList.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap text-[10px] pt-0.5">
                                    <span className="text-pink-900 font-bold">อุปกรณ์:</span>
                                    {suppliesList.map((sup, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-white text-pink-800 px-1.5 py-0.2 rounded border border-pink-200 font-medium"
                                      >
                                        {sup}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                                  <User className="w-2.5 h-2.5" />
                                  <span>ผู้บันทึก: {pr.performed_by || 'ไม่ระบุ'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                  กรุณาเลือกรายชื่อผู้ป่วยด้านบนเพื่อดูประวัติหัตถการและเลือกติ๊กรายการที่ต้องการลบ
                </div>
              )}

              {/* Warning Notice */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  การลบจะลบเฉพาะประวัติหัตถการที่เลือกออกจากระบบและ Firebase อย่างถาวร ยอดของใช้สต็อกจะไม่ได้รับผลกระทบ
                </span>
              </div>
            </div>

            {/* Action Buttons in Footer (เลือกติ๊กลบ vs ลบทั้งหมด) */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeletePatientProceduresModalOpen(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white text-xs sm:text-sm transition cursor-pointer order-3 sm:order-1"
              >
                ปิดหน้าต่าง
              </button>

              <div className="w-full sm:flex-1 flex flex-col sm:flex-row items-center gap-2 order-1 sm:order-2">
                {/* BUTTON 1: ลบเฉพาะรายการที่เลือกด้วย Tikbox */}
                <button
                  type="button"
                  disabled={modalSelectedProcIds.size === 0}
                  onClick={handleTriggerDeleteModalSelected}
                  className="w-full flex-1 py-2.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="ลบเฉพาะรายการที่ติ๊กเลือกไว้ใน Tikbox"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    ลบเฉพาะรายการที่เลือก ({modalSelectedProcIds.size} รายการ)
                  </span>
                </button>

                {/* BUTTON 2: เลือกลบประวัติหัตถการทั้งหมดตามรายชื่อที่เลือก */}
                <button
                  type="button"
                  disabled={!patientToDeleteProcedures || modalPatientProcedureRecords.length === 0}
                  onClick={handleTriggerDeleteModalAll}
                  className="w-full flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed text-rose-800 border-2 border-rose-300 font-bold text-xs sm:text-sm transition shadow-2xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  title={`ลบประวัติหัตถการทั้งหมดของผู้ป่วย ${patientToDeleteProcedures}`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>
                    ลบประวัติหัตถการทั้งหมด ({modalPatientProcedureRecords.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY CONFIRMATION DIALOG (ยืนยันก่อนลบ ป้องกันการกดผิด) */}
      {/* ========================================================================= */}
      {confirmAction && confirmAction.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-rose-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {confirmAction.title}
              </h3>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-900 text-left space-y-1.5">
                <p className="leading-relaxed">{confirmAction.description}</p>
                <div className="pt-1 border-t border-rose-200 font-bold flex justify-between">
                  <span>จำนวนที่จะถูกลบ:</span>
                  <span className="text-rose-700 font-extrabold">{confirmAction.recordIds.length} รายการ</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                การดำเนินการนี้ไม่สามารถเรียกคืนได้ กรุณากดยืนยันหากตรวจสอบความถูกต้องแล้ว
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white text-xs sm:text-sm transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition shadow-sm active:scale-95 cursor-pointer"
              >
                ยืนยันการลบถาวร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
