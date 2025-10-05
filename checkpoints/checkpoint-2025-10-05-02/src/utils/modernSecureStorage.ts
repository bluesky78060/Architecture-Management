/**
 * 현대적 보안 저장소 시스템
 * AES-256-GCM 암호화 + PBKDF2 키 파생
 * Web Crypto API 사용
 */

import { logger } from './logger';

/**
 * 암호화된 데이터 구조
 */
export interface EncryptedData {
  encrypted: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  algorithm: string;
  version: string;
}

/**
 * 키 파생 설정
 */
interface KeyDerivationConfig {
  iterations: number;
  keyLength: number;
  algorithm: string;
}

/**
 * 기본 키 파생 설정
 */
const DEFAULT_PBKDF2_ITERATIONS = 100_000; // OWASP 권장 최소값
const KEY_LENGTH_BITS = 256;
const IV_LENGTH_BYTES = 12;
const SALT_LENGTH_BYTES = 16;

const DEFAULT_KEY_CONFIG: KeyDerivationConfig = {
  iterations: DEFAULT_PBKDF2_ITERATIONS,
  keyLength: KEY_LENGTH_BITS,
  algorithm: 'PBKDF2'
};

/**
 * 현대적 보안 저장소 클래스
 */
export class ModernSecureStorage {
  private static instance: ModernSecureStorage;
  private cryptoKey: CryptoKey | null = null;
  private keyVersion: string = '1.0';

