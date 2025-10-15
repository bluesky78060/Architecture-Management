-- ============================================
-- 기존 데이터 정리 및 재시작
-- 잘못된 ID 매핑 문제 해결
-- ============================================

-- 1. 기존 데이터 모두 삭제 (외래 키 CASCADE로 관련 데이터도 삭제됨)
DELETE FROM clients WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM work_items WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM estimates WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM invoices WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 2. Auto-increment 시퀀스 리셋 (ID를 1부터 다시 시작)
ALTER SEQUENCE clients_client_id_seq RESTART WITH 1;
ALTER SEQUENCE work_items_work_item_id_seq RESTART WITH 1;
ALTER SEQUENCE estimates_estimate_id_seq RESTART WITH 1;
ALTER SEQUENCE invoices_invoice_id_seq RESTART WITH 1;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 기존 데이터 정리 완료';
  RAISE NOTICE '✅ ID 시퀀스 리셋 완료';
  RAISE NOTICE '🎯 이제 웹사이트에서 새로운 건축주를 생성해주세요';
END $$;
