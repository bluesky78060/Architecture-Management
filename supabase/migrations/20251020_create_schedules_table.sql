-- 일정 관리 테이블 생성
CREATE TABLE schedules (
  schedule_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(20) NOT NULL, -- 'construction', 'consultation', 'meeting', 'other'

  -- 날짜/시간
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,

  -- 연관 정보
  client_id INTEGER REFERENCES clients(client_id),
  client_name VARCHAR(100),
  workplace_id INTEGER,
  workplace_name VARCHAR(100),
  project_name VARCHAR(100),

  -- 상태
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- 알림 설정
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_minutes_before INTEGER, -- 15, 30, 60, 1440 (1일 전)

  -- 메타데이터
  location TEXT,
  attendees JSONB, -- [{name, phone, email}]
  notes TEXT,
  attachments JSONB, -- [{name, url, type}]

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_start_date ON schedules(start_date);
CREATE INDEX idx_schedules_client_id ON schedules(client_id);
CREATE INDEX idx_schedules_type ON schedules(schedule_type);
CREATE INDEX idx_schedules_status ON schedules(status);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일정만 조회 가능
CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 일정만 생성 가능
CREATE POLICY "Users can create their own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 일정만 수정 가능
CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 일정만 삭제 가능
CREATE POLICY "Users can delete their own schedules"
  ON schedules FOR DELETE
  USING (auth.uid() = user_id);
