/**
 * IndexedDB 기반 고성능 데이터베이스
 * Dexie.js를 사용한 건축 관리 시스템 데이터베이스
 */

import { logger } from '../utils/logger';
import Dexie, { Table } from 'dexie';
import type {
  Client,
  WorkItem,
  Invoice,
  Estimate,
  CompanyInfo,
  InvoiceStatus,
  EstimateStatus,
  WorkStatus,
  SearchOptions,
  PaginatedResult,
} from '../types/domain';

/**
 * 건축 관리 시스템 데이터베이스 클래스
 */
export class CMSDatabase extends Dexie {
  // 테이블 정의
  clients!: Table<Client, number>;
  workItems!: Table<WorkItem, number | string>;
  invoices!: Table<Invoice, string>;
  estimates!: Table<Estimate, string>;
  companyInfo!: Table<CompanyInfo & { id: number }, number>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('CMSDatabase');

    // 버전 1: 초기 스키마
    this.version(1).stores({
      // 건축주 (Clients)
      // 인덱스: id(PK), name, type, createdAt
      clients: '++id, name, type, phone, email, createdAt',

      // 작업 항목 (WorkItems)
      // 인덱스: id(PK), clientId, status, date, category
      workItems: '++id, clientId, status, date, category, workplaceId',

      // 청구서 (Invoices)
      // 인덱스: id(PK), clientId, status, date
      invoices: 'id, clientId, status, date, client',

      // 견적서 (Estimates)
      // 인덱스: id(PK), clientId, status, date
      estimates: 'id, clientId, status, date, clientName',

      // 회사 정보 (단일 레코드)
      companyInfo: 'id',

      // 설정 (Key-Value Store)
      settings: 'key',
    });

