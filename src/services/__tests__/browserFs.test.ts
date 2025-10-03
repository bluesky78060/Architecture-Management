import { browserFs } from '../browserFs';

describe('browserFs', () => {
  beforeEach(() => {
    // @ts-ignore
    delete (window as any).showDirectoryPicker;
    // @ts-ignore
    delete (global as any).indexedDB;
  });

  it('isSupported false when API missing', () => {
    expect(browserFs.isSupported()).toBe(false);
  });

  it('readKey returns null when unsupported', async () => {
    // @ts-ignore
    delete (window as any).showDirectoryPicker;
    await expect(browserFs.readKey(null as any, 'any')).resolves.toBeNull();
  });

  it('chooseDirectory returns handle when supported and permission granted', async () => {
    // stub minimal IndexedDB for saveDirectoryHandle path
    (global as any).indexedDB = {
      open: () => {
        const req: any = {};
        setTimeout(() => {
          req.result = {
            objectStoreNames: { contains: () => true },
            transaction: () => ({
              objectStore: () => ({
                put: () => {
                  const r: any = {};
                  setTimeout(() => r.onsuccess && r.onsuccess(), 0);
                  return r;
                },
              }),
            }),
          };
          req.onupgradeneeded && req.onupgradeneeded();
          req.onsuccess && req.onsuccess();
        }, 0);
        return req;
      },
    };

    // support API
    (window as any).showDirectoryPicker = async () => ({
      name: 'dir',
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      getFileHandle: async () => ({
        createWritable: async () => ({ write: async () => {}, close: async () => {} }),
      }),
    });

    const handle = await browserFs.chooseDirectory();
    expect(handle).toBeTruthy();
  });
});