  private constructor() {}

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): ModernSecureStorage {
    if (ModernSecureStorage.instance === undefined) {
      ModernSecureStorage.instance = new ModernSecureStorage();
    }
    return ModernSecureStorage.instance;
  }

  /**
   * 사용자 비밀번호로부터 암호화 키 파생
   * @param password - 사용자 비밀번호
   * @param salt - 솔트 (옵션, 없으면 생성)
   * @returns 파생된 암호화 키와 사용된 솔트
   */
  async deriveKey(
    password: string,
    salt?: Uint8Array
  ): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    // 솔트 생성 또는 사용
    const actualSalt = salt ?? crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));

    // 비밀번호를 키 재료로 변환
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // PBKDF2로 키 파생
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: actualSalt,
        iterations: DEFAULT_KEY_CONFIG.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: DEFAULT_KEY_CONFIG.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, salt: actualSalt };
  }

  /**
   * 시스템 기본 키 초기화
   * @param password - 시스템 마스터 비밀번호
   */
  async initializeSystemKey(password: string): Promise<void> {
    // 저장된 솔트 확인
    const storedSalt = this.getStoredSalt();
    const { key, salt } = await this.deriveKey(password, storedSalt ?? undefined);

    this.cryptoKey = key;

    // 첫 초기화면 솔트 저장
    if (storedSalt == null) {
      this.storeSalt(salt);
    }
  }

  /**
   * 데이터 암호화
   * @param data - 암호화할 문자열 데이터
   * @param customKey - 커스텀 키 (옵션)
   * @returns 암호화된 데이터 객체
   */
  async encrypt(
    data: string,
    customKey?: CryptoKey
  ): Promise<EncryptedData> {
    const key = customKey ?? this.cryptoKey;

    if (key == null) {
      throw new Error('암호화 키가 초기화되지 않았습니다. initializeSystemKey()를 먼저 호출하세요.');
    }

    // IV (Initialization Vector) 생성
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

    // 데이터 암호화
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    // 솔트 가져오기
    const salt = this.getStoredSalt() ?? new Uint8Array(SALT_LENGTH_BYTES);

    return {
      encrypted,
      iv,
      salt,
      algorithm: 'AES-GCM-256',
      version: this.keyVersion
    };
  }

  /**
   * 데이터 복호화
   * @param encryptedData - 암호화된 데이터 객체
   * @param customKey - 커스텀 키 (옵션)
   * @returns 복호화된 문자열
   */
  async decrypt(
    encryptedData: EncryptedData,
    customKey?: CryptoKey
  ): Promise<string> {
    const key = customKey ?? this.cryptoKey;

    if (key == null) {
      throw new Error('암호화 키가 초기화되지 않았습니다.');
    }

    // 데이터 복호화
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encryptedData.iv
      },
      key,
      encryptedData.encrypted
    );

    // 문자열로 변환
    return new TextDecoder().decode(decrypted);
  }

  /**
   * localStorage에 암호화하여 저장
   * @param key - 저장소 키
   * @param value - 저장할 값
   */
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || window.localStorage == null) {
        throw new Error('localStorage를 사용할 수 없습니다.');
      }

      // 민감 데이터인지 확인
      if (this.isSensitiveData(key) === false) {
        // 일반 데이터는 그냥 저장
        window.localStorage.setItem(key, value);
        return;
      }

      // 암호화
      const encrypted = await this.encrypt(value);

      // 저장 가능한 형태로 직렬화
      const serialized = this.serializeEncryptedData(encrypted);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      logger.error('보안 저장 실패:', error);
      throw error;
    }
  }

  /**
   * localStorage에서 복호화하여 가져오기
   * @param key - 저장소 키
   * @returns 복호화된 값 또는 null
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || window.localStorage == null) {
        return null;
      }

      const rawData = window.localStorage.getItem(key);
      if (rawData === null) return null;

      // 민감 데이터가 아니면 그대로 반환
      if (this.isSensitiveData(key) === false) {
        return rawData;
      }

      // 역직렬화
      const encrypted = this.deserializeEncryptedData(rawData);
      if (encrypted == null) {
        // 구버전 데이터일 수 있음 - 그대로 반환
        return rawData;
      }

      // 복호화
      return await this.decrypt(encrypted);
    } catch (error) {
      logger.error('보안 읽기 실패:', error);
      return null;
    }
  }

  /**
   * 민감한 데이터인지 확인
   */
  private isSensitiveData(key: string): boolean {
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
   * 암호화 데이터 직렬화 (localStorage 저장용)
   */
  private serializeEncryptedData(data: EncryptedData): string {
    return JSON.stringify({
      encrypted: this.arrayBufferToBase64(data.encrypted),
      iv: this.uint8ArrayToBase64(data.iv),
      salt: this.uint8ArrayToBase64(data.salt),
      algorithm: data.algorithm,
      version: data.version
    });
  }

  /**
   * 암호화 데이터 역직렬화
   */
  private deserializeEncryptedData(serialized: string): EncryptedData | null {
    try {
      const parsed = JSON.parse(serialized);

      // 새로운 형식인지 확인
      if (parsed.encrypted == null || parsed.iv == null || parsed.algorithm == null) {
        return null;
      }

      return {
        encrypted: this.base64ToArrayBuffer(parsed.encrypted),
        iv: this.base64ToUint8Array(parsed.iv),
        salt: this.base64ToUint8Array(parsed.salt),
        algorithm: parsed.algorithm,
        version: parsed.version
      };
    } catch {
      return null;
    }
  }

  /**
   * ArrayBuffer를 Base64로 변환
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64를 ArrayBuffer로 변환
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Uint8Array를 Base64로 변환
   */
  private uint8ArrayToBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.byteLength; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64를 Uint8Array로 변환
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 솔트 저장
   */
  private storeSalt(salt: Uint8Array): void {
    if (typeof window !== 'undefined' && window.localStorage != null) {
      const base64Salt = this.uint8ArrayToBase64(salt);
      window.localStorage.setItem('CMS_SECURITY_SALT', base64Salt);
    }
  }

  /**
   * 저장된 솔트 가져오기
   */
  private getStoredSalt(): Uint8Array | null {
    if (typeof window === 'undefined' || window.localStorage == null) {
      return null;
    }

    const stored = window.localStorage.getItem('CMS_SECURITY_SALT');
    if (stored === null) return null;

    try {
      return this.base64ToUint8Array(stored);
    } catch {
      return null;
    }
  }

  /**
   * 보안 키 재설정
   */
  async resetSecurityKey(oldPassword: string, newPassword: string): Promise<void> {
    // 기존 키로 복호화 가능한지 검증
    await this.initializeSystemKey(oldPassword);

    // 새 솔트 생성
    const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const { key: newKey } = await this.deriveKey(newPassword, newSalt);

    // 모든 민감 데이터 재암호화
    await this.reencryptAllSensitiveData(newKey);

    // 새 키와 솔트 저장
    this.cryptoKey = newKey;
    this.storeSalt(newSalt);
  }

  /**
   * 모든 민감 데이터 재암호화
   */
  private async reencryptAllSensitiveData(newKey: CryptoKey): Promise<void> {
    if (typeof window === 'undefined' || window.localStorage == null) {
      return;
    }

    const sensitiveKeys = [
      'CMS_USERS',
      'CURRENT_USER',
      'CMS_DISABLE_LOGIN',
      'constructionApp_stampImage'
    ];

    for (const key of sensitiveKeys) {
      const decrypted = await this.getSecureItem(key);
      if (decrypted !== null && decrypted !== '') {
        const encrypted = await this.encrypt(decrypted, newKey);
        const serialized = this.serializeEncryptedData(encrypted);
        window.localStorage.setItem(key, serialized);
      }
    }
  }
}

/**
 * 전역 인스턴스 내보내기
 */
export const secureStorage = ModernSecureStorage.getInstance();
