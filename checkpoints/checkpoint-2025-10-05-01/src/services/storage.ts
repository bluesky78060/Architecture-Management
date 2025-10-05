// Storage abstraction: Electron JSON file storage if available, else localStorage

import { browserFs } from './browserFs';
import '../types/global';

interface DirectoryInfo {
  name: string;
}

export const storage = {
  getItem<T = unknown>(key: string, defaultValue?: T): T {
    try {
      if (typeof window !== 'undefined' && window.cms != null && typeof window.cms.storageGetSync === 'function') {
        const v = window.cms.storageGetSync(key) as unknown;
        return (v == null ? defaultValue : (v as T)) as T;
      }
    } catch (e) {
      // Silently handle Electron storage errors
    }
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw !== null ? (JSON.parse(raw) as unknown) : undefined;
      return (parsed == null ? defaultValue : (parsed as T)) as T;
    } catch (e) {
      return defaultValue as T;
    }
  },

  setItem<T = unknown>(key: string, data: T): void {
    try {
      if (typeof window !== 'undefined' && window.cms != null && typeof window.cms.storageSet === 'function') {
        window.cms.storageSet(key, data);
        return;
      }
    } catch (e) {
      // Silently handle Electron storage errors
    }
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // Silently handle localStorage errors
    }
    // Additionally mirror to chosen browser directory if supported
    if (browserFs.isSupported()) {
      // Fire and forget; on failure it silently falls back
      browserFs.writeKeyDirect(key, data).catch(() => {});
    }
  },

  async chooseBrowserDirectory(): Promise<boolean> {
    if (!browserFs.isSupported()) return false;
    const handle = await browserFs.chooseDirectory();
    return handle != null;
  },

  async getBrowserDirectoryInfo(): Promise<DirectoryInfo | null> {
    if (!browserFs.isSupported()) return null;
    const handle = await browserFs.getSavedDirectoryHandle();
    if (handle == null) return null;
    return { name: handle.name };
  }
};
