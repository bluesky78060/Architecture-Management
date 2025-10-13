-- ============================================
-- 개발 환경용 RLS 정책
-- 모든 사용자에게 전체 접근 권한 부여
-- ============================================

-- RLS 활성화
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- 개발 환경: 모든 사용자 읽기/쓰기 가능
CREATE POLICY "Enable all access for all users" ON clients FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON estimates FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON estimate_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON invoices FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON work_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON company_info FOR ALL USING (true);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ RLS 정책 활성화 완료 (개발 환경)';
  RAISE NOTICE '⚠️ 프로덕션 환경에서는 인증 기반 정책으로 변경 필요';
END $$;
