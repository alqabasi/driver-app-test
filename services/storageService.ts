
import { DailyLog, Driver, Transaction, DayStatus, SyncQueueItem } from '../types';

const DB_NAME = 'AlqabasiDB_v2';
const DB_VERSION = 2;
const SESSION_KEY = 'alqabasi_current_driver_mobile';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('drivers')) {
        db.createObjectStore('drivers', { keyPath: 'mobile' });
      }

      if (!db.objectStoreNames.contains('logs')) {
        const logsStore = db.createObjectStore('logs', { keyPath: 'id' });
        logsStore.createIndex('driverId', 'driverId', { unique: false });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
};

const put = async (storeName: string, value: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const get = async (storeName: string, key: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAll = async (storeName: string): Promise<any[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const remove = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const storage = {
  getDriver: () => get('drivers', localStorage.getItem(SESSION_KEY) || ''),
  saveDriver: (driver: Driver) => {
    localStorage.setItem(SESSION_KEY, driver.mobile);
    return put('drivers', driver);
  },
  clearDriver: () => {
    localStorage.removeItem(SESSION_KEY);
  },
  
  getLogs: () => getAll('logs'),
  saveLog: (log: DailyLog) => put('logs', log),
  
  getSyncQueue: () => getAll('syncQueue'),
  addToSyncQueue: (item: SyncQueueItem) => put('syncQueue', item),
  removeFromSyncQueue: (id: string) => remove('syncQueue', id),

  generateId: () => Math.random().toString(36).substring(2, 11)
};
