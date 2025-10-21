-- Google Calendar 동기화를 위한 반복 일정 컬럼 추가
-- (schedules 테이블이 이미 존재하는 경우 실행)

-- 반복 일정 관련 컬럼 추가
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

-- 기존에 누락되었을 수 있는 컬럼들 추가
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS attendees JSONB,
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_schedules_recurring ON schedules(is_recurring);
CREATE INDEX IF NOT EXISTS idx_schedules_recurrence_rule ON schedules USING GIN(recurrence_rule);

COMMENT ON COLUMN schedules.is_recurring IS '반복 일정 여부';
COMMENT ON COLUMN schedules.recurrence_rule IS '반복 규칙 (JSONB): {frequency, interval, endDate, daysOfWeek}';
COMMENT ON COLUMN schedules.attendees IS '참석자 목록 (JSONB): [{name, phone, email}]';
COMMENT ON COLUMN schedules.attachments IS '첨부파일 목록 (JSONB): [{name, url, type}]';
