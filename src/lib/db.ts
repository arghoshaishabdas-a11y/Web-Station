import { useEffect, useRef, useState } from 'react';

// Everything is stored locally in the browser (IndexedDB). No login, no server.
export type StoreName = 'apps' | 'notes' | 'media';

const DB_NAME = 'web-station';
const DB_VERSION = 1;
const STORES: StoreName[] = ['apps', 'notes', 'media'];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of STORES) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const listeners: Record<StoreName, Set<() => void>> = { apps: new Set(), notes: new Set(), media: new Set() };
const emit = (s: StoreName) => listeners[s].forEach((fn) => fn());
const subscribe = (s: StoreName, fn: () => void) => {
  listeners[s].add(fn);
  return () => { listeners[s].delete(fn); };
};

export const newId = () => crypto.randomUUID();

export const getAll = <T,>(store: StoreName) => run<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);

export async function put<T extends { id: string }>(store: StoreName, value: T) {
  await run(store, 'readwrite', (s) => s.put(value));
  emit(store);
}

export async function remove(store: StoreName, id: string) {
  await run(store, 'readwrite', (s) => s.delete(id));
  emit(store);
}

/** Live list (newest first). `stable` keeps the same object for unchanged ids (used for media blobs). */
export function useLiveList<T extends { id: string; createdAt: number }>(store: StoreName, opts?: { stable?: boolean }) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const prev = useRef(new Map<string, T>());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const all = await getAll<T>(store);
        if (!alive) return;
        const next = all
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((it) => (opts?.stable && prev.current.has(it.id) ? prev.current.get(it.id)! : it));
        prev.current = new Map(next.map((i) => [i.id, i]));
        setItems(next);
      } catch (e) {
        console.error('DB error', e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const unsub = subscribe(store, load);
    return () => { alive = false; unsub(); };
  }, [store]);

  return { items, loading };
}
