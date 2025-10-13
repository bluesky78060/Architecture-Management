/**
 * Cloud SQL 기반 데이터베이스 서비스
 *
 * SQLite database.ts와 동일한 인터페이스를 제공하지만
 * Google Cloud SQL (MySQL)을 백엔드로 사용
 */

import cloudSqlService, { CloudSqlConfig } from './cloudSql';
import {
  DatabaseClient,
} from '../types/database';

class CloudDatabaseService {
  private initialized: boolean = false;

  /**
   * Cloud SQL 데이터베이스 초기화
   */
  async initialize(config: CloudSqlConfig): Promise<void> {
    try {
      console.log('🌐 Initializing Cloud Database Service...');

      // Cloud SQL 연결
      await cloudSqlService.initialize(config);

      // 스키마 확인 및 초기화
      await this.ensureSchema();

      this.initialized = true;
      console.log('✅ Cloud Database Service initialized');
    } catch (error) {
      console.error('❌ Cloud Database Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 스키마 존재 확인 및 생성
   */
  private async ensureSchema(): Promise<void> {
    // 테이블 존재 확인
    const tables = await cloudSqlService.query<any[]>(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    const tableNames = tables.map(t => t.TABLE_NAME);
    const requiredTables = ['clients', 'estimates', 'estimate_items', 'invoices', 'invoice_items', 'work_items', 'company_info'];

    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.log(`📋 Creating missing tables: ${missingTables.join(', ')}`);
      await this.createSchema();
    } else {
      console.log('✅ All required tables exist');
    }
  }

  /**
   * 스키마 생성 (MySQL 버전)
   */
  private async createSchema(): Promise<void> {
    const schema = `
      -- 건축주(Clients) 테이블
      CREATE TABLE IF NOT EXISTS clients (
        client_id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        representative VARCHAR(100),
        business_number VARCHAR(50),
        address TEXT,
        email VARCHAR(100),
        phone VARCHAR(20),
        contact_person VARCHAR(100),
        type ENUM('PERSON', 'BUSINESS') DEFAULT 'BUSINESS',
        notes TEXT,
        total_billed DECIMAL(15, 2) DEFAULT 0,
        outstanding DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clients_company_name (company_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      -- 견적서(Estimates) 테이블
      CREATE TABLE IF NOT EXISTS estimates (
        estimate_id INT AUTO_INCREMENT PRIMARY KEY,
        estimate_number VARCHAR(50) NOT NULL UNIQUE,
        client_id INT NOT NULL,
        workplace_id INT,
        project_name VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        date DATE,
        valid_until DATE,
        status ENUM('draft', 'sent', 'approved', 'rejected') DEFAULT 'draft',
        total_amount DECIMAL(15, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
        INDEX idx_estimates_client_id (client_id),
        INDEX idx_estimates_client_date (client_id, date),
        INDEX idx_estimates_client_status (client_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      -- 견적서 항목(Estimate Items) 테이블
      CREATE TABLE IF NOT EXISTS estimate_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        estimate_id INT NOT NULL,
        category VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        unit VARCHAR(50),
        quantity DECIMAL(10, 2),
        unit_price DECIMAL(15, 2),
        amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (estimate_id) REFERENCES estimates(estimate_id) ON DELETE CASCADE,
        INDEX idx_estimate_items_estimate_id (estimate_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      -- 청구서(Invoices) 테이블
      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        client_id INT NOT NULL,
        workplace_id INT,
        title VARCHAR(255) NOT NULL,
        date DATE,
        due_date DATE,
        status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
        amount DECIMAL(15, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
        INDEX idx_invoices_client_id (client_id),
        INDEX idx_invoices_client_status (client_id, status),
        INDEX idx_invoices_status_date (status, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      -- 청구서 항목(Invoice Items) 테이블
      CREATE TABLE IF NOT EXISTS invoice_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        category VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        unit VARCHAR(50),
        quantity DECIMAL(10, 2),
        unit_price DECIMAL(15, 2),
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price * tax_rate / 100) STORED,
        subtotal DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
        total DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax_rate / 100)) STORED,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
        INDEX idx_invoice_items_invoice_id (invoice_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      -- 작업 항목(Work Items) 테이블
      CREATE TABLE IF NOT EXISTS work_items (
        work_item_id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        workplace_id INT,
        invoice_id INT,
        category VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        status ENUM('planned', 'in_progress', 'completed', 'on_hold', 'cancelled') DEFAULT 'planned',
        progress INT DEFAULT 0,
        assigned_to VARCHAR(100),
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        estimated_hours DECIMAL(10, 2),
        actual_hours DECIMAL(10, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE SET NULL,
        INDEX idx_work_items_client_id (client_id),
        INDEX idx_work_items_client_status (client_id, status),
        INDEX idx_work_items_status_date (status, start_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      -- 회사 정보(Company Info) 테이블
      CREATE TABLE IF NOT EXISTS company_info (
        id INT PRIMARY KEY DEFAULT 1,
        company_name VARCHAR(255) NOT NULL,
        representative VARCHAR(100),
        business_number VARCHAR(50),
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(100),
        fax VARCHAR(20),
        website VARCHAR(255),
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHECK (id = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    // 스키마 실행 (각 명령문을 개별적으로 실행)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await cloudSqlService.query(statement);
    }

    console.log('✅ Schema created successfully');
  }

  /**
   * 초기화 확인
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Cloud Database not initialized. Call initialize() first.');
    }
  }

  // ============================================
  // 건축주(Clients) CRUD
  // ============================================

  async getAllClients(): Promise<DatabaseClient[]> {
    this.ensureInitialized();
    return await cloudSqlService.query<DatabaseClient[]>(
      'SELECT * FROM clients ORDER BY created_at DESC'
    );
  }

  async getClientById(id: number): Promise<DatabaseClient | null> {
    this.ensureInitialized();
    return await cloudSqlService.queryOne<DatabaseClient>(
      'SELECT * FROM clients WHERE client_id = ?',
      [id]
    );
  }

  async createClient(data: Omit<DatabaseClient, 'client_id' | 'created_at' | 'updated_at'>): Promise<number> {
    this.ensureInitialized();
    return await cloudSqlService.insert(
      `INSERT INTO clients (
        company_name, representative, business_number, address,
        email, phone, contact_person, type, notes,
        total_billed, outstanding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.company_name,
        data.representative || null,
        data.business_number || null,
        data.address || null,
        data.email || null,
        data.phone || null,
        data.contact_person || null,
        data.type || 'BUSINESS',
        data.notes || null,
        data.total_billed || 0,
        data.outstanding || 0
      ]
    );
  }

  async updateClient(id: number, data: Partial<DatabaseClient>): Promise<boolean> {
    this.ensureInitialized();
    const affectedRows = await cloudSqlService.execute(
      `UPDATE clients SET
        company_name = COALESCE(?, company_name),
        representative = COALESCE(?, representative),
        business_number = COALESCE(?, business_number),
        address = COALESCE(?, address),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        contact_person = COALESCE(?, contact_person),
        type = COALESCE(?, type),
        notes = COALESCE(?, notes),
        total_billed = COALESCE(?, total_billed),
        outstanding = COALESCE(?, outstanding)
      WHERE client_id = ?`,
      [
        data.company_name,
        data.representative,
        data.business_number,
        data.address,
        data.email,
        data.phone,
        data.contact_person,
        data.type,
        data.notes,
        data.total_billed,
        data.outstanding,
        id
      ]
    );
    return affectedRows > 0;
  }

  async deleteClient(id: number): Promise<boolean> {
    this.ensureInitialized();
    const affectedRows = await cloudSqlService.execute(
      'DELETE FROM clients WHERE client_id = ?',
      [id]
    );
    return affectedRows > 0;
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<boolean> {
    return await cloudSqlService.healthCheck();
  }

  /**
   * 통계 정보
   */
  getStats() {
    return cloudSqlService.getStats();
  }

  /**
   * 연결 종료
   */
  async close(): Promise<void> {
    await cloudSqlService.close();
    this.initialized = false;
  }
}

// 싱글톤 인스턴스
export const cloudDatabaseService = new CloudDatabaseService();
export default cloudDatabaseService;
