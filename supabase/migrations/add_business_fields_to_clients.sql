-- ============================================
-- Clients 테이블에 사업자 정보 컬럼 추가
-- 생성일: 2025-10-16
-- ============================================

-- 사업자 정보 컬럼 추가
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_item VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_email VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_address TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN clients.business_type IS '업태';
COMMENT ON COLUMN clients.business_item IS '업종';
COMMENT ON COLUMN clients.tax_email IS '계산서/세금계산서 발행 이메일';
COMMENT ON COLUMN clients.business_address IS '사업장 주소';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Clients 테이블에 사업자 정보 컬럼 추가 완료';
  RAISE NOTICE '   - business_type (업태)';
  RAISE NOTICE '   - business_item (업종)';
  RAISE NOTICE '   - tax_email (발행 이메일)';
  RAISE NOTICE '   - business_address (사업장 주소)';
END $$;
