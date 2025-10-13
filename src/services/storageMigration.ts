/* eslint-disable */
/**
 * localStorage → IndexedDB 마이그레이션 도구
 * 기존 localStorage 데이터를 IndexedDB로 안전하게 이전
 */

import { db } from './database.legacy';
import { logger } from '../utils/logger';
import type { Client, WorkItem, Invoice, Estimate, CompanyInfo } from '../types/domain';

/**
 * 마이그레이션 결과
 */
export interface MigrationResult {
  success: boolean;
  migratedCollections: string[];
  failedCollections: string[];
  stats: {
    clients: number;
    workItems: number;
    invoices: number;
    estimates: number;
    companyInfo: number;
  };
  errors: Array<{ collection: string; error: string }>;
  duration: number; // milliseconds
}

/**
 * localStorage 키 매핑
 */
const STORAGE_KEYS = {
  clients: 'CMS_CLIENTS',
  workItems: 'CMS_WORK_ITEMS',
  invoices: 'CMS_INVOICES',
  estimates: 'CMS_ESTIMATES',
  companyInfo: 'CMS_COMPANY_INFO',
  units: 'CMS_UNITS',
  categories: 'CMS_CATEGORIES',
};

/**
 * localStorage에서 데이터 읽기
 */
function getLocalStorageData<T>(key: string): T[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const rawData = window.localStorage.getItem(key);
    if (!rawData) return null;

    return JSON.parse(rawData);
  } catch (error) {
    logger.error(`Failed to read localStorage key: ${key}`, error);
    return null;
  }
}

/**
 * 단일 객체 localStorage에서 읽기
 */
function getLocalStorageObject<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const rawData = window.localStorage.getItem(key);
    if (!rawData) return null;

    return JSON.parse(rawData);
  } catch (error) {
    logger.error(`Failed to read localStorage key: ${key}`, error);
    return null;
  }
}

/**
 * 건축주 데이터 마이그레이션
 */
async function migrateClients(): Promise<number> {
  const clients = getLocalStorageData<Client>(STORAGE_KEYS.clients);
  if (!clients || clients.length === 0) {
    logger.log('No clients data to migrate');
    return 0;
  }

  let count = 0;
  for (const client of clients) {
    try {
      // ID 충돌 확인
      const existing = await db.clients.get(client.id as number);
      if (existing) {
        // 기존 데이터 업데이트
        await db.clients.update(client.id as number, client);
      } else {
        // 새 데이터 추가
        await db.clients.add(client);
      }
      count++;
    } catch (error) {
      logger.error(`Failed to migrate client ${client.id}:`, error);
    }
  }

  logger.log(`✅ Migrated ${count} clients`);
  return count;
}

/**
 * 작업 항목 데이터 마이그레이션
 */
async function migrateWorkItems(): Promise<number> {
  const workItems = getLocalStorageData<WorkItem>(STORAGE_KEYS.workItems);
  if (!workItems || workItems.length === 0) {
    logger.log('No work items data to migrate');
    return 0;
  }

  let count = 0;
  for (const item of workItems) {
    try {
      const existing = await db.workItems.get(item.id);
      if (existing) {
        await db.workItems.update(item.id, item);
      } else {
        await db.workItems.add(item);
      }
      count++;
    } catch (error) {
      logger.error(`Failed to migrate work item ${item.id}:`, error);
    }
  }

  logger.log(`✅ Migrated ${count} work items`);
  return count;
}

/**
 * 청구서 데이터 마이그레이션
 */
async function migrateInvoices(): Promise<number> {
  const invoices = getLocalStorageData<Invoice>(STORAGE_KEYS.invoices);
  if (!invoices || invoices.length === 0) {
    logger.log('No invoices data to migrate');
    return 0;
  }

  let count = 0;
  for (const invoice of invoices) {
    try {
      const existing = await db.invoices.get(invoice.id);
      if (existing) {
        await db.invoices.update(invoice.id, invoice);
      } else {
        await db.invoices.add(invoice);
      }
      count++;
    } catch (error) {
      logger.error(`Failed to migrate invoice ${invoice.id}:`, error);
    }
  }

  logger.log(`✅ Migrated ${count} invoices`);
  return count;
}

