-- 개발 환경: user_id를 NULL 허용으로 변경
-- 프로덕션에서는 NOT NULL을 유지해야 합니다!

-- user_id를 NULL 허용으로 변경
ALTER TABLE schedules
ALTER COLUMN user_id DROP NOT NULL;

-- 기존 외래 키 제약 조건 확인 (필요시)
-- SELECT conname FROM pg_constraint WHERE conrelid = 'schedules'::regclass;

-- 참고: 프로덕션에서는 user_id NOT NULL을 유지하고
-- 반드시 로그인된 사용자만 일정을 생성할 수 있도록 해야 합니다.
