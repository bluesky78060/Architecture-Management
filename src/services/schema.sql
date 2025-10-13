-- ============================================
-- 건축 관리 시스템 데이터베이스 스키마
-- SQLite 3.x
-- ============================================

-- 1. 건축주(고객) 테이블
CREATE TABLE IF NOT EXISTS clients (
    client_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(200) NOT NULL,
    representative VARCHAR(100),
    business_number VARCHAR(20) UNIQUE,
    address TEXT,
    email VARCHAR(100),
    phone VARCHAR(20),
    contact_person VARCHAR(100),
    type VARCHAR(20) DEFAULT 'PERSON',
    notes TEXT,
    total_billed REAL DEFAULT 0,
    outstanding REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_business_number ON clients(business_number);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- 2. 작업장(현장) 테이블
CREATE TABLE IF NOT EXISTS workplaces (
    workplace_id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workplaces_client_id ON workplaces(client_id);

-- 3. 견적서 테이블
CREATE TABLE IF NOT EXISTS estimates (
    estimate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    workplace_id INTEGER,
    project_name VARCHAR(200),
    title VARCHAR(200) NOT NULL,
    date TEXT,
    valid_until TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (workplace_id) REFERENCES workplaces(workplace_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_estimates_number ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_date ON estimates(date);

-- 4. 견적서 항목 테이블
CREATE TABLE IF NOT EXISTS estimate_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    estimate_id INTEGER NOT NULL,
    category VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity REAL DEFAULT 0,
    unit VARCHAR(20),
    unit_price REAL DEFAULT 0,
    total REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (estimate_id) REFERENCES estimates(estimate_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON estimate_items(estimate_id);

-- 5. 청구서 테이블
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    project_name VARCHAR(200),
    workplace_address TEXT,
    amount REAL NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    date TEXT NOT NULL,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- 6. 청구서 항목 테이블
CREATE TABLE IF NOT EXISTS invoice_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    quantity REAL NOT NULL,
    unit VARCHAR(20),
    unit_price REAL NOT NULL,
    total REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    date TEXT,
    labor_persons INTEGER,
    labor_unit_rate REAL,
    labor_persons_general INTEGER,
    labor_unit_rate_general REAL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 7. 작업 항목 테이블
CREATE TABLE IF NOT EXISTS work_items (
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
    labor_persons INTEGER,
    labor_unit_rate REAL,
    labor_persons_general INTEGER,
    labor_unit_rate_general REAL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (workplace_id) REFERENCES workplaces(workplace_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_work_items_client_id ON work_items(client_id);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_items_date ON work_items(date);

-- 8. 회사 정보 테이블 (싱글톤)
CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name VARCHAR(200) NOT NULL,
    representative VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    business_number VARCHAR(20),
    stamp_url TEXT,
    bank_account VARCHAR(100),
    account_holder VARCHAR(100),
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 9. 사용자 테이블 (인증)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    last_login TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 10. 마이그레이션 상태 테이블
CREATE TABLE IF NOT EXISTS migration_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    completed INTEGER DEFAULT 0,
    last_migration_date TEXT,
    json_backup_path TEXT,
    version VARCHAR(20)
);

-- ============================================
-- 트리거: 자동 updated_at 갱신
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_clients_timestamp
    AFTER UPDATE ON clients
    FOR EACH ROW
BEGIN
    UPDATE clients SET updated_at = datetime('now', 'localtime') WHERE client_id = NEW.client_id;
END;

CREATE TRIGGER IF NOT EXISTS update_estimates_timestamp
    AFTER UPDATE ON estimates
    FOR EACH ROW
BEGIN
    UPDATE estimates SET updated_at = datetime('now', 'localtime') WHERE estimate_id = NEW.estimate_id;
END;

CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp
    AFTER UPDATE ON invoices
    FOR EACH ROW
BEGIN
    UPDATE invoices SET updated_at = datetime('now', 'localtime') WHERE invoice_id = NEW.invoice_id;
END;

CREATE TRIGGER IF NOT EXISTS update_work_items_timestamp
    AFTER UPDATE ON work_items
    FOR EACH ROW
BEGIN
    UPDATE work_items SET updated_at = datetime('now', 'localtime') WHERE item_id = NEW.item_id;
END;

CREATE TRIGGER IF NOT EXISTS update_workplaces_timestamp
    AFTER UPDATE ON workplaces
    FOR EACH ROW
BEGIN
    UPDATE workplaces SET updated_at = datetime('now', 'localtime') WHERE workplace_id = NEW.workplace_id;
END;

CREATE TRIGGER IF NOT EXISTS update_company_info_timestamp
    AFTER UPDATE ON company_info
    FOR EACH ROW
BEGIN
    UPDATE company_info SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
END;

-- ============================================
-- 뷰: 자주 사용하는 조인 쿼리
-- ============================================

-- 견적서 상세 뷰 (클라이언트 정보 포함)
CREATE VIEW IF NOT EXISTS v_estimates_detail AS
SELECT
    e.*,
    c.company_name as client_name,
    c.phone as client_phone,
    c.email as client_email,
    w.name as workplace_name,
    w.address as workplace_address
FROM estimates e
LEFT JOIN clients c ON e.client_id = c.client_id
LEFT JOIN workplaces w ON e.workplace_id = w.workplace_id;

-- 청구서 상세 뷰 (클라이언트 정보 포함)
CREATE VIEW IF NOT EXISTS v_invoices_detail AS
SELECT
    i.*,
    c.company_name as client_name,
    c.phone as client_phone,
    c.email as client_email
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.client_id;

-- 작업 항목 상세 뷰 (클라이언트 정보 포함)
CREATE VIEW IF NOT EXISTS v_work_items_detail AS
SELECT
    w.*,
    c.company_name as client_name,
    wp.name as workplace_name,
    wp.address as workplace_address
FROM work_items w
LEFT JOIN clients c ON w.client_id = c.client_id
LEFT JOIN workplaces wp ON w.workplace_id = wp.workplace_id;

-- ============================================
-- 초기 데이터
-- ============================================

-- 회사 정보 기본 레코드
INSERT OR IGNORE INTO company_info (id, name) VALUES (1, '건축 관리 시스템');

-- 마이그레이션 상태 기본 레코드
INSERT OR IGNORE INTO migration_status (id, completed, version) VALUES (1, 0, '1.0.0');
