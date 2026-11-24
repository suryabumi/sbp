import { DEFAULT_CONFIG } from '../constants/study';
import type { StudyConfig, StudySession } from '../types/study';

const DB_NAME = 'studi-suara';
const STORE_NAME = 'sessions';
const CONFIG_KEY = 'ss-cfg';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function runTx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllSessions(): Promise<StudySession[]> {
  try {
    const list = await runTx('readonly', (store) => store.getAll());
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Gagal membaca IndexedDB:', err);
    return [];
  }
}

export async function saveSession(session: StudySession): Promise<void> {
  try {
    await runTx('readwrite', (store) => store.put(session));
  } catch (err) {
    console.error('Gagal menyimpan sesi ke IndexedDB:', err);
  }
}

export async function deleteSession(id: string): Promise<void> {
  await runTx('readwrite', (store) => store.delete(id));
}

export function loadConfig(): StudyConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<StudyConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      sr: Number(parsed.sr) || DEFAULT_CONFIG.sr,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(cfg: StudyConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Gagal menyimpan pengaturan:', err);
  }
}
