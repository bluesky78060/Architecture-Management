-- ============================================
-- clients 테이블에 누락된 필드 추가
-- ============================================

-- 1. mobile 컬럼 추가 (휴대전화)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

-- 2. workplaces 컬럼 추가 (JSON 배열로 저장)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS workplaces JSONB DEFAULT '[]'::jsonb;

-- 3. projects 컬럼 추가 (JSON 배열로 저장)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clients_mobile ON clients(mobile);
CREATE INDEX IF NOT EXISTS idx_clients_workplaces ON clients USING gin(workplaces);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ clients 테이블 필드 추가 완료';
  RAISE NOTICE '📱 mobile (휴대전화) 컬럼 추가';
  RAISE NOTICE '🏗️ workplaces (작업장) JSONB 컬럼 추가';
  RAISE NOTICE '📋 projects (프로젝트) JSONB 컬럼 추가';
END $$;
