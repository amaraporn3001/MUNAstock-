import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ItemDefinition, StockRecord } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the project's provisioned database ID
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const PROJECT_ID = firebaseConfig.projectId;

// Collection names
export const COLLECTIONS = {
  RECORDS: 'stock_records',
  ITEMS: 'items',
  PERSONS: 'persons',
};

/**
 * Subscribe to real-time changes in stock_records collection
 */
export function subscribeToStockRecords(
  onData: (records: StockRecord[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.RECORDS),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const records: StockRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as StockRecord;
          records.push({
            ...data,
            id: docSnap.id,
          });
        });
        onData(records);
      },
      (error) => {
        console.warn('Firestore onSnapshot error (stock_records):', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up Firestore listener:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Save a new or updated stock record to Firestore
 */
export async function saveRecordToFirestore(record: StockRecord): Promise<void> {
  try {
    const recordRef = doc(db, COLLECTIONS.RECORDS, record.id);
    // Sanitize undefined fields to prevent Firestore serialization errors
    const cleanedRecord = JSON.parse(JSON.stringify(record));
    await setDoc(recordRef, cleanedRecord, { merge: true });
  } catch (err) {
    console.error('Failed to save record to Firestore:', err);
    throw err;
  }
}

/**
 * Delete a record from Firestore
 */
export async function deleteRecordFromFirestore(recordId: string): Promise<void> {
  try {
    const recordRef = doc(db, COLLECTIONS.RECORDS, recordId);
    await deleteDoc(recordRef);
  } catch (err) {
    console.error('Failed to delete record from Firestore:', err);
    throw err;
  }
}

/**
 * Initial bulk seed to Firestore if collection is empty
 */
export async function seedInitialRecordsIfEmpty(initialRecords: StockRecord[]): Promise<boolean> {
  try {
    const colRef = collection(db, COLLECTIONS.RECORDS);
    const existingSnap = await getDocs(colRef);
    if (existingSnap.empty && initialRecords.length > 0) {
      const batch = writeBatch(db);
      // Batch write max 500 documents
      initialRecords.slice(0, 450).forEach((rec) => {
        const docRef = doc(db, COLLECTIONS.RECORDS, rec.id);
        batch.set(docRef, JSON.parse(JSON.stringify(rec)));
      });
      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Initial seeding to Firestore skipped or failed:', err);
    return false;
  }
}

/**
 * Subscribe to custom items list
 */
export function subscribeToItems(
  onData: (items: ItemDefinition[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const colRef = collection(db, COLLECTIONS.ITEMS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: ItemDefinition[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as ItemDefinition);
          });
          onData(items);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error (items):', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up items listener:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Save custom item definitions to Firestore
 */
export async function saveItemsToFirestore(items: ItemDefinition[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      // Use sanitized item name as doc ID
      const safeId = encodeURIComponent(item.name.trim());
      const docRef = doc(db, COLLECTIONS.ITEMS, safeId);
      batch.set(docRef, JSON.parse(JSON.stringify(item)), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to save items to Firestore:', err);
  }
}

/**
 * Subscribe to persons (patients) in the ward
 */
export function subscribeToPersons(
  onData: (persons: string[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const colRef = collection(db, COLLECTIONS.PERSONS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: { name: string; order: number }[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.name === 'string' && data.name.trim()) {
            list.push({
              name: data.name.trim(),
              order: typeof data.order === 'number' ? data.order : 999,
            });
          }
        });
        list.sort((a, b) => a.order - b.order);
        onData(list.map((item) => item.name));
      },
      (error) => {
        console.warn('Firestore onSnapshot error (persons):', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Error setting up persons listener:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Save or update single person in Firestore
 */
export async function savePersonToFirestore(personName: string, order?: number): Promise<void> {
  try {
    const trimmed = personName.trim();
    const safeId = encodeURIComponent(trimmed);
    const docRef = doc(db, COLLECTIONS.PERSONS, safeId);
    await setDoc(
      docRef,
      {
        name: trimmed,
        order: typeof order === 'number' ? order : Date.now(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to save person to Firestore:', err);
  }
}

/**
 * Delete a person from Firestore
 */
export async function deletePersonFromFirestore(personName: string): Promise<void> {
  try {
    const safeId = encodeURIComponent(personName.trim());
    const docRef = doc(db, COLLECTIONS.PERSONS, safeId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete person from Firestore:', err);
  }
}

/**
 * Save all persons to Firestore (batch overwrite/sync)
 */
export async function saveAllPersonsToFirestore(persons: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    persons.forEach((name, idx) => {
      const trimmed = name.trim();
      const safeId = encodeURIComponent(trimmed);
      const docRef = doc(db, COLLECTIONS.PERSONS, safeId);
      batch.set(
        docRef,
        {
          name: trimmed,
          order: idx,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to save all persons to Firestore:', err);
  }
}

/**
 * Initial bulk seed of ward patients if Firestore collection is empty
 */
export async function seedInitialPersonsIfEmpty(initialPersons: string[]): Promise<boolean> {
  try {
    if (!initialPersons || initialPersons.length === 0) return false;

    const colRef = collection(db, COLLECTIONS.PERSONS);
    const existingSnap = await getDocs(colRef);
    if (existingSnap.empty) {
      const batch = writeBatch(db);
      initialPersons.forEach((name, idx) => {
        const trimmed = name.trim();
        const safeId = encodeURIComponent(trimmed);
        const docRef = doc(db, COLLECTIONS.PERSONS, safeId);
        batch.set(docRef, {
          name: trimmed,
          order: idx,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Initial persons seeding to Firestore skipped or failed:', err);
    return false;
  }
}

