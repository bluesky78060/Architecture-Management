import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import {
  DatabaseClient,
  DatabaseEstimate,
  DatabaseEstimateItem,
  DatabaseInvoice,
  DatabaseInvoiceItem,
  DatabaseWorkItem,
  DatabaseCompanyInfo,
  SearchFilters,
  Statistics
} from '../types/database';

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string = '';

  /**
   * 데이터베이스 초기화
   * @param userDataPath - Electron app.getPath('userData') 또는 사용자 정의 경로
   */
  initialize(userDataPath: string): void {
    try {
      this.dbPath = path.join(userDataPath, 'cms.db');
      console.log('📂 Database path:', this.dbPath);

      // 디렉토리 생성
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 데이터베이스 연결
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // 성능 향상
      this.db.pragma('foreign_keys = ON');  // 외래키 활성화

      // 스키마 초기화
      this.initializeSchema();

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 스키마 초기화 (schema.sql 파일 실행)
   */
  private initializeSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      console.log('✅ Schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 확인
   */
  private ensureConnection(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // ============================================
  // 건축주(Clients) CRUD
  // ============================================

  getAllClients(): DatabaseClient[] {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as DatabaseClient[];
  }

  getClientById(id: number): DatabaseClient | undefined {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM clients WHERE client_id = ?').get(id) as DatabaseClient | undefined;
  }

  createClient(data: Omit<DatabaseClient, 'client_id' | 'created_at' | 'updated_at'>): number {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      INSERT INTO clients (
        company_name, representative, business_number, address,
        email, phone, contact_person, type, notes,
        total_billed, outstanding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.company_name,
      data.representative || null,
      data.business_number || null,
      data.address || null,
      data.email || null,
      data.phone || null,
      data.contact_person || null,
      data.type || 'PERSON',
      data.notes || null,
      data.total_billed || 0,
      data.outstanding || 0
    );

    return result.lastInsertRowid as number;
  }

  updateClient(id: number, data: Partial<DatabaseClient>): void {
    const db = this.ensureConnection();
    const fields: string[] = [];
    const values: any[] = [];

    // 동적 UPDATE 쿼리 생성
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'client_id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE client_id = ?`);
    stmt.run(...values);
  }

  deleteClient(id: number): void {
    const db = this.ensureConnection();
    db.prepare('DELETE FROM clients WHERE client_id = ?').run(id);
  }

  searchClients(query: string): DatabaseClient[] {
    const db = this.ensureConnection();
    const searchPattern = `%${query}%`;
    return db.prepare(`
      SELECT * FROM clients
      WHERE company_name LIKE ? OR representative LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
    `).all(searchPattern, searchPattern, searchPattern) as DatabaseClient[];
  }

  // ============================================
  // 견적서(Estimates) CRUD
  // ============================================

  getAllEstimates(): DatabaseEstimate[] {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM estimates ORDER BY date DESC').all() as DatabaseEstimate[];
  }

  getEstimateById(id: number): DatabaseEstimate | undefined {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM estimates WHERE estimate_id = ?').get(id) as DatabaseEstimate | undefined;
  }

  getEstimateWithItems(id: number): { estimate: DatabaseEstimate; items: DatabaseEstimateItem[] } | null {
    const db = this.ensureConnection();
    const estimate = this.getEstimateById(id);
    if (!estimate) return null;

    const items = db.prepare(
      'SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY sort_order'
    ).all(id) as DatabaseEstimateItem[];

    return { estimate, items };
  }

  createEstimate(
    estimate: Omit<DatabaseEstimate, 'estimate_id' | 'created_at' | 'updated_at'>,
    items: Omit<DatabaseEstimateItem, 'item_id' | 'estimate_id'>[]
  ): number {
    const db = this.ensureConnection();

    // 트랜잭션 시작
    const transaction = db.transaction(() => {
      // 견적서 생성
      const estStmt = db.prepare(`
        INSERT INTO estimates (
          estimate_number, client_id, workplace_id, project_name,
          title, date, valid_until, status, total_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const estResult = estStmt.run(
        estimate.estimate_number,
        estimate.client_id,
        estimate.workplace_id || null,
        estimate.project_name || null,
        estimate.title,
        estimate.date || null,
        estimate.valid_until || null,
        estimate.status || 'draft',
        estimate.total_amount || 0,
        estimate.notes || null
      );

      const estimateId = estResult.lastInsertRowid as number;

      // 견적 항목들 생성
      const itemStmt = db.prepare(`
        INSERT INTO estimate_items (
          estimate_id, category, name, description, quantity,
          unit, unit_price, notes, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach((item, index) => {
        itemStmt.run(
          estimateId,
          item.category || null,
          item.name,
          item.description || null,
          item.quantity || 0,
          item.unit || null,
          item.unit_price || 0,
          item.notes || null,
          item.sort_order || index
        );
      });

      return estimateId;
    });

    return transaction();
  }

  updateEstimate(id: number, data: Partial<DatabaseEstimate>): void {
    const db = this.ensureConnection();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'estimate_id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE estimates SET ${fields.join(', ')} WHERE estimate_id = ?`);
    stmt.run(...values);
  }

  deleteEstimate(id: number): void {
    const db = this.ensureConnection();
    // CASCADE로 estimate_items도 자동 삭제됨
    db.prepare('DELETE FROM estimates WHERE estimate_id = ?').run(id);
  }

  searchEstimates(filters: SearchFilters): DatabaseEstimate[] {
    const db = this.ensureConnection();
    let query = 'SELECT * FROM estimates WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.clientId) {
      query += ' AND client_id = ?';
      params.push(filters.clientId);
    }

    if (filters.dateFrom) {
      query += ' AND date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND date <= ?';
      params.push(filters.dateTo);
    }

    if (filters.query) {
      query += ' AND (estimate_number LIKE ? OR title LIKE ?)';
      const searchPattern = `%${filters.query}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY date DESC';

    if (filters.pageSize && filters.page !== undefined) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.pageSize, filters.page * filters.pageSize);
    }

    return db.prepare(query).all(...params) as DatabaseEstimate[];
  }

  // ============================================
  // 청구서(Invoices) CRUD
  // ============================================

  getAllInvoices(): DatabaseInvoice[] {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM invoices ORDER BY date DESC').all() as DatabaseInvoice[];
  }

  getInvoiceById(id: number): DatabaseInvoice | undefined {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM invoices WHERE invoice_id = ?').get(id) as DatabaseInvoice | undefined;
  }

  getInvoiceWithItems(id: number): { invoice: DatabaseInvoice; items: DatabaseInvoiceItem[] } | null {
    const db = this.ensureConnection();
    const invoice = this.getInvoiceById(id);
    if (!invoice) return null;

    const items = db.prepare(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order'
    ).all(id) as DatabaseInvoiceItem[];

    return { invoice, items };
  }

  createInvoice(
    invoice: Omit<DatabaseInvoice, 'invoice_id' | 'created_at' | 'updated_at'>,
    items: Omit<DatabaseInvoiceItem, 'item_id' | 'invoice_id'>[]
  ): number {
    const db = this.ensureConnection();

    const transaction = db.transaction(() => {
      // 청구서 생성
      const invStmt = db.prepare(`
        INSERT INTO invoices (
          invoice_number, client_id, project_name, workplace_address,
          amount, status, date, due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const invResult = invStmt.run(
        invoice.invoice_number,
        invoice.client_id,
        invoice.project_name || null,
        invoice.workplace_address || null,
        invoice.amount,
        invoice.status || 'pending',
        invoice.date,
        invoice.due_date || null
      );

      const invoiceId = invResult.lastInsertRowid as number;

      // 청구서 항목들 생성
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, name, category, description, quantity, unit,
          unit_price, notes, date, labor_persons, labor_unit_rate,
          labor_persons_general, labor_unit_rate_general, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach((item, index) => {
        itemStmt.run(
          invoiceId,
          item.name,
          item.category || null,
          item.description || null,
          item.quantity,
          item.unit || null,
          item.unit_price,
          item.notes || null,
          item.date || null,
          item.labor_persons || null,
          item.labor_unit_rate || null,
          item.labor_persons_general || null,
          item.labor_unit_rate_general || null,
          item.sort_order || index
        );
      });

      return invoiceId;
    });

    return transaction();
  }

  updateInvoice(id: number, data: Partial<DatabaseInvoice>): void {
    const db = this.ensureConnection();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'invoice_id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE invoice_id = ?`);
    stmt.run(...values);
  }

  deleteInvoice(id: number): void {
    const db = this.ensureConnection();
    db.prepare('DELETE FROM invoices WHERE invoice_id = ?').run(id);
  }

  searchInvoices(filters: SearchFilters): DatabaseInvoice[] {
    const db = this.ensureConnection();
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.clientId) {
      query += ' AND client_id = ?';
      params.push(filters.clientId);
    }

    if (filters.dateFrom) {
      query += ' AND date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND date <= ?';
      params.push(filters.dateTo);
    }

    if (filters.query) {
      query += ' AND (invoice_number LIKE ? OR project_name LIKE ?)';
      const searchPattern = `%${filters.query}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY date DESC';

    return db.prepare(query).all(...params) as DatabaseInvoice[];
  }

  // ============================================
  // 작업 항목(WorkItems) CRUD
  // ============================================

  getAllWorkItems(): DatabaseWorkItem[] {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM work_items ORDER BY created_at DESC').all() as DatabaseWorkItem[];
  }

  getWorkItemById(id: number): DatabaseWorkItem | undefined {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM work_items WHERE item_id = ?').get(id) as DatabaseWorkItem | undefined;
  }

  createWorkItem(data: Omit<DatabaseWorkItem, 'item_id' | 'created_at' | 'updated_at'>): number {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      INSERT INTO work_items (
        client_id, workplace_id, project_name, name, category,
        unit, quantity, default_price, description, notes, status,
        date, labor_persons, labor_unit_rate, labor_persons_general,
        labor_unit_rate_general
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.client_id,
      data.workplace_id || null,
      data.project_name || null,
      data.name,
      data.category || null,
      data.unit || null,
      data.quantity || null,
      data.default_price || null,
      data.description || null,
      data.notes || null,
      data.status || 'pending',
      data.date || null,
      data.labor_persons || null,
      data.labor_unit_rate || null,
      data.labor_persons_general || null,
      data.labor_unit_rate_general || null
    );

    return result.lastInsertRowid as number;
  }

  updateWorkItem(id: number, data: Partial<DatabaseWorkItem>): void {
    const db = this.ensureConnection();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'item_id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE work_items SET ${fields.join(', ')} WHERE item_id = ?`);
    stmt.run(...values);
  }

  deleteWorkItem(id: number): void {
    const db = this.ensureConnection();
    db.prepare('DELETE FROM work_items WHERE item_id = ?').run(id);
  }

  // ============================================
  // 회사 정보(CompanyInfo) CRUD
  // ============================================

  getCompanyInfo(): DatabaseCompanyInfo | undefined {
    const db = this.ensureConnection();
    return db.prepare('SELECT * FROM company_info WHERE id = 1').get() as DatabaseCompanyInfo | undefined;
  }

  updateCompanyInfo(data: Partial<DatabaseCompanyInfo>): void {
    const db = this.ensureConnection();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(1);
    const stmt = db.prepare(`UPDATE company_info SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  // ============================================
  // 통계 및 리포팅
  // ============================================

  getInvoiceStatistics(): Statistics {
    const db = this.ensureConnection();
    const result = db.prepare(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) as paid_count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0) as overdue_count,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as overdue_amount
      FROM invoices
    `).get() as Statistics;

    return result;
  }

  getEstimateStatistics(): Statistics {
    const db = this.ensureConnection();
    const result = db.prepare(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM estimates
    `).get() as Statistics;

    return result;
  }

  // ============================================
  // 유틸리티 메서드
  // ============================================

  /**
   * 데이터베이스 백업
   */
  backup(backupPath: string): void {
    const db = this.ensureConnection();
    db.backup(backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
  }

  /**
   * 데이터베이스 닫기
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ Database connection closed');
    }
  }

  /**
   * 데이터베이스 최적화
   */
  vacuum(): void {
    const db = this.ensureConnection();
    db.prepare('VACUUM').run();
    console.log('✅ Database vacuumed');
  }

  /**
   * 데이터베이스 무결성 검사
   */
  checkIntegrity(): boolean {
    const db = this.ensureConnection();
    const result = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    return result.integrity_check === 'ok';
  }

  // ============================================
  // 성능 최적화: JOIN 쿼리
  // ============================================

  /**
   * 청구서 목록 + 클라이언트 정보 (JOIN 최적화)
   */
  getInvoicesWithClients(): Array<DatabaseInvoice & { client_name: string; client_phone: string }> {
    const db = this.ensureConnection();
    return db.prepare(`
      SELECT
        i.*,
        c.company_name as client_name,
        c.phone as client_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.client_id
      ORDER BY i.date DESC
    `).all() as Array<DatabaseInvoice & { client_name: string; client_phone: string }>;
  }

  /**
   * 견적서 목록 + 클라이언트 정보 (JOIN 최적화)
   */
  getEstimatesWithClients(): Array<DatabaseEstimate & { client_name: string; client_phone: string }> {
    const db = this.ensureConnection();
    return db.prepare(`
      SELECT
        e.*,
        c.company_name as client_name,
        c.phone as client_phone
      FROM estimates e
      LEFT JOIN clients c ON e.client_id = c.client_id
      ORDER BY e.date DESC
    `).all() as Array<DatabaseEstimate & { client_name: string; client_phone: string }>;
  }

  /**
   * 작업 항목 목록 + 클라이언트 정보 (JOIN 최적화)
   */
  getWorkItemsWithClients(): Array<DatabaseWorkItem & { client_name: string }> {
    const db = this.ensureConnection();
    return db.prepare(`
      SELECT
        w.*,
        c.company_name as client_name
      FROM work_items w
      LEFT JOIN clients c ON w.client_id = c.client_id
      ORDER BY w.created_at DESC
    `).all() as Array<DatabaseWorkItem & { client_name: string }>;
  }

  /**
   * 특정 클라이언트의 모든 데이터 조회 (JOIN 최적화)
   */
  getClientWithAllData(clientId: number): {
    client: DatabaseClient | undefined;
    estimates: DatabaseEstimate[];
    invoices: DatabaseInvoice[];
    workItems: DatabaseWorkItem[];
  } {
    const db = this.ensureConnection();

    return {
      client: this.getClientById(clientId),
      estimates: db.prepare('SELECT * FROM estimates WHERE client_id = ? ORDER BY date DESC').all(clientId) as DatabaseEstimate[],
      invoices: db.prepare('SELECT * FROM invoices WHERE client_id = ? ORDER BY date DESC').all(clientId) as DatabaseInvoice[],
      workItems: db.prepare('SELECT * FROM work_items WHERE client_id = ? ORDER BY created_at DESC').all(clientId) as DatabaseWorkItem[]
    };
  }

  /**
   * 클라이언트별 통계 (JOIN + 집계)
   */
  getClientStatistics(clientId: number): {
    total_estimates: number;
    total_invoices: number;
    total_work_items: number;
    total_billed: number;
    total_paid: number;
    total_outstanding: number;
  } {
    const db = this.ensureConnection();
    const result = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM estimates WHERE client_id = ?) as total_estimates,
        (SELECT COUNT(*) FROM invoices WHERE client_id = ?) as total_invoices,
        (SELECT COUNT(*) FROM work_items WHERE client_id = ?) as total_work_items,
        (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE client_id = ?) as total_billed,
        (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE client_id = ? AND status = 'paid') as total_paid,
        (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE client_id = ? AND status IN ('pending', 'overdue')) as total_outstanding
    `).get(clientId, clientId, clientId, clientId, clientId, clientId) as any;

    return result;
  }
}

// 싱글톤 인스턴스
export const databaseService = new DatabaseService();
export default databaseService;
