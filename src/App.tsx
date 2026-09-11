import React, { useState, useEffect, useMemo } from 'react';
import { ItemDefinition, StockRecord } from './types';
import {
  DEFAULT_PERSONS,
  DEFAULT_ITEMS,
  INITIAL_SEED_RECORDS,
} from './data/defaultData';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { BottomNav } from './components/BottomNav';
import { RecordTab } from './components/RecordTab';
import { HistoryTab } from './components/HistoryTab';
import { SummaryTab } from './components/SummaryTab';
import { DeleteModal } from './components/DeleteModal';
import { ManageModal } from './components/ManageModal';
import { ExportModal } from './components/ExportModal';
import {
  subscribeToStockRecords,
  saveRecordToFirestore,
  deleteRecordFromFirestore,
  seedInitialRecordsIfEmpty,
  subscribeToItems,
  saveItemsToFirestore,
  subscribeToPersons,
  savePersonToFirestore,
  deletePersonFromFirestore,
  saveAllPersonsToFirestore,
  seedInitialPersonsIfEmpty,
} from './lib/firebase';

export default function App() {
  // Current user / shift nurse
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('aging_ward_user') || '';
  });
  // Login status - check if logged in before entering the system
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('aging_ward_is_logged_in') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'summary'>('record');

  // Persons / Patients of Aging Ward (Dynamic state synced with LocalStorage & Firestore)
  const [persons, setPersons] = useState<string[]>(() => {
    const saved = localStorage.getItem('aging_ward_persons');
    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return DEFAULT_PERSONS;
  });

  // Manage modal active tab
  const [manageModalTab, setManageModalTab] = useState<'items' | 'patients' | 'settings'>('patients');

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
        return parsed.filter(
          (r) => !isPermanentlyRemovedItem(r.item_name, r.record_type)
        );
      } catch {
        return [];
      }
    }
    return INITIAL_SEED_RECORDS;
  });

  // Selected bed across tabs
  const [selectedPerson, setSelectedPerson] = useState<string>(() => {
    return persons[0] || '';
  });

  // Keep selectedPerson in sync if it is deleted or not in list
  useEffect(() => {
    if (selectedPerson && !persons.includes(selectedPerson)) {
      setSelectedPerson(persons[0] || '');
    }
  }, [persons, selectedPerson]);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<StockRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Manage items modal
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);

  // Export CSV modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

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

  useEffect(() => {
    localStorage.setItem('aging_ward_persons', JSON.stringify(persons));
  }, [persons]);

  // Real-time synchronization with Firestore project: stockMUNAaging
  useEffect(() => {
    let unsubscribeRecords: () => void = () => {};
    let unsubscribeItems: () => void = () => {};
    let unsubscribePersons: () => void = () => {};

    try {
      unsubscribeRecords = subscribeToStockRecords(
        (firestoreRecords) => {
          const validRecords = firestoreRecords.filter(
            (r) => !isPermanentlyRemovedItem(r.item_name, r.record_type)
          );
          setRecords(validRecords);
        },
        (error) => {
          console.warn('Firestore stock_records listener error:', error);
        }
      );

      unsubscribeItems = subscribeToItems(
        (firestoreItems) => {
          if (firestoreItems.length > 0) {
            const validItems = firestoreItems.filter(
              (i) => !isPermanentlyRemovedItem(i.name)
            );
            setItems(validItems);
          }
        },
        (error) => {
          console.warn('Firestore items listener error:', error);
        }
      );

      unsubscribePersons = subscribeToPersons(
        (firestorePersons) => {
          setPersons(firestorePersons);
        },
        (error) => {
          console.warn('Firestore persons listener error:', error);
        }
      );
    } catch (e) {
      console.warn('Failed to initialize Firebase listeners:', e);
    }

    return () => {
      unsubscribeRecords();
      unsubscribeItems();
      unsubscribePersons();
    };
  }, []);

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

  // Record creation handler (saves to state and Firestore)
  const handleAddRecord = (newRec: Omit<StockRecord, 'id'>) => {
    const record: StockRecord = {
      ...newRec,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    // Optimistic UI update
    setRecords((prev) => [record, ...prev]);
    // Save to Firestore cloud database
    saveRecordToFirestore(record).catch((err) => {
      console.warn('Firestore write failed, cached locally:', err);
    });
  };

  // Record deletion (removes from state and Firestore)
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setRecords((prev) => prev.filter((r) => r.id !== targetId));
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    deleteRecordFromFirestore(targetId).catch((err) => {
      console.warn('Firestore delete failed:', err);
    });
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
    const updated = [...items, newItem];
    setItems(updated);
    saveItemsToFirestore(updated).catch(console.warn);
  };

  // Delete item from system
  const handleDeleteItem = (itemName: string) => {
    const updated = items.filter((i) => i.name !== itemName);
    setItems(updated);
    saveItemsToFirestore(updated).catch(console.warn);
  };

  // Update item settings (alert / threshold)
  const handleUpdateItem = (itemName: string, updated: Partial<ItemDefinition>) => {
    const newItems = items.map((it) => (it.name === itemName ? { ...it, ...updated } : it));
    setItems(newItems);
    saveItemsToFirestore(newItems).catch(console.warn);
  };

  // Full Edit item (name, unit, alert threshold/enabled)
  const handleEditItem = (oldName: string, updatedItem: ItemDefinition) => {
    const trimmedNew = updatedItem.name.trim();
    if (!trimmedNew) return;

    const newItems = items.map((it) =>
      it.name === oldName
        ? {
            ...updatedItem,
            name: trimmedNew,
            unit: updatedItem.unit.trim() || 'ชิ้น',
          }
        : it
    );
    setItems(newItems);
    saveItemsToFirestore(newItems).catch(console.warn);

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

  // Patient Management handlers
  const handleAddPerson = (newPerson: string) => {
    const trimmed = newPerson.trim();
    if (!trimmed) return;
    if (persons.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...persons, trimmed];
    setPersons(updated);
    if (!selectedPerson) {
      setSelectedPerson(trimmed);
    }
    savePersonToFirestore(trimmed, updated.length - 1).catch((err) =>
      console.warn('Save person to Firestore error:', err)
    );
  };

  const handleDeletePerson = (personToDelete: string) => {
    const updated = persons.filter((p) => p !== personToDelete);
    setPersons(updated);
    if (selectedPerson === personToDelete) {
      setSelectedPerson(updated[0] || '');
    }
    deletePersonFromFirestore(personToDelete).catch((err) =>
      console.warn('Delete person from Firestore error:', err)
    );
  };

  const handleEditPerson = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    const updated = persons.map((p) => (p === oldName ? trimmed : p));
    setPersons(updated);
    if (selectedPerson === oldName) {
      setSelectedPerson(trimmed);
    }
    deletePersonFromFirestore(oldName).catch(console.warn);
    savePersonToFirestore(trimmed, updated.indexOf(trimmed)).catch(console.warn);

    // Update records that referenced this patient so history and summaries remain linked
    setRecords((prev) =>
      prev.map((r) => (r.person_name === oldName ? { ...r, person_name: trimmed } : r))
    );
  };

  // Staff login handler
  const handleLogin = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setCurrentUser(clean);
    setIsLoggedIn(true);
    localStorage.setItem('aging_ward_is_logged_in', 'true');
    localStorage.setItem('aging_ward_user', clean);
  };

  // Staff logout handler (return to login screen)
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('aging_ward_is_logged_in');
  };

  // Reset to default seed
  const handleResetData = () => {
    setItems(DEFAULT_ITEMS);
    setRecords(INITIAL_SEED_RECORDS);
    setPersons(DEFAULT_PERSONS);
    setSelectedPerson(DEFAULT_PERSONS[0] || '');
    localStorage.removeItem('aging_ward_items');
    localStorage.removeItem('aging_ward_records');
    localStorage.removeItem('aging_ward_persons');
    localStorage.removeItem('aging_ward_vacant_beds');
    saveAllPersonsToFirestore(DEFAULT_PERSONS).catch(console.warn);
  };

  // If not logged in, show dedicated Login Page before entering the system
  if (!isLoggedIn) {
    return <LoginPage initialUser={currentUser} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-purple-200">
      {/* Top Navigation */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenManage={() => {
          setManageModalTab('patients');
          setIsManageModalOpen(true);
        }}
        onOpenUserModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        borrowedCount={borrowedCount}
      />

      {/* Main Container - compact spacing to minimize scrolling */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-2.5 sm:px-5 py-2 sm:py-3 pb-20 sm:pb-24">
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
              onOpenManagePatients={() => {
                setManageModalTab('patients');
                setIsManageModalOpen(true);
              }}
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
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white py-2 mt-auto mb-14 sm:mb-16 text-[11px] text-slate-400">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span>หอผู้ป่วยผู้สูงอายุ (Aging Ward)</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Firebase: stockMUNAaging
            </span>
          </div>
          <span>ผู้ปฏิบัติงานปัจจุบัน: <strong className="text-purple-700">{currentUser}</strong></span>
        </div>
      </footer>

      {/* Quick Bottom Navigation Bar (คีย์ข้อมูล, ประวัติ, สรุปยอด, ส่งออก CSV) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportClick={() => setIsExportModalOpen(true)}
        lowStockCount={lowStockCount}
        borrowedCount={borrowedCount}
      />

      {/* CSV Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
        persons={persons}
        items={items}
        selectedPerson={selectedPerson}
      />

      {/* Staff Login / Switch Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        onLogin={(name) => {
          handleLogin(name);
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

      {/* Manage Items & Patients Modal */}
      <ManageModal
        isOpen={isManageModalOpen}
        items={items}
        persons={persons}
        initialTab={manageModalTab}
        onClose={() => setIsManageModalOpen(false)}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
        onUpdateItem={handleUpdateItem}
        onAddPerson={handleAddPerson}
        onDeletePerson={handleDeletePerson}
        onEditPerson={handleEditPerson}
        onResetData={handleResetData}
      />
    </div>
  );
}
