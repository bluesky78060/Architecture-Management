-- ============================================
-- estimates 및 estimate_items 테이블 누락 컬럼 추가
-- ============================================

-- ============================================
-- 1. estimates 테이블 수정
-- ============================================

-- 1-1. user_id 컬럼 추가 (사용자 격리용)
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1-2. client_name 컬럼 추가 (denormalization for performance)
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

-- 1-3. workplace_name 컬럼 추가 (denormalization for performance)
ALTER TABLE estimates
ADD COLUMN IF NOT EXISTS workplace_name VARCHAR(255);

-- 1-4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON estimates(user_id);

-- ============================================
-- 2. estimate_items 테이블 수정
-- ============================================

-- 2-1. notes 컬럼 추가
ALTER TABLE estimate_items
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2-2. total 컬럼 추가 (amount는 GENERATED이므로 total도 추가)
ALTER TABLE estimate_items
ADD COLUMN IF NOT EXISTS total DECIMAL(15, 2);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ estimates 및 estimate_items 테이블 컬럼 추가 완료';
  RAISE NOTICE '📊 estimates: user_id, client_name, workplace_name';
  RAISE NOTICE '📊 estimate_items: notes, total';
END $$;
