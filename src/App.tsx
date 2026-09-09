import React, { useState, useEffect, useMemo } from 'react';
import { ItemDefinition, StockRecord } from './types';
import {
  DEFAULT_PERSONS,
  DEFAULT_ITEMS,
  INITIAL_SEED_RECORDS,
} from './data/defaultData';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { RecordTab } from './components/RecordTab';
import { HistoryTab } from './components/HistoryTab';
import { SummaryTab } from './components/SummaryTab';
import { DeleteModal } from './components/DeleteModal';
import { ManageModal } from './components/ManageModal';

export default function App() {
  // Current user / shift nurse
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('aging_ward_user') || 'พว. สมหญิง';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'summary'>('record');

  // Persons / Beds of Aging Ward
  const persons = DEFAULT_PERSONS;

  // Helper to filter out permanently removed items
  const isPermanentlyRemovedItem = (name?: string, recordType?: string) => {
    if (!name) return false;
    if (recordType === 'procedure') return false;
    const lower = name.trim().toLowerCase();
    return (
      lower === 'blue pad' ||
      lower === 'สเปรย์ดับกลิ่น' ||
      lower === 'สเปร์ยดับกลิ่น' ||
      lower === 'suction' ||
      lower === 'สาย suction' ||
      lower === 'สายดูดเสมหะ' ||
      lower === 'สายดูดเสมหะ (suction)' ||
      lower === 'สายดูดเสมหะ no.16' ||
      lower === 'สายดูดเสมหะ no.14'
    );
  };

  // Items definition
  const [items, setItems] = useState<ItemDefinition[]>(() => {
    const saved = localStorage.getItem('aging_ward_items');
    if (saved) {
      try {
        const parsed: ItemDefinition[] = JSON.parse(saved);
        return parsed.filter((i) => !isPermanentlyRemovedItem(i.name));
      } catch {
        return DEFAULT_ITEMS;
      }
    }
    return DEFAULT_ITEMS;
  });

  // All Records
  const [records, setRecords] = useState<StockRecord[]>(() => {
    const saved = localStorage.getItem('aging_ward_records');
    if (saved) {
      try {
        const parsed: StockRecord[] = JSON.parse(saved);
        return parsed.filter((r) => !isPermanentlyRemovedItem(r.item_name, r.record_type));
      } catch {
        return INITIAL_SEED_RECORDS;
      }
    }
    return INITIAL_SEED_RECORDS;
  });

  // Selected bed across tabs
  const [selectedPerson, setSelectedPerson] = useState<string>(() => {
    return DEFAULT_PERSONS[0] || '';
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<StockRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Manage items/beds modal
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aging_ward_user', currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aging_ward_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('aging_ward_records', JSON.stringify(records));
  }, [records]);

  // Ward statistics for top header notification
  const { lowStockCount, borrowedCount } = useMemo(() => {
    let low = 0;
    let borrowed = 0;

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
          if (qty < 0) borrowed++;
          else if (isAlertActive && qty <= it.threshold) low++;
        }
      });
    });

    return { lowStockCount: low, borrowedCount: borrowed };
  }, [persons, items, records]);

  // Record creation handler
  const handleAddRecord = (newRec: Omit<StockRecord, 'id'>) => {
    const record: StockRecord = {
      ...newRec,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setRecords((prev) => [record, ...prev]);
  };

  // Record deletion
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // Quick Action from Summary (e.g. +1 receive or -1 withdraw)
  const handleQuickAction = (person: string, itemName: string, type: 'receive' | 'withdraw') => {
    const itemObj = items.find((i) => i.name === itemName);
    handleAddRecord({
      person_name: person,
      item_name: itemName,
      item_unit: itemObj?.unit || 'ชิ้น',
      quantity: 1,
      action_type: type,
      performed_by: currentUser || 'ผู้ใช้ทั่วไป',
      timestamp: new Date().toISOString(),
      record_type: 'transaction',
    });
  };

  // Add custom item
  const handleAddItem = (newItem: ItemDefinition) => {
    setItems((prev) => [...prev, newItem]);
  };

  // Delete item from system
  const handleDeleteItem = (itemName: string) => {
    setItems((prev) => prev.filter((i) => i.name !== itemName));
  };

  // Update item settings (alert / threshold)
  const handleUpdateItem = (itemName: string, updated: Partial<ItemDefinition>) => {
    setItems((prev) =>
      prev.map((it) => (it.name === itemName ? { ...it, ...updated } : it))
    );
  };

  // Full Edit item (name, unit, alert threshold/enabled)
  const handleEditItem = (oldName: string, updatedItem: ItemDefinition) => {
    const trimmedNew = updatedItem.name.trim();
    if (!trimmedNew) return;

    setItems((prev) =>
      prev.map((it) =>
        it.name === oldName
          ? {
              ...updatedItem,
              name: trimmedNew,
              unit: updatedItem.unit.trim() || 'ชิ้น',
            }
          : it
      )
    );

    // If item name or unit changed, update existing transaction records to maintain stock balance
    if (oldName !== trimmedNew || updatedItem.unit) {
      setRecords((prev) =>
        prev.map((r) => {
          let updatedRecord = { ...r };
          let changed = false;

          if (r.item_name === oldName) {
            updatedRecord.item_name = trimmedNew;
            if (updatedItem.unit) {
              updatedRecord.item_unit = updatedItem.unit.trim();
            }
            changed = true;
          }

          if (r.supplies_used && r.supplies_used.includes(oldName)) {
            try {
              const parsed = JSON.parse(r.supplies_used);
              if (parsed[oldName] !== undefined && oldName !== trimmedNew) {
                parsed[trimmedNew] = parsed[oldName];
                delete parsed[oldName];
                updatedRecord.supplies_used = JSON.stringify(parsed);
                changed = true;
              }
            } catch {
              // ignore parse errors
            }
          }

          return changed ? updatedRecord : r;
        })
      );
    }
  };

  // Reset to default seed
  const handleResetData = () => {
    setItems(DEFAULT_ITEMS);
    setRecords(INITIAL_SEED_RECORDS);
    setSelectedPerson(DEFAULT_PERSONS[0] || '');
    localStorage.removeItem('aging_ward_items');
    localStorage.removeItem('aging_ward_records');
    localStorage.removeItem('aging_ward_persons');
    localStorage.removeItem('aging_ward_vacant_beds');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-purple-200">
      {/* Top Navigation */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenManage={() => setIsManageModalOpen(true)}
        onOpenUserModal={() => setIsLoginModalOpen(true)}
        lowStockCount={lowStockCount}
        borrowedCount={borrowedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB: Record */}
        {activeTab === 'record' && (
          <div id="page-record">
            <RecordTab
              persons={persons}
              items={items}
              records={records}
              currentUser={currentUser}
              selectedPerson={selectedPerson}
              onSelectPerson={setSelectedPerson}
              onAddRecord={handleAddRecord}
            />
          </div>
        )}

        {/* TAB: History */}
        {activeTab === 'history' && (
          <div id="page-history">
            <HistoryTab
              records={records}
              persons={persons}
              onDeleteRequest={(rec) => {
                setDeleteTarget(rec);
                setIsDeleteModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB: Summary */}
        {activeTab === 'summary' && (
          <div id="page-summary">
            <SummaryTab
              persons={persons}
              items={items}
              records={records}
              selectedPerson={selectedPerson}
              onSelectPerson={setSelectedPerson}
              onQuickAction={handleQuickAction}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>หอผู้ป่วยผู้สูงอายุ (Aging Ward) • ระบบบันทึกสต็อกของใช้ &amp; หัตถการรายเตียง</span>
          <span>ผู้ปฏิบัติงานปัจจุบัน: <strong className="text-purple-700">{currentUser}</strong></span>
        </div>
      </footer>

      {/* Staff Login / Switch Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        onLogin={(name) => {
          setCurrentUser(name);
          setIsLoginModalOpen(false);
        }}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        record={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />

      {/* Manage Items Modal */}
      <ManageModal
        isOpen={isManageModalOpen}
        items={items}
        onClose={() => setIsManageModalOpen(false)}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
        onUpdateItem={handleUpdateItem}
        onResetData={handleResetData}
      />
    </div>
  );
}
