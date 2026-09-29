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
import { AppointmentsModal } from './components/AppointmentsModal';
import { OfflineBlocker } from './components/OfflineBlocker';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  subscribeToStockRecords,
  saveRecordToFirestore,
  deleteRecordFromFirestore,
  seedInitialRecordsIfEmpty,
  subscribeToItems,
  saveItemsToFirestore,
  deleteItemFromFirestore,
  subscribeToPersons,
  savePersonToFirestore,
  deletePersonFromFirestore,
  saveAllPersonsToFirestore,
  seedInitialPersonsIfEmpty,
} from './lib/firebase';

export default function App() {
  // Online/Offline network connectivity state
  const {
    isOnline,
    isChecking: isCheckingOnline,
    lastCheckFailed: isOnlineCheckFailed,
    lastCheckedAt,
    checkConnectivity,
  } = useOnlineStatus();

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
      lower === 'สเปร์ยดับกลิ่น'
    );
  };

  // Items definition
  const [items, setItems] = useState<ItemDefinition[]>(() => {
    const saved = localStorage.getItem('aging_ward_items');
    if (saved) {
      try {
        let parsed: ItemDefinition[] = JSON.parse(saved);
        parsed = parsed.filter((i) => !isPermanentlyRemovedItem(i.name));
        const suctionIdx = parsed.findIndex((i) => i.name === 'สายดูดเสมหะ');
        if (suctionIdx === -1) {
          parsed.splice(2, 0, { name: 'สายดูดเสมหะ', unit: 'เส้น', threshold: 20, alert_enabled: true });
        } else {
          parsed[suctionIdx] = {
            ...parsed[suctionIdx],
            unit: 'เส้น',
            threshold: 20,
            alert_enabled: true,
          };
        }
        return parsed;
      } catch {
        return DEFAULT_ITEMS;
      }
    }
    return DEFAULT_ITEMS;
  });

  // All Records
  const [records, setRecords] = useState<StockRecord[]>(() => {
    let deletedSet = new Set<string>();
    try {
      const savedDel = localStorage.getItem('aging_ward_deleted_record_ids');
      if (savedDel) {
        const arr = JSON.parse(savedDel);
        if (Array.isArray(arr)) deletedSet = new Set(arr);
      }
    } catch {
      // ignore
    }

    const saved = localStorage.getItem('aging_ward_records');
    if (saved) {
      try {
        const parsed: StockRecord[] = JSON.parse(saved);
        return parsed.filter(
          (r) =>
            r &&
            r.id &&
            !deletedSet.has(r.id) &&
            !r.is_deleted &&
            !r.deleted &&
            r.status !== 'deleted' &&
            !isPermanentlyRemovedItem(r.item_name, r.record_type)
        );
      } catch {
        return [];
      }
    }
    return INITIAL_SEED_RECORDS;
  });

  // Persistent tracking of confirmed deleted record IDs
  const [deletedRecordIds, setDeletedRecordIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('aging_ward_deleted_record_ids');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {
      // ignore
    }
    return new Set<string>();
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

  // Appointments (Google Calendar) modal state
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState<boolean>(false);

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
          let currentDeleted = new Set<string>();
          try {
            const savedDel = localStorage.getItem('aging_ward_deleted_record_ids');
            if (savedDel) {
              const arr = JSON.parse(savedDel);
              if (Array.isArray(arr)) currentDeleted = new Set(arr);
            }
          } catch {
            // ignore
          }

          const validRecords = firestoreRecords.filter(
            (r) =>
              r &&
              r.id &&
              !currentDeleted.has(r.id) &&
              !r.is_deleted &&
              !r.deleted &&
              r.status !== 'deleted' &&
              !isPermanentlyRemovedItem(r.item_name, r.record_type)
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
            let validItems = firestoreItems.filter(
              (i) => !isPermanentlyRemovedItem(i.name)
            );
            const suctionIdx = validItems.findIndex((i) => i.name === 'สายดูดเสมหะ');
            if (suctionIdx === -1) {
              validItems.splice(2, 0, { name: 'สายดูดเสมหะ', unit: 'เส้น', threshold: 20, alert_enabled: true });
              saveItemsToFirestore(validItems).catch(console.warn);
            }
            setItems(validItems);
          } else {
            saveItemsToFirestore(DEFAULT_ITEMS).catch(console.warn);
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

  // Helper guard to ensure operations cannot proceed while offline
  const requireOnline = (actionName = 'ทำรายการ'): boolean => {
    if (!isOnline) {
      alert(`ไม่สามารถ${actionName}ได้ขณะออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ต`);
      return false;
    }
    return true;
  };

  // Record creation handler (saves to state and Firestore)
  const handleAddRecord = (newRec: Omit<StockRecord, 'id'>) => {
    if (!requireOnline('บันทึกข้อมูล')) return;
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

  // Record deletion (removes from state and Firestore, records to confirmed deleted ids)
  const handleDeleteConfirm = () => {
    if (!requireOnline('ลบข้อมูล')) return;
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    // Track confirmed deleted record ID in state & localStorage so it is never included in History or CSV export
    setDeletedRecordIds((prev) => {
      const updated = new Set(prev);
      updated.add(targetId);
      try {
        localStorage.setItem('aging_ward_deleted_record_ids', JSON.stringify(Array.from(updated)));
      } catch (err) {
        console.warn('Failed saving deleted_record_ids:', err);
      }
      return updated;
    });

    setRecords((prev) => prev.filter((r) => r.id !== targetId));
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    deleteRecordFromFirestore(targetId).catch((err) => {
      console.warn('Firestore delete failed:', err);
    });
  };

  // Record update (edit record and persist changes to state and Firestore)
  const handleUpdateRecord = (updatedRecord: StockRecord) => {
    if (!requireOnline('แก้ไขข้อมูลประวัติ')) return;
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    saveRecordToFirestore(updatedRecord).catch((err) => {
      console.warn('Firestore update record failed:', err);
    });
  };

  // Quick Action from Summary (e.g. +1 receive or -1 withdraw)
  const handleQuickAction = (person: string, itemName: string, type: 'receive' | 'withdraw') => {
    if (!requireOnline('ทำรายการด่วน')) return;
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
    if (!requireOnline('เพิ่มรายการของใช้')) return;
    const updated = [...items, newItem];
    setItems(updated);
    saveItemsToFirestore(updated).catch(console.warn);
  };

  // Delete item from system
  const handleDeleteItem = (itemName: string) => {
    if (!requireOnline('ลบรายการของใช้')) return;
    const updated = items.filter((i) => i.name !== itemName);
    setItems(updated);
    saveItemsToFirestore(updated).catch(console.warn);
    deleteItemFromFirestore(itemName).catch(console.warn);
  };

  // Update item settings (alert / threshold)
  const handleUpdateItem = (itemName: string, updated: Partial<ItemDefinition>) => {
    if (!requireOnline('แก้ไขการตั้งค่ารายการ')) return;
    const newItems = items.map((it) => (it.name === itemName ? { ...it, ...updated } : it));
    setItems(newItems);
    saveItemsToFirestore(newItems).catch(console.warn);
  };

  // Full Edit item (name, unit, alert threshold/enabled)
  const handleEditItem = (oldName: string, updatedItem: ItemDefinition) => {
    if (!requireOnline('แก้ไขรายการของใช้')) return;
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
    if (!requireOnline('เพิ่มรายชื่อผู้ป่วย')) return;
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
    if (!requireOnline('ลบรายชื่อผู้ป่วย')) return;
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
    if (!requireOnline('แก้ไขรายชื่อผู้ป่วย')) return;
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
    if (!requireOnline('เข้าสู่ระบบ')) return;
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
    if (!requireOnline('รีเซ็ตข้อมูล')) return;
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

  // Offline blocker overlay component
  const offlineBlockerElement = !isOnline ? (
    <OfflineBlocker
      isChecking={isCheckingOnline}
      lastCheckFailed={isOnlineCheckFailed}
      lastCheckedAt={lastCheckedAt}
      onRetry={checkConnectivity}
    />
  ) : null;

  // If not logged in, show dedicated Login Page before entering the system
  if (!isLoggedIn) {
    return (
      <>
        {offlineBlockerElement}
        <LoginPage initialUser={currentUser} onLogin={handleLogin} isOnline={isOnline} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7fd] flex flex-col selection:bg-purple-200 selection:text-purple-900">
      {offlineBlockerElement}
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
        onOpenAppointments={() => setIsAppointmentsModalOpen(true)}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        borrowedCount={borrowedCount}
        isOnline={isOnline}
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
              onOpenAppointments={() => setIsAppointmentsModalOpen(true)}
            />
          </div>
        )}

        {/* TAB: History */}
        {activeTab === 'history' && (
          <div id="page-history">
            <HistoryTab
              records={records}
              persons={persons}
              items={items}
              deletedRecordIds={Array.from(deletedRecordIds)}
              onDeleteRequest={(rec) => {
                setDeleteTarget(rec);
                setIsDeleteModalOpen(true);
              }}
              onUpdateRecord={handleUpdateRecord}
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
              onOpenAppointments={() => setIsAppointmentsModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100/90 bg-white/70 backdrop-blur-xs py-2 mt-auto mb-14 sm:mb-16 text-[11px] text-slate-400">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span>หอผู้ป่วยผู้สูงอายุ (Aging Ward)</span>
            <span className="text-slate-300">•</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Firebase: stockMUNAaging (ออนไลน์)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                ออฟไลน์ (ระงับการใช้งาน)
              </span>
            )}
          </div>
          <span>ผู้ปฏิบัติงานปัจจุบัน: <strong className="text-purple-600 font-semibold">{currentUser}</strong></span>
        </div>
      </footer>

      {/* Quick Bottom Navigation Bar (คีย์ข้อมูล, ประวัติ, สรุปยอด, ดูนัดหมาย, ส่งออก CSV, ออกจากระบบ) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAppointments={() => setIsAppointmentsModalOpen(true)}
        onExportClick={() => setIsExportModalOpen(true)}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        borrowedCount={borrowedCount}
      />

      {/* Appointments (Google Calendar) Modal */}
      <AppointmentsModal
        isOpen={isAppointmentsModalOpen}
        onClose={() => setIsAppointmentsModalOpen(false)}
        defaultDate="2026-10-07"
      />

      {/* CSV Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
        persons={persons}
        items={items}
        selectedPerson={selectedPerson}
        deletedRecordIds={Array.from(deletedRecordIds)}
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