/**
 * 견적서 데이터 마이그레이션
 */
async function migrateEstimates(): Promise<number> {
  const estimates = getLocalStorageData<Estimate>(STORAGE_KEYS.estimates);
  if (!estimates || estimates.length === 0) {
    logger.log('No estimates data to migrate');
    return 0;
  }

  let count = 0;
  for (const estimate of estimates) {
    try {
      const existing = await db.estimates.get(estimate.id);
      if (existing) {
        await db.estimates.update(estimate.id, estimate);
      } else {
        await db.estimates.add(estimate);
      }
      count++;
    } catch (error) {
      logger.error(`Failed to migrate estimate ${estimate.id}:`, error);
    }
  }

  logger.log(`✅ Migrated ${count} estimates`);
  return count;
}

/**
 * 회사 정보 마이그레이션
 */
async function migrateCompanyInfo(): Promise<number> {
  const companyInfo = getLocalStorageObject<CompanyInfo>(STORAGE_KEYS.companyInfo);
  if (!companyInfo) {
    logger.log('No company info to migrate');
    return 0;
  }

  try {
    await db.companyInfo.update(1, companyInfo);
    logger.log('✅ Migrated company info');
    return 1;
  } catch (error) {
    logger.error('Failed to migrate company info:', error);
    return 0;
  }
}

/**
 * 단위/카테고리 설정 마이그레이션
 */
async function migrateSettings(): Promise<number> {
  let count = 0;

  // 단위 마이그레이션
  const units = getLocalStorageData<string>(STORAGE_KEYS.units);
  if (units && units.length > 0) {
    await db.setSetting('units', units);
    logger.log(`✅ Migrated ${units.length} units`);
    count++;
  }

  // 카테고리 마이그레이션
  const categories = getLocalStorageData<string>(STORAGE_KEYS.categories);
  if (categories && categories.length > 0) {
    await db.setSetting('categories', categories);
    logger.log(`✅ Migrated ${categories.length} categories`);
    count++;
  }

  return count;
}

/**
 * 마이그레이션 필요 여부 확인
 */
export async function needsMigration(): Promise<boolean> {
  // IndexedDB에 데이터가 있는지 확인
  const stats = await db.getStats();
  const hasIndexedDBData =
    stats.clients > 0 ||
    stats.workItems > 0 ||
    stats.invoices > 0 ||
    stats.estimates > 0;

  if (hasIndexedDBData) {
    logger.log('✅ IndexedDB already has data, migration not needed');
    return false;
  }

  // localStorage에 데이터가 있는지 확인
  const hasLocalStorageData =
    !!getLocalStorageData(STORAGE_KEYS.clients) ||
    !!getLocalStorageData(STORAGE_KEYS.workItems) ||
    !!getLocalStorageData(STORAGE_KEYS.invoices) ||
    !!getLocalStorageData(STORAGE_KEYS.estimates);

  if (hasLocalStorageData) {
    logger.log('⚠️ localStorage has data, migration needed');
    return true;
  }

  logger.log('✅ No data to migrate');
  return false;
}

/**
 * 전체 마이그레이션 실행
 */
