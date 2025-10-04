import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  migrateSensitiveData,
  getStorageInfo,
} from '../secureStorage.legacy';

describe('secureStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and retrieves non-sensitive values as-is', () => {
    setSecureItem('regular_key', 'plain');

    expect(window.localStorage.getItem('regular_key')).toBe('plain');
    expect(getSecureItem('regular_key')).toBe('plain');
  });

  it('encrypts sensitive values while keeping API transparent', () => {
    setSecureItem('CMS_USERS', 'super-secret');

    const stored = window.localStorage.getItem('CMS_USERS');
    expect(stored).not.toBeNull();
    expect(stored).not.toBe('super-secret');
    expect(getSecureItem('CMS_USERS')).toBe('super-secret');
  });

  it('returns null when integrity check fails', () => {
    setSecureItem('constructionApp_stampImage', 'data-url');

    const corrupted = JSON.parse(window.localStorage.getItem('constructionApp_stampImage')!);
    corrupted.checksum = 'mismatch';
    window.localStorage.setItem('constructionApp_stampImage', JSON.stringify(corrupted));

    expect(getSecureItem('constructionApp_stampImage')).toBeNull();
  });

  it('removes stored items safely', () => {
    setSecureItem('CURRENT_USER', 'john');
    removeSecureItem('CURRENT_USER');

    expect(window.localStorage.getItem('CURRENT_USER')).toBeNull();
  });

  it('migrates legacy plain text values to encrypted form', () => {
    window.localStorage.setItem('CURRENT_USER', 'legacy');

    migrateSensitiveData();

    const stored = window.localStorage.getItem('CURRENT_USER');
    expect(stored).not.toBeNull();
    expect(stored).not.toBe('legacy');
    expect(getSecureItem('CURRENT_USER')).toBe('legacy');
  });

  it('reports storage info metrics', () => {
    setSecureItem('CMS_DISABLE_LOGIN', 'true');

    const info = getStorageInfo();
    expect(info.itemCount).toBeGreaterThan(0);
    expect(typeof info.totalSize).toBe('string');
    expect(info.quotaExceeded).toBe(false);
  });
});
