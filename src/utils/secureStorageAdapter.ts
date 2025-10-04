/**
 * Secure Storage Adapter
 * modernSecureStorage (비동기)와 기존 동기 API 간의 어댑터
 *
 * 주의: 이 어댑터는 동기 API를 제공하기 위해 localStorage 직접 접근을 사용합니다.
 * 실제 암호화/복호화는 백그라운드에서 처리됩니다.
 */

import { secureStorage } from './modernSecureStorage';
import { logger } from './logger';

// 시스템 마스터 비밀번호 (환경 변수 또는 설정에서 로드 권장)
const SYSTEM_PASSWORD = 'CMS_SYSTEM_2024';

// 초기화 상태
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * 보안 저장소 초기화
 * 앱 시작 시 한 번만 호출되어야 합니다.
 */
export async function initializeSecureStorage(): Promise<void> {
  if (isInitialized) return;

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await secureStorage.initializeSystemKey(SYSTEM_PASSWORD);
      isInitialized = true;
      logger.log('✅ Secure Storage initialized');
    } catch (error) {
      logger.error('❌ Secure Storage initialization failed:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * 동기식 setItem (내부적으로 비동기 처리)
 * @param key - 저장소 키
 * @param value - 저장할 값
 */
export function setSecureItem(key: string, value: string): void {
  if (!isInitialized) {
    // 초기화 전에는 일시적으로 평문 저장 (경고)
    logger.warn(`⚠️ Storage not initialized, storing ${key} temporarily`);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }

    // 백그라운드에서 초기화 후 재암호화
    initializeSecureStorage().then(() => {
      secureStorage.setSecureItem(key, value).catch(logger.error);
    });
    return;
  }

  // 비동기 저장 (즉시 반환)
  secureStorage.setSecureItem(key, value).catch((error) => {
    logger.error(`Failed to set secure item: ${key}`, error);
  });
}

/**
 * 동기식 getItem
 * @param key - 가져올 키
 * @returns 복호화된 값 또는 null
 */
export function getSecureItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const rawData = window.localStorage.getItem(key);
    if (!rawData) return null;

    // 민감 데이터가 아니면 그대로 반환
    if (!isSensitiveData(key)) {
      return rawData;
    }

    // 신버전 암호화 형식인지 확인
    if (isModernEncryption(rawData)) {
      // 비동기 복호화는 지원하지 않으므로 경고
      logger.warn(`⚠️ ${key} is encrypted, use async getSecureItemAsync() for decryption`);
      return null;
    }

    // 구버전이거나 평문 데이터 (호환성)
    return rawData;
  } catch (error) {
    logger.error(`Failed to get secure item: ${key}`, error);
    return null;
  }
}

/**
 * 비동기식 getItem (권장)
 * @param key - 가져올 키
 * @returns 복호화된 값 또는 null
 */
export async function getSecureItemAsync(key: string): Promise<string | null> {
  if (!isInitialized) {
    await initializeSecureStorage();
  }

  return secureStorage.getSecureItem(key);
}

/**
 * 동기식 removeItem
 * @param key - 삭제할 키
 */
export function removeSecureItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    logger.error(`Failed to remove secure item: ${key}`, error);
  }
}

/**
 * 민감한 데이터인지 확인
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
 * 신버전 암호화 형식인지 확인
 */
function isModernEncryption(rawData: string): boolean {
  try {
    const parsed = JSON.parse(rawData);
    return !!(parsed.encrypted && parsed.iv && parsed.algorithm);
  } catch {
    return false;
  }
}

/**
 * 기존 데이터 마이그레이션 (v1 XOR → v2 AES-256-GCM)
 * 앱 초기화 시 자동 실행
 */
export async function migrateSensitiveData(): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeSecureStorage();
    }

    const { autoMigrate } = await import('./securityMigration');
    await autoMigrate(SYSTEM_PASSWORD);
  } catch (error) {
    logger.error('Migration failed:', error);
  }
}

// 앱 시작 시 자동 초기화
if (typeof window !== 'undefined') {
  initializeSecureStorage().catch(logger.error);
}
