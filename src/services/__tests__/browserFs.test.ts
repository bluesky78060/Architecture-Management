/* eslint-disable */
import { browserFs } from '../browserFs';

// 테스트용 타입 확장
interface WindowWithFS extends Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

interface GlobalWithIDB {
  indexedDB?: IDBFactory;
}

describe('browserFs', () => {
  beforeEach(() => {
    delete (window as WindowWithFS).showDirectoryPicker;
    delete (global as GlobalWithIDB).indexedDB;
  });

  it('isSupported false when API missing', () => {
    expect(browserFs.isSupported()).toBe(false);
  });

  it('readKey returns null when unsupported', async () => {
    delete (window as WindowWithFS).showDirectoryPicker;
    await expect(browserFs.readKey(null as unknown as FileSystemDirectoryHandle, 'any')).resolves.toBeNull();
  });

  it('chooseDirectory returns handle when supported and permission granted', async () => {
    // stub minimal IndexedDB for saveDirectoryHandle path
    (global as GlobalWithIDB).indexedDB = {
      open: () => {
        const req: Partial<IDBOpenDBRequest> = {};
        setTimeout(() => {
          req.result = {
            objectStoreNames: { contains: () => true },
            transaction: () => ({
              objectStore: () => ({
                put: () => {
                  const r: Partial<IDBRequest> = {};
                  setTimeout(() => r.onsuccess && r.onsuccess(new Event('success')), 0);
                  return r as IDBRequest;
                },
              }),
            }),
          } as IDBDatabase;
          req.onupgradeneeded && req.onupgradeneeded(new Event('upgradeneeded') as IDBVersionChangeEvent);
          req.onsuccess && req.onsuccess(new Event('success'));
        }, 0);
        return req as IDBOpenDBRequest;
      },
    } as IDBFactory;

    // support API
    (window as WindowWithFS).showDirectoryPicker = async () => ({
      name: 'dir',
      queryPermission: async () => 'granted' as PermissionState,
      requestPermission: async () => 'granted' as PermissionState,
      getFileHandle: async () => ({
        createWritable: async () => ({
          write: async () => {},
          close: async () => {}
        }),
      } as FileSystemFileHandle),
    } as FileSystemDirectoryHandle);

    const handle = await browserFs.chooseDirectory();
    expect(handle).toBeTruthy();
  });
});

