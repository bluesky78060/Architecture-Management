/* eslint-disable */
import * as secure from '../secureStorageAdapter';
import {
  saveStampImage,
  loadStampImage,
  removeStampImage,
  checkStorageAvailable,
  getStorageInfo,
} from '../imageStorage';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('imageStorage utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('saves small images via secureStorage and returns true', () => {
    const setSpy = jest.spyOn(secure, 'setSecureItem').mockImplementation(() => {});
    const ok = saveStampImage('data:image/png;base64,AAA');
    expect(ok).toBe(true);
    expect(setSpy).toHaveBeenCalled();
  });

  it('rejects overly large images and returns false', () => {
    // construct a big string > 5MB after x2 factor
    const huge = 'x'.repeat(3 * 1024 * 1024);
    const ok = saveStampImage(huge);
    expect(ok).toBe(false);
  });

  it('loads and removes image through secureStorage', () => {
    const getSpy = jest.spyOn(secure, 'getSecureItem').mockReturnValue('data-url');
    expect(loadStampImage()).toBe('data-url');

    const removeSpy = jest.spyOn(secure, 'removeSecureItem').mockImplementation(() => {});
    expect(removeStampImage()).toBe(true);
    expect(removeSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it('checkStorageAvailable returns false when localStorage throws', () => {
    const spy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    expect(checkStorageAvailable()).toBe(false);
    spy.mockRestore();
  });

  it('getStorageInfo reports sizes without throwing', () => {
    jest.spyOn(secure, 'getSecureItem').mockReturnValue('abc');
    window.localStorage.setItem('k', 'v');
    const info = getStorageInfo();
    expect(typeof info.used).toBe('string');
    expect(typeof info.stampImageSize).toBe('string');
  });
});
