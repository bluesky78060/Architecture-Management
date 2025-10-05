// Experimental browser folder storage using File System Access API (Edge/Chrome)

import '../types/global';

const DB_NAME = 'cms-fs';
const STORE = 'handles';
const DIR_KEY = 'dirHandle';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<unknown> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE);
    const req = st.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    const req = st.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!isSupported()) return null;
  try {
    const handle = (await idbGet(DIR_KEY)) as FileSystemDirectoryHandle | null;
    return handle ?? null;
  } catch (e) {
    return null;
  }
}

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
  if (!isSupported()) return false;
  try {
    await idbSet(DIR_KEY, handle);
    return true;
  } catch (e) {
    return false;
  }
}

async function verifyPermission(
  handle: FileSystemDirectoryHandle, 
  mode: 'read' | 'readwrite' = 'readwrite'
): Promise<boolean> {
  if (handle == null) return false;
  if (await handle.queryPermission({ mode }) === 'granted') return true;
  if (await handle.requestPermission({ mode }) === 'granted') return true;
  return false;
}

async function chooseDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isSupported()) return null;
  try {
    if (typeof window.showDirectoryPicker !== 'function') return null;
    const handle = await window.showDirectoryPicker({ id: 'cms-data' });
    if (!(await verifyPermission(handle, 'readwrite'))) return null;
    await saveDirectoryHandle(handle);
    return handle;
  } catch (e) {
    return null;
  }
}

async function getFileHandle(
  dirHandle: FileSystemDirectoryHandle, 
  name: string
): Promise<FileSystemFileHandle> {
  return await dirHandle.getFileHandle(name, { create: true });
}

async function readKey(
  dirHandle?: FileSystemDirectoryHandle | null, 
  key?: string
): Promise<unknown> {
  try {
    if (dirHandle == null) dirHandle = await getSavedDirectoryHandle();
    if (dirHandle == null || key == null || key === '') return null;
    if (!(await verifyPermission(dirHandle, 'read'))) return null;
    const fileHandle = await getFileHandle(dirHandle, `${key}.json`);
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (text.length === 0) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

async function writeKey(
  dirHandle: FileSystemDirectoryHandle | null, 
  key: string, 
  obj: unknown
): Promise<boolean> {
  try {
    if (dirHandle == null) dirHandle = await getSavedDirectoryHandle();
    if (dirHandle == null) return false;
    if (!(await verifyPermission(dirHandle, 'readwrite'))) return false;
    const fileHandle = await getFileHandle(dirHandle, `${key}.json`);
    const writable = await fileHandle.createWritable();
    const INDENT = 2; // eslint-disable-line no-magic-numbers
    await writable.write(new Blob([JSON.stringify(obj, null, INDENT)], { type: 'application/json' }));
    await writable.close();
    return true;
  } catch (e) {
    return false;
  }
}

async function writeKeyDirect(key: string, value: unknown): Promise<boolean> {
  const dir = await getSavedDirectoryHandle();
  if (dir == null) return false;
  return await writeKey(dir, key, value);
}

export const browserFs = {
  isSupported,
  getSavedDirectoryHandle,
  saveDirectoryHandle,
  chooseDirectory,
  readKey,
  writeKey,
  writeKeyDirect,
};
