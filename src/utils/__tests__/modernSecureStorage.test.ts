/**
 * 현대적 보안 저장소 테스트
 * AES-256-GCM 암호화 시스템 검증
 */

import { ModernSecureStorage } from '../modernSecureStorage';

describe('ModernSecureStorage', () => {
  let storage: ModernSecureStorage;
  const testPassword = 'test_master_password_12345!@#';
  const testKey = 'CMS_USERS';
  const testData = JSON.stringify({
    users: [
      { id: 1, username: 'admin', role: 'administrator' },
      { id: 2, username: 'user', role: 'user' },
    ],
  });

  beforeEach(async () => {
    storage = ModernSecureStorage.getInstance();
    await storage.initializeSystemKey(testPassword);

    // localStorage 초기화
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('키 파생 (PBKDF2)', () => {
    it('동일한 비밀번호와 salt로 동일한 키 생성', async () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const { key: key1 } = await storage.deriveKey(testPassword, salt);
      const { key: key2 } = await storage.deriveKey(testPassword, salt);

      // 키를 직접 비교할 수 없으므로 암호화 결과로 검증
      const testText = 'test data';
      const encrypted1 = await storage.encrypt(testText, key1);
      const decrypted1 = await storage.decrypt(encrypted1, key2);

      expect(decrypted1).toBe(testText);
    });

    it('다른 비밀번호로 다른 키 생성', async () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

      const { key: key1 } = await storage.deriveKey('password1', salt);
      const { key: key2 } = await storage.deriveKey('password2', salt);

      const testText = 'test data';
      const encrypted1 = await storage.encrypt(testText, key1);

      // 다른 키로 복호화 시도 시 실패해야 함
      await expect(storage.decrypt(encrypted1, key2)).rejects.toThrow();
    });
  });

  describe('암호화/복호화 (AES-256-GCM)', () => {
    it('데이터 암호화 및 복호화 성공', async () => {
      const encrypted = await storage.encrypt(testData);
      const decrypted = await storage.decrypt(encrypted);

      expect(decrypted).toBe(testData);
    });

    it('암호화된 데이터는 원본과 다름', async () => {
      const encrypted = await storage.encrypt(testData);
      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted.encrypted)));

      expect(encryptedBase64).not.toBe(testData);
    });

    it('한글 데이터 암호화 및 복호화 성공', async () => {
      const koreanData = '안녕하세요! 건축 관리 시스템입니다. 🏗️';
      const encrypted = await storage.encrypt(koreanData);
      const decrypted = await storage.decrypt(encrypted);

      expect(decrypted).toBe(koreanData);
    });

    it('특수문자 및 이모지 데이터 처리', async () => {
      const specialData = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`🔒🔑✅❌';
      const encrypted = await storage.encrypt(specialData);
      const decrypted = await storage.decrypt(encrypted);

      expect(decrypted).toBe(specialData);
    });

    it('대용량 데이터 암호화 및 복호화', async () => {
      const largeData = 'X'.repeat(100000); // 100KB
      const encrypted = await storage.encrypt(largeData);
      const decrypted = await storage.decrypt(encrypted);

      expect(decrypted).toBe(largeData);
      expect(decrypted.length).toBe(100000);
    });
  });

  describe('localStorage 통합', () => {
    it('민감 데이터 암호화하여 저장', async () => {
      await storage.setSecureItem(testKey, testData);

      const rawStored = window.localStorage.getItem(testKey);
      expect(rawStored).not.toBeNull();

      // 암호화된 형식인지 확인
      const parsed = JSON.parse(rawStored!);
      expect(parsed).toHaveProperty('encrypted');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('salt');
      expect(parsed).toHaveProperty('algorithm');
      expect(parsed.algorithm).toBe('AES-GCM-256');
    });

    it('암호화된 데이터 복호화하여 읽기', async () => {
      await storage.setSecureItem(testKey, testData);
      const retrieved = await storage.getSecureItem(testKey);

      expect(retrieved).toBe(testData);
    });

    it('민감하지 않은 데이터는 평문 저장', async () => {
      const normalKey = 'NORMAL_DATA';
      const normalData = 'This is not sensitive';

      await storage.setSecureItem(normalKey, normalData);
      const rawStored = window.localStorage.getItem(normalKey);

      expect(rawStored).toBe(normalData);
    });

    it('존재하지 않는 키 읽기 시 null 반환', async () => {
      const retrieved = await storage.getSecureItem('NON_EXISTENT_KEY');
      expect(retrieved).toBeNull();
    });
  });

  describe('보안 특성', () => {
    it('동일한 데이터를 여러 번 암호화 시 다른 결과 (IV 랜덤)', async () => {
      const encrypted1 = await storage.encrypt(testData);
      const encrypted2 = await storage.encrypt(testData);

      // IV가 다르므로 암호문도 달라야 함
      const enc1Base64 = btoa(String.fromCharCode(...new Uint8Array(encrypted1.encrypted)));
      const enc2Base64 = btoa(String.fromCharCode(...new Uint8Array(encrypted2.encrypted)));

      expect(enc1Base64).not.toBe(enc2Base64);

      // 하지만 복호화하면 같은 결과
      const decrypted1 = await storage.decrypt(encrypted1);
      const decrypted2 = await storage.decrypt(encrypted2);

      expect(decrypted1).toBe(testData);
      expect(decrypted2).toBe(testData);
      expect(decrypted1).toBe(decrypted2);
    });

    it('암호화 데이터 변조 시 복호화 실패', async () => {
      const encrypted = await storage.encrypt(testData);

      // 암호문 일부 변조
      const tamperedData = { ...encrypted };
      const encArray = new Uint8Array(tamperedData.encrypted);
      encArray[0] ^= 0xFF; // 첫 바이트 변조
      tamperedData.encrypted = encArray.buffer;

      // 복호화 실패 예상
      await expect(storage.decrypt(tamperedData)).rejects.toThrow();
    });

    it('잘못된 키로 복호화 시 실패', async () => {
      await storage.initializeSystemKey('password1');
      const encrypted = await storage.encrypt(testData);

      // 다른 비밀번호로 새 키 초기화
      await storage.initializeSystemKey('password2');

      // 복호화 실패 예상
      await expect(storage.decrypt(encrypted)).rejects.toThrow();
    });
  });

  describe('버전 관리', () => {
    it('암호화 데이터에 버전 정보 포함', async () => {
      const encrypted = await storage.encrypt(testData);
      expect(encrypted.version).toBe('1.0');
    });

    it('저장된 데이터에 버전 정보 포함', async () => {
      await storage.setSecureItem(testKey, testData);
      const rawStored = window.localStorage.getItem(testKey);
      const parsed = JSON.parse(rawStored!);

      expect(parsed).toHaveProperty('version');
      expect(parsed.version).toBe('1.0');
    });
  });

  describe('에러 처리', () => {
    it('초기화되지 않은 키로 암호화 시도 시 에러', async () => {
      const newStorage = new (ModernSecureStorage as any)();

      await expect(newStorage.encrypt(testData)).rejects.toThrow(
        '암호화 키가 초기화되지 않았습니다'
      );
    });

    it('초기화되지 않은 키로 복호화 시도 시 에러', async () => {
      const newStorage = new (ModernSecureStorage as any)();
      const encrypted = await storage.encrypt(testData);

      await expect(newStorage.decrypt(encrypted)).rejects.toThrow(
        '암호화 키가 초기화되지 않았습니다'
      );
    });
  });

  describe('성능 테스트', () => {
    it('1000개 데이터 암호화/복호화 성능', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const testData = `Test data ${i}`;
        const encrypted = await storage.encrypt(testData);
        const decrypted = await storage.decrypt(encrypted);
        expect(decrypted).toBe(testData);
      }

      const endTime = performance.now();
      const elapsed = endTime - startTime;

      console.log(`1000개 암호화/복호화: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(10000); // 10초 이내
    }, 15000);
  });
});
