-- ============================================
-- 건축 관리 시스템 PostgreSQL 스키마
-- Supabase용
-- ============================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 건축주(Clients) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  client_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  representative VARCHAR(100),
  business_number VARCHAR(50),
  address TEXT,
  email VARCHAR(100),
  phone VARCHAR(20),
  contact_person VARCHAR(100),
  type VARCHAR(20) DEFAULT 'BUSINESS' CHECK (type IN ('PERSON', 'BUSINESS')),
  notes TEXT,
  total_billed DECIMAL(15, 2) DEFAULT 0,
  outstanding DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);

-- ============================================
-- 2. 견적서(Estimates) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS estimates (
  estimate_id SERIAL PRIMARY KEY,
  estimate_number VARCHAR(50) NOT NULL UNIQUE,
  client_id INTEGER NOT NULL,
  workplace_id INTEGER,
  project_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  date DATE,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  total_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_estimates_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_estimates_client_id ON estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_estimates_number ON estimates(estimate_number);
CREATE INDEX IF NOT EXISTS idx_estimates_client_date ON estimates(client_id, date);
CREATE INDEX IF NOT EXISTS idx_estimates_client_status ON estimates(client_id, status);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);

-- ============================================
-- 3. 견적서 항목(Estimate Items) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS estimate_items (
  item_id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL,
  category VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(15, 2),
  amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  CONSTRAINT fk_estimate_items_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(estimate_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON estimate_items(estimate_id);

-- ============================================
-- 4. 청구서(Invoices) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  client_id INTEGER NOT NULL,
  workplace_id INTEGER,
  title VARCHAR(255) NOT NULL,
  date DATE,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================
-- 5. 청구서 항목(Invoice Items) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_items (
  item_id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL,
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
  sort_order INTEGER DEFAULT 0,
  CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================
-- 6. 작업 항목(Work Items) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS work_items (
  work_item_id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  workplace_id INTEGER,
  invoice_id INTEGER,
  category VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assigned_to VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_work_items_client FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_work_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_work_items_client_id ON work_items(client_id);
CREATE INDEX IF NOT EXISTS idx_work_items_client_status ON work_items(client_id, status);
CREATE INDEX IF NOT EXISTS idx_work_items_status_date ON work_items(status, start_date);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);

-- ============================================
-- 7. 회사 정보(Company Info) 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS company_info (
  id INTEGER PRIMARY KEY DEFAULT 1,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_company_info_id CHECK (id = 1)
);

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
-- 기존 트리거가 있으면 먼저 삭제
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates;
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_items_updated_at ON work_items;
CREATE TRIGGER update_work_items_updated_at BEFORE UPDATE ON work_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_info_updated_at ON company_info;
CREATE TRIGGER update_company_info_updated_at BEFORE UPDATE ON company_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- RLS 활성화 (프로덕션에서는 필수)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- 개발 환경: 모든 사용자 읽기/쓰기 가능 (테스트용)
-- CREATE POLICY "Enable all access for all users" ON clients FOR ALL USING (true);
-- CREATE POLICY "Enable all access for all users" ON estimates FOR ALL USING (true);
-- CREATE POLICY "Enable all access for all users" ON invoices FOR ALL USING (true);
-- CREATE POLICY "Enable all access for all users" ON work_items FOR ALL USING (true);
-- CREATE POLICY "Enable all access for all users" ON company_info FOR ALL USING (true);

-- 프로덕션 환경: 인증된 사용자만 접근 가능
-- CREATE POLICY "Enable read for authenticated users" ON clients FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable insert for authenticated users" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable delete for authenticated users" ON clients FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 초기 데이터 (회사 정보)
-- ============================================

INSERT INTO company_info (id, company_name, representative)
VALUES (1, '건축 관리 시스템', '대표자명')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 스키마 생성 완료';
  RAISE NOTICE '📊 테이블: 7개';
  RAISE NOTICE '🔑 인덱스: 19개';
  RAISE NOTICE '🔗 외래 키: 5개';
  RAISE NOTICE '⚡ 트리거: 5개';
END $$;
