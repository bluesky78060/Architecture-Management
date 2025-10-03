import { storage } from '../storage';

// Mock browserFs used inside storage
jest.mock('../browserFs', () => {
  return {
    browserFs: {
      isSupported: jest.fn(() => false),
      writeKeyDirect: jest.fn(async () => true),
      chooseDirectory: jest.fn(async () => null),
      getSavedDirectoryHandle: jest.fn(async () => null),
    },
  };
});

const mockedBrowserFs = require('../browserFs').browserFs as jest.Mocked<{
  isSupported: () => boolean;
  writeKeyDirect: (key: string, value: unknown) => Promise<boolean>;
  chooseDirectory: () => Promise<unknown>;
  getSavedDirectoryHandle: () => Promise<{ name: string } | null>;
}>;

describe('storage service', () => {
  beforeEach(() => {
    // reset env
    (window as any).cms = undefined;
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('uses window.cms when available for get/set', () => {
    const getSpy = jest.fn().mockReturnValue('from-cms');
    const setSpy = jest.fn();
    (window as any).cms = {
      storageGetSync: getSpy,
      storageSet: setSpy,
    };

    expect(storage.getItem('k', 'fallback')).toBe('from-cms');
    storage.setItem('k', { a: 1 });
    expect(setSpy).toHaveBeenCalledWith('k', { a: 1 });
  });

  it('falls back to localStorage JSON when cms not present', () => {
    expect(storage.getItem('missing', 'def')).toBe('def');

    storage.setItem('user', { name: 'kim' });
    const raw = window.localStorage.getItem('user');
    expect(raw).toBe(JSON.stringify({ name: 'kim' }));
    expect(storage.getItem('user', null)).toEqual({ name: 'kim' });
  });

  it('mirrors setItem to browserFs when supported', async () => {
    mockedBrowserFs.isSupported.mockReturnValue(true);
    mockedBrowserFs.writeKeyDirect.mockResolvedValue(true);

    storage.setItem('mirror', { ok: true });
    // microtask queue flush to allow the fire-and-forget promise to schedule
    await Promise.resolve();
    expect(mockedBrowserFs.writeKeyDirect).toHaveBeenCalledWith('mirror', { ok: true });
  });

  it('chooseBrowserDirectory returns true when directory chosen', async () => {
    mockedBrowserFs.isSupported.mockReturnValue(true);
    mockedBrowserFs.chooseDirectory.mockResolvedValue({} as any);
    await expect(storage.chooseBrowserDirectory()).resolves.toBe(true);
  });

  it('getBrowserDirectoryInfo returns directory name when available', async () => {
    mockedBrowserFs.isSupported.mockReturnValue(true);
    mockedBrowserFs.getSavedDirectoryHandle.mockResolvedValue({ name: 'data' } as any);
    await expect(storage.getBrowserDirectoryInfo()).resolves.toEqual({ name: 'data' });
  });
});

