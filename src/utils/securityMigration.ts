/**
 * 보안 시스템 마이그레이션 유틸리티
 * XOR 암호화(v1) → AES-256-GCM(v2) 마이그레이션
 */

import { secureStorage } from './modernSecureStorage';
import { getSecureItem as getLegacyItem } from './secureStorage';

/**
 * 마이그레이션 결과
 */
export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  failedKeys: string[];
  skippedKeys: string[];
  errors: Array<{ key: string; error: string }>;
}

/**
 * 마이그레이션 대상 키 목록
 */
const SENSITIVE_KEYS = [
  'CMS_USERS',
  'CURRENT_USER',
  'CMS_DISABLE_LOGIN',
  'CMS_LOGOUT',
  'constructionApp_stampImage',
];

/**
 * 데이터가 구버전 암호화 형식인지 확인
 * @param rawData - localStorage에서 가져온 원시 데이터
 * @returns 구버전 여부
 */
function isLegacyEncryption(rawData: string): boolean {
  try {
    const parsed = JSON.parse(rawData);
    // v1: encrypted + checksum 있고, iv 없음
    // v2: encrypted + iv + algorithm 있음
    return !!(parsed.encrypted && parsed.checksum && !parsed.iv && !parsed.algorithm);
  } catch {
    return false;
  }
}

/**
 * 데이터가 이미 신버전 암호화 형식인지 확인
 * @param rawData - localStorage에서 가져온 원시 데이터
 * @returns 신버전 여부
 */
function isModernEncryption(rawData: string): boolean {
  try {
    const parsed = JSON.parse(rawData);
    // v2: encrypted + iv + algorithm 있음
    return !!(parsed.encrypted && parsed.iv && parsed.algorithm);
  } catch {
    return false;
  }
}

/**
 * 구버전 암호화 데이터를 신버전으로 마이그레이션
 * @param key - localStorage 키
 * @param masterPassword - 시스템 마스터 비밀번호
 * @returns 마이그레이션 성공 여부
 */
async function migrateKey(key: string, masterPassword: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage를 사용할 수 없습니다.');
    }

    const rawData = window.localStorage.getItem(key);
    if (!rawData) {
      return false; // 데이터 없음 - 스킵
    }

    // 이미 신버전이면 스킵
    if (isModernEncryption(rawData)) {
      console.log(`[Migration] ${key}: 이미 신버전 암호화 - 스킵`);
      return true;
    }

    // 구버전이 아니면 스킵 (평문 또는 다른 형식)
    if (!isLegacyEncryption(rawData)) {
      console.log(`[Migration] ${key}: 구버전 암호화 아님 - 스킵`);
      return true;
    }

    console.log(`[Migration] ${key}: 구버전 감지, 마이그레이션 시작...`);

    // 1. 구버전으로 복호화
    const decrypted = getLegacyItem(key);
    if (!decrypted) {
      throw new Error('구버전 복호화 실패');
    }

    console.log(`[Migration] ${key}: 구버전 복호화 성공 (${decrypted.length} bytes)`);

    // 2. 신버전으로 암호화
    await secureStorage.setSecureItem(key, decrypted);

    console.log(`[Migration] ${key}: 신버전 암호화 및 저장 완료 ✓`);

    return true;
  } catch (error) {
    console.error(`[Migration] ${key} 마이그레이션 실패:`, error);
    return false;
  }
}

/**
 * 모든 민감 데이터를 신버전으로 마이그레이션
 * @param masterPassword - 시스템 마스터 비밀번호
 * @returns 마이그레이션 결과
 */
