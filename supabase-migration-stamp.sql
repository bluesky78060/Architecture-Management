-- Add missing columns to company_info table
-- Run this SQL in Supabase Dashboard -> SQL Editor

-- 1. 도장 이미지 (Base64)
ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS stamp_image TEXT;

-- 2. 은행 계좌 정보
ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- 3. 예금주
ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- 4. 단위 목록 (JSON 배열)
ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS units JSONB DEFAULT '["식", "㎡", "개", "톤", "m", "kg", "회", "일"]'::jsonb;

-- 5. 카테고리 목록 (JSON 배열)
ALTER TABLE company_info
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '["토목공사", "구조공사", "철거공사", "마감공사", "설비공사", "내부공사", "기타"]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN company_info.stamp_image IS 'Company stamp image stored as Base64 data URL';
COMMENT ON COLUMN company_info.bank_account IS 'Bank account information';
COMMENT ON COLUMN company_info.account_holder IS 'Account holder name';
COMMENT ON COLUMN company_info.units IS 'Custom units list stored as JSON array';
COMMENT ON COLUMN company_info.categories IS 'Custom categories list stored as JSON array';
