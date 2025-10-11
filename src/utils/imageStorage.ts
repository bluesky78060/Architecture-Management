// 도장 이미지 저장을 위한 유틸리티
import { KIB } from '../constants/units';

const STAMP_IMAGE_KEY = 'constructionApp_stampImage';

// Storage info interface
interface StorageInfo {
  used: string;
  stampImageSize: string;
}

// localStorage에 이미지 저장 (암호화 없이 base64 그대로 저장)
export const saveStampImage = (imageDataUrl: string): boolean => {
  try {
    // localStorage 용량 확인
    const estimatedSize = imageDataUrl.length;
    const MAX_STAMP_IMAGE_MIB = 5; // 5 MiB
    const maxSize = MAX_STAMP_IMAGE_MIB * KIB * KIB;

    if (estimatedSize > maxSize) {
      return false;
    }

    localStorage.setItem(STAMP_IMAGE_KEY, imageDataUrl);
    return true;
  } catch (error) {
    return false;
  }
};

// localStorage에서 이미지 불러오기
export const loadStampImage = (): string | null => {
  try {
    const imageData = localStorage.getItem(STAMP_IMAGE_KEY);
    return imageData;
  } catch (error) {
    return null;
  }
};

// localStorage에서 이미지 삭제
export const removeStampImage = (): boolean => {
  try {
    localStorage.removeItem(STAMP_IMAGE_KEY);
    return true;
  } catch (error) {
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

// localStorage 사용량 확인 (개발용)
export const getStorageInfo = (): StorageInfo => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }

  // 도장 이미지 크기 확인
  const stampData = localStorage.getItem(STAMP_IMAGE_KEY);
  const stampImageSize = stampData !== null
    ? Math.round(stampData.length / KIB) + ' KB'
    : '0 KB';

  return {
    used: Math.round(total / KIB) + ' KB',
    stampImageSize: stampImageSize
  };
};
