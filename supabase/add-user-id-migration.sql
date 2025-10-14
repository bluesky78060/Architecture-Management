-- ============================================
-- 사용자별 데이터 격리를 위한 user_id 추가 마이그레이션
-- ============================================

-- 1. 모든 테이블에 user_id 컬럼 추가
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE company_info ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. user_id 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_user_id ON estimate_items(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_user_id ON invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_work_items_user_id ON work_items(user_id);
CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON company_info(user_id);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (사용자는 자신의 데이터만 접근 가능)

-- clients 정책
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- estimates 정책
CREATE POLICY "Users can view their own estimates"
  ON estimates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own estimates"
  ON estimates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estimates"
  ON estimates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estimates"
  ON estimates FOR DELETE
  USING (auth.uid() = user_id);

-- estimate_items 정책
CREATE POLICY "Users can view their own estimate_items"
  ON estimate_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own estimate_items"
  ON estimate_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estimate_items"
  ON estimate_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estimate_items"
  ON estimate_items FOR DELETE
  USING (auth.uid() = user_id);

-- invoices 정책
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- invoice_items 정책
CREATE POLICY "Users can view their own invoice_items"
  ON invoice_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice_items"
  ON invoice_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice_items"
  ON invoice_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice_items"
  ON invoice_items FOR DELETE
  USING (auth.uid() = user_id);

-- work_items 정책
CREATE POLICY "Users can view their own work_items"
  ON work_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work_items"
  ON work_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work_items"
  ON work_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work_items"
  ON work_items FOR DELETE
  USING (auth.uid() = user_id);

-- company_info 정책
CREATE POLICY "Users can view their own company_info"
  ON company_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company_info"
  ON company_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company_info"
  ON company_info FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company_info"
  ON company_info FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '👤 User ID columns added to all tables';
  RAISE NOTICE '🔒 Row Level Security enabled';
  RAISE NOTICE '🛡️ RLS policies created for user data isolation';
END $$;
