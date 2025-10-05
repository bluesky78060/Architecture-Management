/**
 * 보안 강화된 localStorage 래퍼
 * XSS 공격으로부터 민감한 데이터를 보호하기 위해 암호화를 적용
 */

import { KIB } from '../constants/units';

// 간단한 XOR 암호화 (데모용 - 실제 운영에서는 더 강력한 암호화 사용 권장)
const ENCRYPTION_KEY = 'CMS_2024_SECURE_KEY';
const SHIFT_5 = 5; // eslint-disable-line no-magic-numbers
const MASK_32 = 0xffffffff; // eslint-disable-line no-magic-numbers
const RADIX_36 = 36; // eslint-disable-line no-magic-numbers
const MAX_MIB = 5; // eslint-disable-line no-magic-numbers

/**
 * 암호화된 데이터 구조
 */
interface EncryptedData {
  encrypted: string;
  checksum: string;
  timestamp: number;
}

/**
 * 저장소 사용 현황
 */
interface StorageInfo {
  totalSize: string;
  itemCount: number;
  quotaExceeded: boolean;
}

/**
 * 문자열을 XOR 암호화합니다
 * @param text - 암호화할 텍스트
 * @param key - 암호화 키
 * @returns 암호화된 텍스트
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 인코딩
}

/**
 * XOR 암호화된 문자열을 복호화합니다
 * @param encryptedText - 암호화된 텍스트
 * @param key - 복호화 키
 * @returns 복호화된 텍스트
 */
function xorDecrypt(encryptedText: string, key: string): string | null {
  try {
    const decoded = atob(encryptedText); // Base64 디코딩
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    return null;
  }
}

/**
 * 데이터 무결성 검증을 위한 체크섬 생성
 * @param data - 체크섬을 생성할 데이터
 * @returns 체크섬
 */
function generateChecksum(data: string): string {
  let checksum = 0;
  for (let i = 0; i < data.length; i++) {
    checksum = ((checksum << SHIFT_5) - checksum + data.charCodeAt(i)) & MASK_32;
  }
  return checksum.toString(RADIX_36);
}

/**
 * 민감한 데이터인지 확인
 * @param key - localStorage 키
 * @returns 민감한 데이터 여부
 */
function isSensitiveData(key: string): boolean {
  const sensitiveKeys = [
    'CMS_USERS',
    'CURRENT_USER', 
    'CMS_DISABLE_LOGIN',
    'CMS_LOGOUT',
    'constructionApp_stampImage'
  ];
  return sensitiveKeys.some(sensitiveKey => key.includes(sensitiveKey));
}

/**
 * 보안 강화된 setItem
 * @param key - 저장할 키
 * @param value - 저장할 값
 */
export function setSecureItem(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || window.localStorage == null) {
      return;
    }

    let dataToStore = value;
    
    // 민감한 데이터는 암호화
    if (isSensitiveData(key)) {
      const encrypted = xorEncrypt(value, ENCRYPTION_KEY);
      const checksum = generateChecksum(value);
      const encryptedData: EncryptedData = {
        encrypted: encrypted,
        checksum: checksum,
        timestamp: Date.now()
      };
      dataToStore = JSON.stringify(encryptedData);
    }

    window.localStorage.setItem(key, dataToStore);
  } catch (error) {
    // Silently handle storage errors in production
  }
}

/**
 * 보안 강화된 getItem
 * @param key - 가져올 키
 * @returns 복호화된 값 또는 null
 */
export function getSecureItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || window.localStorage == null) {
      return null;
    }

    const rawData = window.localStorage.getItem(key);
    if (rawData === null) return null;

    // 민감한 데이터가 아니면 그대로 반환
    if (isSensitiveData(key) === false) {
      return rawData;
    }

    // 민감한 데이터는 복호화
    try {
      const parsedData: EncryptedData = JSON.parse(rawData);
      if (parsedData.encrypted == null || parsedData.checksum == null) {
        // 구버전 데이터 - 그대로 반환 (마이그레이션 목적)
        return rawData;
      }

      const decrypted = xorDecrypt(parsedData.encrypted, ENCRYPTION_KEY);
      if (decrypted === null) return null;

      // 무결성 검증
      const expectedChecksum = generateChecksum(decrypted);
      if (expectedChecksum !== parsedData.checksum) {
        return null;
      }

      return decrypted;
    } catch (parseError) {
      // JSON 파싱 실패 시 구버전 데이터로 간주
      return rawData;
    }
  } catch (error) {
    return null;
  }
}

/**
 * 보안 강화된 removeItem
 * @param key - 삭제할 키
 */
export function removeSecureItem(key: string): void {
  try {
    if (typeof window === 'undefined' || window.localStorage == null) {
      return;
    }
    window.localStorage.removeItem(key);
  } catch (error) {
    // Silently handle removal errors
  }
}

/**
 * 모든 민감한 데이터를 암호화된 형태로 마이그레이션
 */
export function migrateSensitiveData(): void {
  try {
    if (typeof window === 'undefined' || window.localStorage == null) {
      return;
    }

    const sensitiveKeys = ['CMS_USERS', 'CURRENT_USER', 'CMS_DISABLE_LOGIN', 'constructionApp_stampImage'];
    
    sensitiveKeys.forEach(key => {
      const rawData = window.localStorage.getItem(key);
      if (rawData !== null) {
        try {
          // 이미 암호화된 데이터인지 확인
          const parsed = JSON.parse(rawData);
          if (parsed.encrypted == null) {
            // 암호화되지 않은 구 데이터 - 암호화하여 재저장
            setSecureItem(key, rawData);
          }
        } catch {
          // JSON이 아닌 플레인 텍스트 - 암호화하여 재저장
          setSecureItem(key, rawData);
        }
      }
    });
  } catch (error) {
    // Silently handle migration errors
  }
}

/**
 * localStorage 사용량 모니터링
 * @returns 저장소 사용 현황
 */

export function getStorageInfo(): StorageInfo {
  try {
    let totalSize = 0;
    let itemCount = 0;
    
    if (typeof window !== 'undefined' && window.localStorage != null) {
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          totalSize += window.localStorage[key].length + key.length;
          itemCount++;
        }
      }
    }

    return {
      totalSize: Math.round(totalSize / KIB) + ' KB',
      itemCount: itemCount,
      quotaExceeded: totalSize > (MAX_MIB * KIB * KIB) // 5MB 제한
    };
  } catch (error) {
    return {
      totalSize: 'Unknown',
      itemCount: 0,
      quotaExceeded: false
    };
  }
}
