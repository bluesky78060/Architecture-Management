# SQL 스키마 변경 가이드

> **작성일**: 2025년 10월 12일
> **대상**: SQLite 스키마 수정 및 마이그레이션

---

## 📋 목차

1. [개요](#개요)
2. [난이도별 변경 유형](#난이도별-변경-유형)
3. [마이그레이션 시스템 구축](#마이그레이션-시스템-구축)
4. [시나리오별 가이드](#시나리오별-가이드)
5. [베스트 프랙티스](#베스트-프랙티스)
6. [문제 해결](#문제-해결)

---

## 개요

### SQL vs JSON 스키마 변경 비교

| 항목 | JSON | SQLite | 차이점 |
|------|------|--------|--------|
| **새 필드 추가** | 코드만 수정 | ALTER TABLE + 코드 수정 | SQL이 1단계 더 필요 |
| **필드 제거** | 코드만 수정 | 테이블 재생성 필요 | SQL이 복잡함 |
| **타입 변경** | 자유로움 | 테이블 재생성 필요 | SQL이 매우 복잡함 |
| **관계 추가** | 자유로움 | 외래키 제약 조건 설정 | SQL이 엄격함 |
| **버전 관리** | Git만 | 마이그레이션 시스템 필요 | SQL이 체계적 |
| **롤백** | Git revert | 마이그레이션 down() | SQL이 안전함 |

### 핵심 포인트

✅ **장점**:
- 데이터 무결성 보장
- 체계적인 버전 관리
- 안전한 롤백 시스템

❌ **단점**:
- 초기 설정 복잡
- 타입 변경 시 번거로움
- SQLite 제약사항 존재

---

## 난이도별 변경 유형

### ⭐ Level 1: 매우 쉬움 (10분 이내)

**변경 사항**:
- 새로운 NULL 허용 컬럼 추가
- 인덱스 추가/제거
- 기본값이 있는 컬럼 추가

**예시**:
```sql
-- 새 컬럼 추가
ALTER TABLE clients ADD COLUMN fax VARCHAR(20);

-- 인덱스 추가
CREATE INDEX idx_clients_fax ON clients(fax);
```

**소요 시간**: 5-10분
**위험도**: 낮음

---

### ⭐⭐ Level 2: 쉬움 (10-30분)

**변경 사항**:
- 새로운 테이블 추가 (관계 없음)
- 뷰 추가/수정
- 트리거 추가/수정

**예시**:
```sql
-- 독립적인 새 테이블
CREATE TABLE notes (
  note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
```

**소요 시간**: 10-30분
**위험도**: 낮음

---

### ⭐⭐⭐ Level 3: 보통 (30분-1시간)

**변경 사항**:
- 외래키 관계가 있는 새 테이블
- 복합 인덱스 추가
- 데이터 변환이 필요한 컬럼 추가

**예시**:
```sql
-- 외래키 관계 테이블
CREATE TABLE projects (
  project_id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  name VARCHAR(200),
  FOREIGN KEY (client_id) REFERENCES clients(client_id)
);
```

**소요 시간**: 30분-1시간
**위험도**: 보통

---

### ⭐⭐⭐⭐ Level 4: 어려움 (1-2시간)

**변경 사항**:
- 컬럼 타입 변경
- NOT NULL 제약 조건 추가
- 기존 데이터 마이그레이션 필요

**예시**:
```sql
-- 테이블 재생성 필요
CREATE TABLE clients_new (...);
INSERT INTO clients_new SELECT * FROM clients;
DROP TABLE clients;
ALTER TABLE clients_new RENAME TO clients;
```

**소요 시간**: 1-2시간
**위험도**: 높음

---

### ⭐⭐⭐⭐⭐ Level 5: 매우 어려움 (2-4시간)

**변경 사항**:
- 테이블 분리/병합
- 복잡한 데이터 변환
- 외래키 관계 재구성

**예시**:
```sql
-- clients → clients + client_contacts 분리
CREATE TABLE client_contacts (...);
INSERT INTO client_contacts SELECT ... FROM clients;
-- 복잡한 데이터 변환 로직
```

**소요 시간**: 2-4시간
**위험도**: 매우 높음

---

## 마이그레이션 시스템 구축

### Step 1: 마이그레이션 관리 테이블

```sql
-- 스키마 버전 관리 테이블
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  applied_at TEXT DEFAULT (datetime('now', 'localtime')),
  checksum VARCHAR(64) -- 무결성 검증용
);
```

### Step 2: 마이그레이션 인터페이스

```typescript
// src/services/migrations/types.ts

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
  checksum?: string;
}
```

### Step 3: 마이그레이션 매니저

```typescript
// src/services/migrations/MigrationManager.ts

import Database from 'better-sqlite3';
import { Migration } from './types';
import { createHash } from 'crypto';

class MigrationManager {
  private db: Database.Database;
  private migrations: Migration[] = [];

  constructor(db: Database.Database) {
    this.db = db;
    this.initMigrationTable();
  }

  /**
   * 마이그레이션 테이블 초기화
   */
  private initMigrationTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        applied_at TEXT DEFAULT (datetime('now', 'localtime')),
        checksum VARCHAR(64)
      );
    `);
  }

  /**
   * 마이그레이션 등록
   */
  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * 현재 스키마 버전 조회
   */
  getCurrentVersion(): number {
    const result = this.db.prepare(
      'SELECT COALESCE(MAX(version), 0) as version FROM schema_migrations'
    ).get() as { version: number };
    return result.version;
  }

  /**
   * 마이그레이션 체크섬 생성
   */
  private generateChecksum(migration: Migration): string {
    const content = migration.up.toString() + migration.down.toString();
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 마이그레이션 실행
   */
  async migrate(): Promise<void> {
    const currentVersion = this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`🔄 Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      console.log(`📦 Applying migration ${migration.version}: ${migration.name}`);

      try {
        const checksum = this.generateChecksum(migration);

        const transaction = this.db.transaction(() => {
          // 마이그레이션 실행
          migration.up(this.db);

          // 버전 기록
          this.db.prepare(`
            INSERT INTO schema_migrations (version, name, checksum)
            VALUES (?, ?, ?)
          `).run(migration.version, migration.name, checksum);
        });

        transaction();
        console.log(`✅ Migration ${migration.version} applied successfully`);

      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log('✅ All migrations applied');
  }

  /**
   * 마이그레이션 롤백
   */
  async rollback(targetVersion: number = -1): Promise<void> {
    const currentVersion = this.getCurrentVersion();

    if (targetVersion === -1) {
      targetVersion = currentVersion - 1;
    }

    if (targetVersion >= currentVersion) {
      console.log('⚠️ Nothing to rollback');
      return;
    }

    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse();

    console.log(`⏪ Rolling back ${migrationsToRollback.length} migrations`);

    for (const migration of migrationsToRollback) {
      console.log(`📦 Rolling back migration ${migration.version}: ${migration.name}`);

      try {
        const transaction = this.db.transaction(() => {
          // 롤백 실행
          migration.down(this.db);

          // 버전 기록 삭제
          this.db.prepare(
            'DELETE FROM schema_migrations WHERE version = ?'
          ).run(migration.version);
        });

        transaction();
        console.log(`✅ Migration ${migration.version} rolled back successfully`);

      } catch (error) {
        console.error(`❌ Rollback ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log('✅ Rollback completed');
  }

  /**
   * 마이그레이션 상태 조회
   */
  getStatus(): { version: number; name: string; applied_at: string }[] {
    return this.db.prepare(
      'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
    ).all() as any[];
  }

  /**
   * 무결성 검증
   */
  validateIntegrity(): boolean {
    const appliedMigrations = this.db.prepare(
      'SELECT version, checksum FROM schema_migrations ORDER BY version'
    ).all() as { version: number; checksum: string }[];

    for (const applied of appliedMigrations) {
      const migration = this.migrations.find(m => m.version === applied.version);

      if (!migration) {
        console.error(`❌ Migration ${applied.version} not found in code`);
        return false;
      }

      const currentChecksum = this.generateChecksum(migration);
      if (currentChecksum !== applied.checksum) {
        console.error(`❌ Migration ${applied.version} checksum mismatch`);
        return false;
      }
    }

    console.log('✅ All migrations verified');
    return true;
  }
}

export default MigrationManager;
```

### Step 4: 마이그레이션 파일 예시

```typescript
// src/services/migrations/001_initial_schema.ts

import { Migration } from './types';

export const migration_001: Migration = {
  version: 1,
  name: 'initial_schema',

  up: (db) => {
    // 초기 스키마 생성
    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name VARCHAR(200) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      CREATE INDEX idx_clients_company_name ON clients(company_name);
    `);
  },

  down: (db) => {
    db.exec('DROP TABLE IF EXISTS clients');
  }
};
```

```typescript
// src/services/migrations/002_add_fax_to_clients.ts

export const migration_002: Migration = {
  version: 2,
  name: 'add_fax_to_clients',

  up: (db) => {
    db.exec(`
      ALTER TABLE clients ADD COLUMN fax VARCHAR(20);
    `);
  },

  down: (db) => {
    // SQLite는 컬럼 삭제 불가능 (3.35.0 이전)
    // 테이블 재생성 필요
    db.exec(`
      CREATE TABLE clients_new AS
      SELECT client_id, company_name, phone, email, created_at, updated_at
      FROM clients;

      DROP TABLE clients;
      ALTER TABLE clients_new RENAME TO clients;

      CREATE INDEX idx_clients_company_name ON clients(company_name);
    `);
  }
};
```

### Step 5: 마이그레이션 인덱스 파일

```typescript
// src/services/migrations/index.ts

import { Migration } from './types';
import { migration_001 } from './001_initial_schema';
import { migration_002 } from './002_add_fax_to_clients';
// ... 추가 마이그레이션 import

export const migrations: Migration[] = [
  migration_001,
  migration_002,
  // ... 추가 마이그레이션
];
```

### Step 6: Database Service 통합

```typescript
// src/services/database.ts

import MigrationManager from './migrations/MigrationManager';
import { migrations } from './migrations';

class DatabaseService {
  private migrationManager: MigrationManager | null = null;

  initialize(userDataPath: string): void {
    this.dbPath = path.join(userDataPath, 'cms.db');
    this.db = new Database(this.dbPath);

    // WAL 모드 활성화
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // ✨ 마이그레이션 매니저 초기화
    this.migrationManager = new MigrationManager(this.db);

    // 마이그레이션 등록
    migrations.forEach(migration => {
      this.migrationManager!.register(migration);
    });

    // 마이그레이션 실행
    this.migrationManager.migrate();

    // 무결성 검증
    if (!this.migrationManager.validateIntegrity()) {
      throw new Error('Migration integrity check failed');
    }

    console.log('✅ Database initialized with migrations');
  }

  // 마이그레이션 상태 조회
  getMigrationStatus() {
    return this.migrationManager?.getStatus() || [];
  }

  // 롤백
  async rollback(targetVersion?: number) {
    if (!this.migrationManager) {
      throw new Error('Migration manager not initialized');
    }
    await this.migrationManager.rollback(targetVersion);
  }
}
```

---

## 시나리오별 가이드

### 시나리오 1: 새로운 컬럼 추가 (⭐⭐)

**목표**: `clients` 테이블에 `website` 필드 추가

```typescript
// migrations/003_add_website_to_clients.ts

export const migration_003: Migration = {
  version: 3,
  name: 'add_website_to_clients',

  up: (db) => {
    db.exec(`
      ALTER TABLE clients ADD COLUMN website VARCHAR(200);
    `);

    console.log('✅ Added website column to clients');
  },

  down: (db) => {
    // 컬럼 삭제 (테이블 재생성)
    db.transaction(() => {
      db.exec(`
        CREATE TABLE clients_backup AS SELECT * FROM clients;

        CREATE TABLE clients_new (
          client_id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_name VARCHAR(200) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          fax VARCHAR(20),
          -- website 제외
          created_at TEXT,
          updated_at TEXT
        );

        INSERT INTO clients_new (client_id, company_name, phone, email, fax, created_at, updated_at)
        SELECT client_id, company_name, phone, email, fax, created_at, updated_at
        FROM clients;

        DROP TABLE clients;
        ALTER TABLE clients_new RENAME TO clients;

        -- 인덱스 재생성
        CREATE INDEX idx_clients_company_name ON clients(company_name);

        DROP TABLE clients_backup;
      `);
    })();

    console.log('✅ Removed website column from clients');
  }
};
```

**TypeScript 타입 업데이트**:

```typescript
// src/types/database.ts

export interface DatabaseClient {
  client_id: number;
  company_name: string;
  phone?: string;
  email?: string;
  fax?: string;
  website?: string; // ✨ 신규
  created_at: string;
  updated_at: string;
}
```

**서비스 코드 업데이트** (필요 시):

```typescript
// src/services/database.ts

createClient(data: Omit<DatabaseClient, 'client_id' | 'created_at' | 'updated_at'>): number {
  const stmt = this.db.prepare(`
    INSERT INTO clients (company_name, phone, email, fax, website)
    VALUES (?, ?, ?, ?, ?)
  `);

  return stmt.run(
    data.company_name,
    data.phone || null,
    data.email || null,
    data.fax || null,
    data.website || null // ✨ 신규
  ).lastInsertRowid as number;
}
```

---

### 시나리오 2: 새로운 관계 테이블 추가 (⭐⭐⭐)

**목표**: 건축주별 여러 연락처를 관리하는 `client_contacts` 테이블 추가

```typescript
// migrations/004_add_client_contacts.ts

export const migration_004: Migration = {
  version: 4,
  name: 'add_client_contacts',

  up: (db) => {
    db.transaction(() => {
      // 1. 새 테이블 생성
      db.exec(`
        CREATE TABLE client_contacts (
          contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(50),
          mobile VARCHAR(50),
          email VARCHAR(100),
          position VARCHAR(50),
          department VARCHAR(50),
          is_primary INTEGER DEFAULT 0,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
        );
      `);

      // 2. 인덱스 생성
      db.exec(`
        CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
        CREATE INDEX idx_client_contacts_is_primary ON client_contacts(is_primary);
      `);

      // 3. 트리거 생성
      db.exec(`
        CREATE TRIGGER update_client_contacts_timestamp
          AFTER UPDATE ON client_contacts
          FOR EACH ROW
        BEGIN
          UPDATE client_contacts
          SET updated_at = datetime('now', 'localtime')
          WHERE contact_id = NEW.contact_id;
        END;
      `);

      // 4. 기존 clients 데이터에서 주 연락처 생성
      db.exec(`
        INSERT INTO client_contacts (client_id, name, phone, email, is_primary)
        SELECT
          client_id,
          COALESCE(representative, '담당자'),
          phone,
          email,
          1
        FROM clients
        WHERE phone IS NOT NULL OR email IS NOT NULL;
      `);

      console.log('✅ Created client_contacts table with existing data');
    })();
  },

  down: (db) => {
    db.exec('DROP TABLE IF EXISTS client_contacts');
    console.log('✅ Removed client_contacts table');
  }
};
```

**새 TypeScript 타입**:

```typescript
// src/types/database.ts

export interface DatabaseClientContact {
  contact_id: number;
  client_id: number;
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  position?: string;
  department?: string;
  is_primary: number; // 0 or 1 (boolean)
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**서비스 메서드 추가**:

```typescript
// src/services/database.ts

// 건축주별 연락처 조회
getClientContacts(clientId: number): DatabaseClientContact[] {
  return this.db.prepare(`
    SELECT * FROM client_contacts
    WHERE client_id = ?
    ORDER BY is_primary DESC, name
  `).all(clientId) as DatabaseClientContact[];
}

// 연락처 추가
createClientContact(data: Omit<DatabaseClientContact, 'contact_id' | 'created_at' | 'updated_at'>): number {
  const stmt = this.db.prepare(`
    INSERT INTO client_contacts (
      client_id, name, phone, mobile, email, position, department, is_primary, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    data.client_id,
    data.name,
    data.phone || null,
    data.mobile || null,
    data.email || null,
    data.position || null,
    data.department || null,
    data.is_primary,
    data.notes || null
  ).lastInsertRowid as number;
}

// 주 연락처 설정
setPrimaryContact(contactId: number, clientId: number): void {
  this.db.transaction(() => {
    // 기존 주 연락처 해제
    this.db.prepare(`
      UPDATE client_contacts
      SET is_primary = 0
      WHERE client_id = ?
    `).run(clientId);

    // 새 주 연락처 설정
    this.db.prepare(`
      UPDATE client_contacts
      SET is_primary = 1
      WHERE contact_id = ?
    `).run(contactId);
  })();
}
```

---

### 시나리오 3: 컬럼 타입 변경 (⭐⭐⭐⭐)

**목표**: `invoices.amount` 타입을 REAL → DECIMAL(15,2)로 변경 (실제로는 SQLite는 REAL을 사용하지만, 정밀도 개선)

```typescript
// migrations/005_improve_amount_precision.ts

export const migration_005: Migration = {
  version: 5,
  name: 'improve_amount_precision',

  up: (db) => {
    db.transaction(() => {
      console.log('🔄 Starting invoices table recreation...');

      // 1. 백업 테이블 생성
      db.exec('CREATE TABLE invoices_backup AS SELECT * FROM invoices');

      // 2. 새 테이블 생성 (개선된 스키마)
      db.exec(`
        CREATE TABLE invoices_new (
          invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          client_id INTEGER NOT NULL,
          project_name VARCHAR(200),
          workplace_address TEXT,
          amount INTEGER NOT NULL DEFAULT 0, -- ✨ 정수 센트 단위 저장 (정밀도 개선)
          status VARCHAR(20) DEFAULT 'pending',
          date TEXT NOT NULL,
          due_date TEXT,
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
        );
      `);

      // 3. 데이터 변환 (REAL → INTEGER 센트)
      db.exec(`
        INSERT INTO invoices_new
        SELECT
          invoice_id,
          invoice_number,
          client_id,
          project_name,
          workplace_address,
          CAST(amount * 100 AS INTEGER), -- 원 → 센트 (정밀도 100배)
          status,
          date,
          due_date,
          created_at,
          updated_at
        FROM invoices;
      `);

      // 4. 기존 테이블 삭제 및 이름 변경
      db.exec('DROP TABLE invoices');
      db.exec('ALTER TABLE invoices_new RENAME TO invoices');

      // 5. 인덱스 재생성
      db.exec(`
        CREATE INDEX idx_invoices_number ON invoices(invoice_number);
        CREATE INDEX idx_invoices_client_id ON invoices(client_id);
        CREATE INDEX idx_invoices_status ON invoices(status);
        CREATE INDEX idx_invoices_date ON invoices(date);
      `);

      // 6. 트리거 재생성
      db.exec(`
        CREATE TRIGGER update_invoices_timestamp
          AFTER UPDATE ON invoices
          FOR EACH ROW
        BEGIN
          UPDATE invoices
          SET updated_at = datetime('now', 'localtime')
          WHERE invoice_id = NEW.invoice_id;
        END;
      `);

      // 7. 백업 삭제
      db.exec('DROP TABLE invoices_backup');

      console.log('✅ Invoices table recreated with improved precision');
    })();
  },

  down: (db) => {
    db.transaction(() => {
      console.log('⏪ Rolling back invoices precision change...');

      db.exec('CREATE TABLE invoices_backup AS SELECT * FROM invoices');

      db.exec(`
        CREATE TABLE invoices_new (
          invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          client_id INTEGER NOT NULL,
          project_name VARCHAR(200),
          workplace_address TEXT,
          amount REAL NOT NULL DEFAULT 0, -- 원래 타입으로 복구
          status VARCHAR(20) DEFAULT 'pending',
          date TEXT NOT NULL,
          due_date TEXT,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(client_id)
        );
      `);

      // 데이터 복구 (센트 → 원)
      db.exec(`
        INSERT INTO invoices_new
        SELECT
          invoice_id,
          invoice_number,
          client_id,
          project_name,
          workplace_address,
          CAST(amount AS REAL) / 100.0, -- 센트 → 원
          status,
          date,
          due_date,
          created_at,
          updated_at
        FROM invoices;
      `);

      db.exec('DROP TABLE invoices');
      db.exec('ALTER TABLE invoices_new RENAME TO invoices');

      // 인덱스 및 트리거 재생성
      db.exec(`
        CREATE INDEX idx_invoices_number ON invoices(invoice_number);
        CREATE INDEX idx_invoices_client_id ON invoices(client_id);
        CREATE INDEX idx_invoices_status ON invoices(status);
        CREATE INDEX idx_invoices_date ON invoices(date);

        CREATE TRIGGER update_invoices_timestamp
          AFTER UPDATE ON invoices
          FOR EACH ROW
        BEGIN
          UPDATE invoices
          SET updated_at = datetime('now', 'localtime')
          WHERE invoice_id = NEW.invoice_id;
        END;
      `);

      db.exec('DROP TABLE invoices_backup');

      console.log('✅ Rolled back to original precision');
    })();
  }
};
```

**주의사항**:
- 금액을 센트 단위 정수로 저장하면 부동소수점 오류 방지
- 표시 시 `/100`으로 원 단위 변환
- 계산 시 정확한 값 보장

---

### 시나리오 4: 테이블 분리 (⭐⭐⭐⭐⭐)

**목표**: `work_items` 테이블을 `work_items`와 `work_item_materials`로 분리

```typescript
// migrations/006_split_work_items.ts

export const migration_006: Migration = {
  version: 6,
  name: 'split_work_items_materials',

  up: (db) => {
    db.transaction(() => {
      console.log('🔄 Splitting work_items table...');

      // 1. 자재 테이블 생성
      db.exec(`
        CREATE TABLE work_item_materials (
          material_id INTEGER PRIMARY KEY AUTOINCREMENT,
          work_item_id INTEGER NOT NULL,
          name VARCHAR(200) NOT NULL,
          quantity REAL DEFAULT 0,
          unit VARCHAR(20),
          unit_price REAL DEFAULT 0,
          total_price REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
          supplier VARCHAR(100),
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (work_item_id) REFERENCES work_items(item_id) ON DELETE CASCADE
        );

        CREATE INDEX idx_work_item_materials_work_item_id ON work_item_materials(work_item_id);
      `);

      // 2. 기존 work_items 테이블 재구성
      db.exec(`
        CREATE TABLE work_items_new (
          item_id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          workplace_id INTEGER,
          project_name VARCHAR(200),
          name VARCHAR(200) NOT NULL,
          category VARCHAR(50),
          unit VARCHAR(20),
          quantity REAL,
          default_price REAL,
          description TEXT,
          notes TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          date TEXT,
          -- 자재 관련 필드 제거
          labor_persons INTEGER,
          labor_unit_rate REAL,
          labor_persons_general INTEGER,
          labor_unit_rate_general REAL,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(client_id)
        );
      `);

      // 3. 데이터 복사 (작업 항목 기본 정보)
      db.exec(`
        INSERT INTO work_items_new
        SELECT
          item_id, client_id, workplace_id, project_name,
          name, category, unit, quantity, default_price,
          description, notes, status, date,
          labor_persons, labor_unit_rate,
          labor_persons_general, labor_unit_rate_general,
          created_at, updated_at
        FROM work_items;
      `);

      // 4. 기존 테이블 교체
      db.exec('DROP TABLE work_items');
      db.exec('ALTER TABLE work_items_new RENAME TO work_items');

      // 5. 인덱스 재생성
      db.exec(`
        CREATE INDEX idx_work_items_client_id ON work_items(client_id);
        CREATE INDEX idx_work_items_status ON work_items(status);
        CREATE INDEX idx_work_items_date ON work_items(date);

        CREATE TRIGGER update_work_items_timestamp
          AFTER UPDATE ON work_items
          FOR EACH ROW
        BEGIN
          UPDATE work_items
          SET updated_at = datetime('now', 'localtime')
          WHERE item_id = NEW.item_id;
        END;
      `);

      console.log('✅ Work items table split completed');
    })();
  },

  down: (db) => {
    db.transaction(() => {
      console.log('⏪ Merging work_items tables...');

      // 자재 테이블 삭제 (데이터 손실 주의!)
      db.exec('DROP TABLE IF EXISTS work_item_materials');

      // 원래 구조로 복구는 복잡하므로 생략
      // 실제 프로덕션에서는 자재 데이터를 JSON으로 저장하거나 별도 백업 필요

      console.log('✅ Merged work_items tables (materials data lost)');
    })();
  }
};
```

**새 TypeScript 타입**:

```typescript
export interface DatabaseWorkItemMaterial {
  material_id: number;
  work_item_id: number;
  name: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_price: number; // GENERATED 컬럼
  supplier?: string;
  notes?: string;
  created_at: string;
}
```

---

## 베스트 프랙티스

### 1. 항상 트랜잭션 사용

```typescript
// ✅ 좋은 예
db.transaction(() => {
  db.exec('CREATE TABLE ...');
  db.exec('INSERT INTO ...');
  db.exec('DROP TABLE ...');
})();

// ❌ 나쁜 예
db.exec('CREATE TABLE ...');
db.exec('INSERT INTO ...');
db.exec('DROP TABLE ...'); // 중간에 실패하면 불일치 상태
```

### 2. 백업 테이블 생성

```typescript
// 복잡한 마이그레이션 전 백업
db.exec('CREATE TABLE clients_backup AS SELECT * FROM clients');

// 작업 수행...

// 성공 시 백업 삭제
db.exec('DROP TABLE clients_backup');
```

### 3. 데이터 검증

```typescript
up: (db) => {
  db.transaction(() => {
    // 마이그레이션 실행
    db.exec('ALTER TABLE ...');

    // 검증
    const count = db.prepare('SELECT COUNT(*) as count FROM clients').get();
    if (count.count === 0) {
      throw new Error('Data validation failed: no clients found');
    }
  })();
}
```

### 4. 롤백 가능성 고려

```typescript
// 가능한 한 롤백 가능하게 설계
down: (db) => {
  // 정확히 up()의 역작업
  db.transaction(() => {
    // ...
  })();
}
```

### 5. 마이그레이션 파일 명명 규칙

```
migrations/
├── 001_initial_schema.ts
├── 002_add_fax_to_clients.ts
├── 003_create_client_contacts.ts
├── 004_improve_amount_precision.ts
└── 005_split_work_items_materials.ts
```

**규칙**:
- `{version}_{descriptive_name}.ts` 형식
- 버전은 3자리 숫자 (001, 002, ...)
- 이름은 snake_case로 작성
- 동사로 시작 (add, create, update, split, merge)

---

## 문제 해결

### 문제 1: 외래키 제약 조건 위반

**증상**:
```
Error: FOREIGN KEY constraint failed
```

**해결**:
```typescript
// 외래키 일시 비활성화 (개발용)
db.pragma('foreign_keys = OFF');

// 마이그레이션 실행
db.exec('...');

// 외래키 재활성화
db.pragma('foreign_keys = ON');

// 무결성 검사
const result = db.pragma('foreign_key_check');
if (result.length > 0) {
  console.error('Foreign key violations:', result);
}
```

### 문제 2: 마이그레이션 체크섬 불일치

**증상**:
```
Migration checksum mismatch
```

**원인**:
- 이미 적용된 마이그레이션 코드 수정

**해결**:
```bash
# 1. 롤백
npm run migration:rollback

# 2. 마이그레이션 코드 수정

# 3. 재적용
npm run migration:migrate
```

### 문제 3: 테이블 잠금 오류

**증상**:
```
Error: SQLITE_LOCKED: database table is locked
```

**해결**:
```typescript
// WAL 모드 활성화
db.pragma('journal_mode = WAL');

// busy_timeout 설정
db.pragma('busy_timeout = 5000'); // 5초
```

---

## 요약

### 난이도별 체크리스트

#### ⭐ Level 1 (쉬움)
- [ ] 새 NULL 컬럼 추가
- [ ] 인덱스 추가
- [ ] TypeScript 타입 업데이트
- [ ] 서비스 코드 수정

#### ⭐⭐⭐ Level 3 (보통)
- [ ] 마이그레이션 파일 생성
- [ ] up() 메서드 구현
- [ ] down() 메서드 구현
- [ ] 트랜잭션 사용
- [ ] 인덱스 생성
- [ ] 외래키 설정

#### ⭐⭐⭐⭐⭐ Level 5 (매우 어려움)
- [ ] 백업 테이블 생성
- [ ] 데이터 변환 로직 작성
- [ ] 무결성 검증
- [ ] 롤백 시나리오 테스트
- [ ] 대량 데이터 처리 전략
- [ ] 성능 최적화

---

**작성자**: Claude Code
**최종 수정**: 2025년 10월 12일
**버전**: 1.0.0