    // 버전 2: 복합 인덱스 추가 (성능 최적화)
    this.version(2).stores({
      clients: '++id, name, type, phone, email, createdAt, [type+name]',
      workItems: '++id, clientId, status, date, category, workplaceId, [clientId+status], [clientId+date]',
      invoices: 'id, clientId, status, date, client, [clientId+status], [clientId+date], [status+date]',
      estimates: 'id, clientId, status, date, clientName, [clientId+status], [clientId+date], [status+date]',
      companyInfo: 'id',
      settings: 'key',
    });
  }

  /**
   * 데이터베이스 초기화
   */
  async initialize(): Promise<void> {
    try {
      // 회사 정보 초기 데이터 확인
      const companyCount = await this.companyInfo.count();
      if (companyCount === 0) {
        await this.companyInfo.add({
          id: 1,
          name: '회사명을 입력하세요',
          representative: '',
          phone: '',
          email: '',
          address: '',
          businessNumber: '',
          stampUrl: '',
          bankAccount: '',
          accountHolder: '',
        });
      }

      logger.log('✅ Database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // ==================== Clients (건축주) ====================

  /**
   * 건축주 목록 조회 (페이지네이션)
   */
  async getClientsPaged(page: number = 0, pageSize: number = 20, search?: string): Promise<PaginatedResult<Client>> {
    let query = this.clients.orderBy('createdAt').reverse();

    // 검색 필터
    if (search !== undefined && search !== '') {
      query = query.filter(
        (client) =>
          client.name.includes(search) ||
          (client.phone?.includes(search) ?? false) ||
          (client.email?.includes(search) ?? false) ||
          (client.address?.includes(search) ?? false)
      );
    }

    const total = await query.count();
    const data = await query.offset(page * pageSize).limit(pageSize).toArray();

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  /**
   * 건축주 ID로 조회
   */
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  /**
   * 건축주 추가
   */
  async addClient(client: Omit<Client, 'id'>): Promise<number> {
    const now = new Date().toISOString().split('T')[0];
    return this.clients.add({
      ...client,
      createdAt: client.createdAt || now,
      updatedAt: now,
    } as Client);
  }

  /**
   * 건축주 수정
   */
  async updateClient(id: number, updates: Partial<Client>): Promise<number> {
    const now = new Date().toISOString().split('T')[0];
    return this.clients.update(id, {
      ...updates,
      updatedAt: now,
    });
  }

  /**
   * 건축주 삭제
   */
  async deleteClient(id: number): Promise<void> {
    await this.clients.delete(id);
  }

  /**
   * 건축주 검색
   */
  async searchClients(query: string): Promise<Client[]> {
    return this.clients
      .filter(
        (client) =>
          client.name.includes(query) ||
          (client.phone?.includes(query) ?? false) ||
          (client.email?.includes(query) ?? false) ||
          (client.address?.includes(query) ?? false)
      )
      .toArray();
  }

  // ==================== WorkItems (작업 항목) ====================

  /**
   * 작업 항목 목록 조회 (페이지네이션 + 필터)
   */
  async getWorkItemsPaged(options: SearchOptions = {}): Promise<PaginatedResult<WorkItem>> {
    const { page = 0, pageSize = 20, query, status, clientId, dateFrom, dateTo } = options;

    let collection = this.workItems.orderBy('date').reverse();

    // 필터 적용
    if (clientId !== undefined && clientId !== null) {
      collection = this.workItems.where('[clientId+status]').between([clientId, ''], [clientId, 'ￓ']);
    }

    if (status !== undefined) {
      collection = collection.filter((item) => item.status === status);
    }

    if (dateFrom !== undefined || dateTo !== undefined) {
      collection = collection.filter((item) => {
        if (item.date === null || item.date === undefined) return false;
        if (dateFrom !== undefined && item.date < dateFrom) return false;
        if (dateTo !== undefined && item.date > dateTo) return false;
        return true;
      });
    }

    if (query !== undefined && query !== '') {
      collection = collection.filter(
        (item) =>
          item.name.includes(query) ||
          (item.clientName?.includes(query) ?? false) ||
          (item.projectName?.includes(query) ?? false) ||
          (item.description?.includes(query) ?? false)
      );
    }

    const total = await collection.count();
    const data = await collection.offset(page * pageSize).limit(pageSize).toArray();

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  /**
   * 작업 항목 추가
   */
  async addWorkItem(workItem: Omit<WorkItem, 'id'>): Promise<number | string> {
    return this.workItems.add(workItem as WorkItem);
  }

  /**
   * 작업 항목 수정
   */
  async updateWorkItem(id: number | string, updates: Partial<WorkItem>): Promise<number> {
    return this.workItems.update(id, updates);
  }

  /**
   * 작업 항목 삭제
   */
  async deleteWorkItem(id: number | string): Promise<void> {
    await this.workItems.delete(id);
  }

  /**
   * 건축주별 작업 항목 조회
   */
  async getWorkItemsByClient(clientId: number): Promise<WorkItem[]> {
    return this.workItems.where('clientId').equals(clientId).sortBy('date');
  }

  // ==================== Invoices (청구서) ====================

  /**
   * 청구서 목록 조회 (페이지네이션 + 필터)
   */
  async getInvoicesPaged(options: SearchOptions = {}): Promise<PaginatedResult<Invoice>> {
    const { page = 0, pageSize = 20, query, status, clientId, dateFrom, dateTo } = options;

    let collection = this.invoices.orderBy('date').reverse();

    // 복합 인덱스 활용
    if (clientId !== undefined && clientId !== null && status !== undefined) {
      collection = this.invoices.where('[clientId+status]').equals([clientId, status]);
    } else if (clientId !== undefined && clientId !== null) {
      collection = this.invoices.where('clientId').equals(clientId);
    } else if (status !== undefined) {
      collection = this.invoices.where('status').equals(status);
    }

    // 날짜 필터
    if (dateFrom !== undefined || dateTo !== undefined) {
      collection = collection.filter((invoice) => {
        if (dateFrom !== undefined && invoice.date < dateFrom) return false;
        if (dateTo !== undefined && invoice.date > dateTo) return false;
        return true;
      });
    }

    // 검색 쿼리
    if (query !== undefined && query !== '') {
      collection = collection.filter(
        (invoice) =>
          invoice.id.includes(query) ||
          invoice.client.includes(query) ||
          (invoice.project?.includes(query) ?? false)
      );
    }

    const total = await collection.count();
    const data = await collection.offset(page * pageSize).limit(pageSize).toArray();

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  /**
   * 청구서 추가
   */
  async addInvoice(invoice: Invoice): Promise<string> {
    return this.invoices.add(invoice);
  }

  /**
   * 청구서 수정
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<number> {
    return this.invoices.update(id, updates);
  }

  /**
   * 청구서 삭제
   */
  async deleteInvoice(id: string): Promise<void> {
    await this.invoices.delete(id);
  }

  /**
   * 청구서 ID로 조회
   */
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  /**
   * 건축주별 청구서 조회
   */
  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return this.invoices.where('clientId').equals(clientId).reverse().sortBy('date');
  }

  /**
   * 상태별 청구서 통계
   */
  async getInvoiceStats(): Promise<Record<InvoiceStatus, number>> {
    const statuses: InvoiceStatus[] = ['발송대기', '발송됨', '미결제', '결제완료'];
    const stats: Record<InvoiceStatus, number> = {} as any;

    for (const status of statuses) {
      stats[status] = await this.invoices.where('status').equals(status).count();
    }

    return stats;
  }

  // ==================== Estimates (견적서) ====================

  /**
   * 견적서 목록 조회 (페이지네이션 + 필터)
   */
  async getEstimatesPaged(options: SearchOptions = {}): Promise<PaginatedResult<Estimate>> {
    const { page = 0, pageSize = 20, query, status, clientId, dateFrom, dateTo } = options;

    let collection = this.estimates.orderBy('date').reverse();

    // 복합 인덱스 활용
    if (clientId !== undefined && clientId !== null && status !== undefined) {
      collection = this.estimates.where('[clientId+status]').equals([clientId, status]);
    } else if (clientId !== undefined && clientId !== null) {
      collection = this.estimates.where('clientId').equals(clientId);
    } else if (status !== undefined) {
      collection = this.estimates.where('status').equals(status);
    }

    // 날짜 필터
    if (dateFrom !== undefined || dateTo !== undefined) {
      collection = collection.filter((estimate) => {
        if (estimate.date === null || estimate.date === undefined) return true;
        if (dateFrom !== undefined && estimate.date < dateFrom) return false;
        if (dateTo !== undefined && estimate.date > dateTo) return false;
        return true;
      });
    }

    // 검색 쿼리
    if (query !== undefined && query !== '') {
      collection = collection.filter(
        (estimate) =>
          estimate.id.includes(query) ||
          (estimate.clientName?.includes(query) ?? false) ||
          estimate.title.includes(query) ||
          (estimate.projectName?.includes(query) ?? false)
      );
    }

    const total = await collection.count();
    const data = await collection.offset(page * pageSize).limit(pageSize).toArray();

    return {
      data,
      total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < total,
    };
  }

  /**
   * 견적서 추가
   */
  async addEstimate(estimate: Estimate): Promise<string> {
    return this.estimates.add(estimate);
  }

  /**
   * 견적서 수정
   */
  async updateEstimate(id: string, updates: Partial<Estimate>): Promise<number> {
    return this.estimates.update(id, updates);
  }

  /**
   * 견적서 삭제
   */
  async deleteEstimate(id: string): Promise<void> {
    await this.estimates.delete(id);
  }

  /**
   * 견적서 ID로 조회
   */
  async getEstimate(id: string): Promise<Estimate | undefined> {
    return this.estimates.get(id);
  }

  // ==================== CompanyInfo (회사 정보) ====================

  /**
   * 회사 정보 조회
   */
  async getCompanyInfo(): Promise<CompanyInfo> {
    const info = await this.companyInfo.get(1);
    if (!info) {
      throw new Error('회사 정보가 없습니다.');
    }
    const { id, ...companyInfo } = info;
    return companyInfo;
  }

  /**
   * 회사 정보 수정
   */
  async updateCompanyInfo(updates: Partial<CompanyInfo>): Promise<number> {
    return this.companyInfo.update(1, updates);
  }

  // ==================== Settings (설정) ====================

  /**
   * 설정 값 조회
   */
  async getSetting<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined> {
    const setting = await this.settings.get(key);
    return setting ? (setting.value as T) : defaultValue;
  }

  /**
   * 설정 값 저장
   */
  async setSetting(key: string, value: unknown): Promise<string> {
    return this.settings.put({ key, value });
  }

  /**
   * 설정 삭제
   */
  async deleteSetting(key: string): Promise<void> {
    await this.settings.delete(key);
  }

  // ==================== 유틸리티 ====================

  /**
   * 전체 데이터베이스 초기화 (개발용)
   */
  async clearAll(): Promise<void> {
    await this.transaction('rw', this.clients, this.workItems, this.invoices, this.estimates, async () => {
      await this.clients.clear();
      await this.workItems.clear();
      await this.invoices.clear();
      await this.estimates.clear();
    });
    logger.log('✅ All data cleared');
  }

  /**
   * 데이터베이스 통계
   */
  async getStats(): Promise<{
    clients: number;
    workItems: number;
    invoices: number;
    estimates: number;
  }> {
    return {
      clients: await this.clients.count(),
      workItems: await this.workItems.count(),
      invoices: await this.invoices.count(),
      estimates: await this.estimates.count(),
    };
  }

  /**
   * 데이터베이스 크기 추정 (bytes)
   */
  async estimateSize(): Promise<number> {
    let totalSize = 0;

    // 각 테이블의 데이터 크기 추정
    const clients = await this.clients.toArray();
    const workItems = await this.workItems.toArray();
    const invoices = await this.invoices.toArray();
    const estimates = await this.estimates.toArray();

    totalSize += JSON.stringify(clients).length;
    totalSize += JSON.stringify(workItems).length;
    totalSize += JSON.stringify(invoices).length;
    totalSize += JSON.stringify(estimates).length;

    return totalSize;
  }
}

// 싱글톤 인스턴스 내보내기
export const db = new CMSDatabase();

// 앱 시작 시 자동 초기화
db.initialize().catch(logger.error);
