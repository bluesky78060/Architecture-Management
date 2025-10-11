// 도장 이미지 저장을 위한 유틸리티
import { KIB } from '../constants/units';
import { browserFs } from '../services/browserFs';

const DB_NAME = 'ConstructionAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'stampImages';
const STAMP_KEY = 'companyStamp';
const STAMP_FILENAME = 'company-stamp.png';

// Storage info interface
interface StorageInfo {
  used: string;
  stampImageSize: string;
  folderPath?: string;
}

// IndexedDB 초기화
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// IndexedDB와 브라우저 저장소 폴더에 이미지 저장
export const saveStampImage = async (imageDataUrl: string): Promise<boolean> => {
  try {
    // Base64를 Blob으로 변환
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // 용량 확인 (5MB 제한)
    const MAX_STAMP_IMAGE_MIB = 5;
    const maxSize = MAX_STAMP_IMAGE_MIB * KIB * KIB;
    if (blob.size > maxSize) {
      return false;
    }

    // 1. IndexedDB에 저장 (백업용)
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(blob, STAMP_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();

    // 2. 브라우저 저장소 폴더에 파일로 저장 (선택된 폴더가 있는 경우)
    if (browserFs.isSupported()) {
      try {
        await browserFs.writeImageFile(STAMP_FILENAME, blob);
      } catch (fileError) {
        // 파일 저장 실패해도 IndexedDB에는 저장되었으므로 계속 진행
      }
    }

    return true;
  } catch (error) {
    // Failed to save stamp image
    return false;
  }
};

// IndexedDB에서 이미지 불러오기 (Blob을 Data URL로 변환)
export const loadStampImage = async (): Promise<string | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const request = store.get(STAMP_KEY);
      request.onsuccess = () => {
        const result = request.result;
        resolve((result !== undefined && result !== null) ? result : null);
      };
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (blob === null) return null;

    // Blob을 Data URL로 변환
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Failed to load stamp image
    return null;
  }
};

// IndexedDB에서 이미지 삭제
export const removeStampImage = async (): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(STAMP_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    return true;
  } catch (error) {
    // Failed to remove stamp image
    return false;
  }
};

// localStorage 저장 공간 확인
export const checkStorageAvailable = (): boolean => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

// 이미지 파일을 Base64로 변환
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// 저장 폴더 경로 가져오기
export const getStampFolderPath = async (): Promise<string | null> => {
  try {
    const folderHandle = await browserFs.getSavedDirectoryHandle();
    if (folderHandle !== null) {
      return folderHandle.name;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// IndexedDB 사용량 확인 (개발용)
export const getStorageInfo = async (): Promise<StorageInfo> => {
  let total = 0;

  // localStorage 사용량
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }

  // IndexedDB에서 도장 이미지 크기 확인
  let stampImageSize = '0 KB';
  let folderPath: string | undefined = undefined;

  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const request = store.get(STAMP_KEY);
      request.onsuccess = () => {
        const result = request.result;
        resolve((result !== undefined && result !== null) ? result : null);
      };
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (blob !== null) {
      stampImageSize = Math.round(blob.size / KIB) + ' KB';
    }

    // 폴더 경로 가져오기
    const path = await getStampFolderPath();
    if (path !== null) {
      folderPath = path;
    }
  } catch (error) {
    // Failed to get storage info
  }

  return {
    used: Math.round(total / KIB) + ' KB',
    stampImageSize: stampImageSize,
    folderPath: folderPath
  };
};