export async function migrateAllSensitiveData(
  masterPassword: string
): Promise<MigrationResult> {
  console.log('=== 보안 시스템 마이그레이션 시작 ===');
  console.log(`대상 키: ${SENSITIVE_KEYS.length}개`);

  // 시스템 키 초기화
  try {
    await secureStorage.initializeSystemKey(masterPassword);
    console.log('시스템 보안 키 초기화 완료 ✓');
  } catch (error) {
    console.error('시스템 키 초기화 실패:', error);
    return {
      success: false,
      migratedKeys: [],
      failedKeys: SENSITIVE_KEYS,
      skippedKeys: [],
      errors: [{ key: 'SYSTEM', error: String(error) }],
    };
  }

  const result: MigrationResult = {
    success: true,
    migratedKeys: [],
    failedKeys: [],
    skippedKeys: [],
    errors: [],
  };

  // 각 키 마이그레이션
  for (const key of SENSITIVE_KEYS) {
    try {
      const migrated = await migrateKey(key, masterPassword);

      if (migrated) {
        // 데이터가 존재하고 마이그레이션 성공
        const rawData = window.localStorage.getItem(key);
        if (rawData && isModernEncryption(rawData)) {
          result.migratedKeys.push(key);
        } else {
          result.skippedKeys.push(key);
        }
      } else {
        // 마이그레이션 실패
        result.failedKeys.push(key);
        result.errors.push({ key, error: '마이그레이션 실패' });
      }
    } catch (error) {
      result.failedKeys.push(key);
      result.errors.push({ key, error: String(error) });
      result.success = false;
    }
  }

  console.log('=== 마이그레이션 완료 ===');
  console.log(`성공: ${result.migratedKeys.length}개`);
  console.log(`스킵: ${result.skippedKeys.length}개`);
  console.log(`실패: ${result.failedKeys.length}개`);

  return result;
}

/**
 * 마이그레이션 상태 확인
 * @returns 각 키의 암호화 버전 정보
 */
export function checkMigrationStatus(): Record<string, string> {
  const status: Record<string, string> = {};

  if (typeof window === 'undefined' || !window.localStorage) {
    return status;
  }

  for (const key of SENSITIVE_KEYS) {
    const rawData = window.localStorage.getItem(key);

    if (!rawData) {
      status[key] = '데이터 없음';
    } else if (isModernEncryption(rawData)) {
      status[key] = 'v2 (AES-256-GCM) ✓';
    } else if (isLegacyEncryption(rawData)) {
      status[key] = 'v1 (XOR) - 마이그레이션 필요 ⚠️';
    } else {
      status[key] = '알 수 없는 형식';
    }
  }

  return status;
}

/**
 * 구버전 암호화 시스템 완전 제거 (마이그레이션 후)
 * 주의: 이 함수는 마이그레이션이 완료되고 검증된 후에만 실행해야 합니다.
 */
export function removeLegacyEncryptionSystem(): void {
  console.warn(
    '⚠️ 이 작업은 되돌릴 수 없습니다. 마이그레이션이 완료되고 검증된 경우에만 실행하세요.'
  );

  // 구버전 암호화 관련 코드는 secureStorage.ts에 있으므로
  // 실제 제거는 수동으로 파일을 삭제하거나 리팩토링해야 합니다.
  console.log('구버전 시스템 제거는 secureStorage.ts 파일을 삭제/수정하여 진행하세요.');
}

/**
 * 마이그레이션 자동 실행 (앱 초기화 시)
 * @param masterPassword - 시스템 마스터 비밀번호
 */
export async function autoMigrate(masterPassword: string): Promise<void> {
  try {
    // 마이그레이션 상태 확인
    const status = checkMigrationStatus();
    const needsMigration = Object.values(status).some((s) => s.includes('v1'));

    if (!needsMigration) {
      console.log('✓ 모든 데이터가 이미 최신 암호화 형식입니다.');
      return;
    }

    console.log('⚠️ 구버전 암호화 감지 - 자동 마이그레이션 시작');

    // 마이그레이션 실행
    const result = await migrateAllSensitiveData(masterPassword);

    if (result.success && result.failedKeys.length === 0) {
      console.log('✓ 자동 마이그레이션 완료');
    } else {
      console.error('⚠️ 마이그레이션 중 일부 오류 발생:', result);
    }
  } catch (error) {
    console.error('자동 마이그레이션 실패:', error);
  }
}