export async function migrateAllData(): Promise<MigrationResult> {
  const startTime = performance.now();
  const result: MigrationResult = {
    success: true,
    migratedCollections: [],
    failedCollections: [],
    stats: {
      clients: 0,
      workItems: 0,
      invoices: 0,
      estimates: 0,
      companyInfo: 0,
    },
    errors: [],
    duration: 0,
  };

  logger.log('=== localStorage → IndexedDB 마이그레이션 시작 ===');

  // 1. 건축주 마이그레이션
  try {
    result.stats.clients = await migrateClients();
    result.migratedCollections.push('clients');
  } catch (error) {
    result.failedCollections.push('clients');
    result.errors.push({ collection: 'clients', error: String(error) });
    result.success = false;
  }

  // 2. 작업 항목 마이그레이션
  try {
    result.stats.workItems = await migrateWorkItems();
    result.migratedCollections.push('workItems');
  } catch (error) {
    result.failedCollections.push('workItems');
    result.errors.push({ collection: 'workItems', error: String(error) });
    result.success = false;
  }

  // 3. 청구서 마이그레이션
  try {
    result.stats.invoices = await migrateInvoices();
    result.migratedCollections.push('invoices');
  } catch (error) {
    result.failedCollections.push('invoices');
    result.errors.push({ collection: 'invoices', error: String(error) });
    result.success = false;
  }

  // 4. 견적서 마이그레이션
  try {
    result.stats.estimates = await migrateEstimates();
    result.migratedCollections.push('estimates');
  } catch (error) {
    result.failedCollections.push('estimates');
    result.errors.push({ collection: 'estimates', error: String(error) });
    result.success = false;
  }

  // 5. 회사 정보 마이그레이션
  try {
    result.stats.companyInfo = await migrateCompanyInfo();
    result.migratedCollections.push('companyInfo');
  } catch (error) {
    result.failedCollections.push('companyInfo');
    result.errors.push({ collection: 'companyInfo', error: String(error) });
    result.success = false;
  }

  // 6. 설정 마이그레이션
  try {
    await migrateSettings();
    result.migratedCollections.push('settings');
  } catch (error) {
    result.failedCollections.push('settings');
    result.errors.push({ collection: 'settings', error: String(error) });
  }

  const endTime = performance.now();
  result.duration = endTime - startTime;

  logger.log('=== 마이그레이션 완료 ===');
  logger.log(`성공: ${result.migratedCollections.length}개`);
  logger.log(`실패: ${result.failedCollections.length}개`);
  logger.log(`소요 시간: ${result.duration.toFixed(2)}ms`);
  logger.log('통계:', result.stats);

  return result;
}

/**
 * localStorage 백업 생성
 */
export function backupLocalStorage(): string {
  const backup: Record<string, any> = {};

  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const data = window.localStorage.getItem(storageKey);
    if (data) {
      backup[key] = data;
    }
  });

  return JSON.stringify(backup, null, 2);
}

/**
 * localStorage 백업 복원
 */
export function restoreLocalStorage(backupJson: string): void {
  const backup = JSON.parse(backupJson);

  Object.entries(backup).forEach(([key, value]) => {
    const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
    if (storageKey && typeof value === 'string') {
      window.localStorage.setItem(storageKey, value);
    }
  });

  logger.log('✅ localStorage 백업 복원 완료');
}

/**
 * 자동 마이그레이션 (앱 시작 시)
 */
export async function autoMigrate(): Promise<void> {
  try {
    const needed = await needsMigration();
    if (!needed) {
      return;
    }

    logger.log('⚠️ 자동 마이그레이션 시작...');

    // 백업 생성
    const backup = backupLocalStorage();
    sessionStorage.setItem('CMS_MIGRATION_BACKUP', backup);
    logger.log('✅ localStorage 백업 완료');

    // 마이그레이션 실행
    const result = await migrateAllData();

    if (result.success && result.failedCollections.length === 0) {
      logger.log('✅ 자동 마이그레이션 성공');

      // 마이그레이션 완료 플래그 저장
      await db.setSetting('migration_completed', {
        timestamp: new Date().toISOString(),
        version: '1.0',
        stats: result.stats,
      });
    } else {
      logger.error('⚠️ 마이그레이션 중 일부 오류 발생:', result);
    }
  } catch (error) {
    logger.error('❌ 자동 마이그레이션 실패:', error);
  }
}
