# 공사 일정 및 건축주 상담 관리 기능 구현 계획 📅

## 1. 데이터베이스 스키마 설계

### 1.1 schedules 테이블 생성
```sql
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
  client_id INTEGER REFERENCES clients(id),
  client_name VARCHAR(100),
  workplace_id INTEGER REFERENCES workplaces(id),
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

-- 인덱스
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_start_date ON schedules(start_date);
CREATE INDEX idx_schedules_client_id ON schedules(client_id);
CREATE INDEX idx_schedules_type ON schedules(schedule_type);
CREATE INDEX idx_schedules_status ON schedules(status);
```

### 1.2 RLS (Row Level Security) 정책
```sql
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON schedules FOR DELETE
  USING (auth.uid() = user_id);
```

## 2. 프론트엔드 구조 설계

### 2.1 컴포넌트 구조
```
src/components/schedules/
├── Schedules.tsx              # 메인 페이지 (뷰 전환, 데이터 관리)
├── ScheduleCalendar.tsx       # 월간 캘린더 뷰
├── ScheduleList.tsx           # 리스트 뷰 (모바일 친화적)
├── ScheduleWeekView.tsx       # 주간 뷰
├── ScheduleDayView.tsx        # 일간 뷰
├── ScheduleForm.tsx           # 일정 추가/수정 모달
├── ScheduleDetail.tsx         # 일정 상세 보기 모달
└── ScheduleFilters.tsx        # 필터 (타입, 상태, 건축주)
```

### 2.2 타입 정의 (types/domain.ts)
```typescript
export type ScheduleType = 'construction' | 'consultation' | 'meeting' | 'other';
export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type SchedulePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Schedule {
  id: number;
  userId: string;

  title: string;
  description?: string;
  scheduleType: ScheduleType;

  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endDate?: string;
  endTime?: string;
  allDay: boolean;

  clientId?: number;
  clientName?: string;
  workplaceId?: number;
  workplaceName?: string;
  projectName?: string;

  status: ScheduleStatus;
  priority: SchedulePriority;

  reminderEnabled: boolean;
  reminderMinutesBefore?: number;

  location?: string;
  attendees?: Array<{name: string; phone?: string; email?: string}>;
  notes?: string;
  attachments?: Array<{name: string; url: string; type: string}>;

  createdAt: string;
  updatedAt: string;
}
```

## 3. 주요 기능 구현 단계

### 3.1 캘린더 라이브러리 선택
**추천: react-calendar 또는 직접 구현**

**Option A: react-calendar 사용**
```bash
npm install react-calendar
```
- 장점: 빠른 구현, 안정적
- 단점: 커스터마이징 제한적

**Option B: 직접 구현 (추천)**
- 장점: 완전한 커스터마이징, 번들 크기 작음
- 단점: 개발 시간 소요
- 구현: 월별 날짜 그리드, 주간 뷰, 일간 뷰

### 3.2 뷰 전환 시스템
```typescript
type ViewMode = 'month' | 'week' | 'day' | 'list';

const [viewMode, setViewMode] = useState<ViewMode>('month');
const [currentDate, setCurrentDate] = useState<Date>(new Date());
```

**모바일 최적화:**
- 작은 화면: 기본 list 뷰 (스와이프 제스처)
- 중간 화면: month 뷰
- 큰 화면: month/week 뷰

### 3.3 일정 CRUD 로직 (AppContext)
```typescript
// AppContext에 추가할 상태
const [schedules, setSchedules] = useState<Schedule[]>([]);

// Supabase 로딩
const loadSchedules = async (userId: string) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true });

  if (data) {
    setSchedules(data.map(mapSupabaseSchedule));
  }
};

// Supabase 저장
const saveSchedule = async (schedule: Schedule) => {
  const payload = {
    user_id: userId,
    title: schedule.title,
    // ... 모든 필드 매핑
  };

  if (schedule.id) {
    await supabase.from('schedules').update(payload).eq('schedule_id', schedule.id);
  } else {
    const { data } = await supabase.from('schedules').insert(payload).select();
    // 새로 생성된 ID로 상태 업데이트
  }
};
```

### 3.4 필터링 및 검색
```typescript
const [filters, setFilters] = useState({
  scheduleType: [] as ScheduleType[],
  status: [] as ScheduleStatus[],
  clientId: null as number | null,
  dateRange: { start: null, end: null },
  searchText: ''
});

const filteredSchedules = useMemo(() => {
  return schedules.filter(schedule => {
    // 타입 필터
    if (filters.scheduleType.length > 0 && !filters.scheduleType.includes(schedule.scheduleType)) {
      return false;
    }

    // 상태 필터
    if (filters.status.length > 0 && !filters.status.includes(schedule.status)) {
      return false;
    }

    // 건축주 필터
    if (filters.clientId && schedule.clientId !== filters.clientId) {
      return false;
    }

    // 검색어
    if (filters.searchText) {
      const text = filters.searchText.toLowerCase();
      return schedule.title.toLowerCase().includes(text) ||
             schedule.description?.toLowerCase().includes(text);
    }

    return true;
  });
}, [schedules, filters]);
```

## 4. 모바일 최적화 전략

### 4.1 반응형 레이아웃
```typescript
// Tailwind CSS 브레이크포인트 활용
<div className="
  // 모바일: 리스트 뷰, 스와이프 제스처
  block md:hidden

  // 태블릿/데스크톱: 캘린더 뷰
  hidden md:block
">
```

### 4.2 터치 제스처
```typescript
// react-swipeable 또는 직접 구현
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => navigateNext(), // 다음 주/월
  onSwipedRight: () => navigatePrev(), // 이전 주/월
  trackMouse: true
});
```

### 4.3 모바일 UI 패턴
- **Bottom Sheet**: 일정 추가/수정 시 하단에서 올라오는 모달
- **Floating Action Button (FAB)**: 우측 하단 고정 + 버튼
- **Pull-to-Refresh**: 리스트 당겨서 새로고침
- **Infinite Scroll**: 과거/미래 일정 무한 스크롤

### 4.4 성능 최적화
```typescript
// 가상 스크롤링 (react-window)
import { FixedSizeList } from 'react-window';

// 날짜 범위별 데이터 로딩
const loadSchedulesInRange = async (startDate: string, endDate: string) => {
  const { data } = await supabase
    .from('schedules')
    .select('*')
    .gte('start_date', startDate)
    .lte('start_date', endDate);

  return data;
};
```

## 5. 추가 기능 (선택사항)

### 5.1 알림 시스템
**Option A: 브라우저 알림 (Web Notification API)**
```typescript
const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // 알림 예약
  }
};
```

**Option B: Supabase + Edge Functions + 이메일/SMS**
- Supabase Edge Function으로 스케줄러 구현
- pg_cron 또는 cron job으로 정기 체크
- 알림 시간 도달 시 이메일/SMS 발송

### 5.2 반복 일정
```typescript
interface RecurringSchedule extends Schedule {
  isRecurring: boolean;
  recurrenceRule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // 매 n일/주/월/년
    endDate?: string;
    daysOfWeek?: number[]; // 0(일) ~ 6(토)
  };
}
```

### 5.3 구글 캘린더 동기화
```typescript
// Google Calendar API 연동
import { gapi } from 'gapi-script';

const syncWithGoogleCalendar = async (schedule: Schedule) => {
  const event = {
    summary: schedule.title,
    location: schedule.location,
    description: schedule.description,
    start: {
      dateTime: `${schedule.startDate}T${schedule.startTime}:00`,
      timeZone: 'Asia/Seoul',
    },
    end: {
      dateTime: `${schedule.endDate}T${schedule.endTime}:00`,
      timeZone: 'Asia/Seoul',
    },
  };

  await gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
};
```

### 5.4 일정 충돌 감지
```typescript
const checkScheduleConflict = (newSchedule: Schedule, existingSchedules: Schedule[]) => {
  return existingSchedules.filter(existing => {
    // 같은 날짜 범위 체크
    const newStart = new Date(`${newSchedule.startDate}T${newSchedule.startTime || '00:00'}`);
    const newEnd = new Date(`${newSchedule.endDate || newSchedule.startDate}T${newSchedule.endTime || '23:59'}`);
    const existingStart = new Date(`${existing.startDate}T${existing.startTime || '00:00'}`);
    const existingEnd = new Date(`${existing.endDate || existing.startDate}T${existing.endTime || '23:59'}`);

    return (newStart <= existingEnd && newEnd >= existingStart);
  });
};
```

## 6. 네비게이션 통합

### 6.1 사이드바에 추가
```typescript
// src/components/layout/Navigation.tsx
<Link to="/schedules" className="...">
  <CalendarIcon className="w-5 h-5" />
  <span>일정 관리</span>
</Link>
```

### 6.2 라우팅 설정
```typescript
// src/App.tsx
<Route path="/schedules" element={<Schedules />} />
```

## 7. 구현 우선순위

### Phase 1: MVP (최소 기능 제품)
1. ✅ DB 스키마 및 마이그레이션
2. ✅ 기본 CRUD (추가, 조회, 수정, 삭제)
3. ✅ 리스트 뷰 (모바일 친화적)
4. ✅ 월간 캘린더 뷰
5. ✅ 건축주 연동 (드롭다운)

### Phase 2: 사용성 개선
1. ✅ 주간/일간 뷰
2. ✅ 필터 및 검색
3. ✅ 상태 관리 (예정, 진행중, 완료, 취소)
4. ✅ 우선순위 표시
5. ✅ 다크모드 지원

### Phase 3: 고급 기능
1. ✅ 알림 시스템
2. ✅ 반복 일정
3. ✅ 일정 충돌 감지
4. ✅ 첨부파일 업로드
5. ✅ 구글 캘린더 동기화

## 8. 예상 작업 시간

- **Phase 1 (MVP)**: 8-12시간
  - DB 스키마: 1시간
  - CRUD 로직: 3시간
  - 리스트 뷰: 2시간
  - 캘린더 뷰: 4-6시간
  - 통합 테스트: 1-2시간

- **Phase 2 (개선)**: 6-8시간
- **Phase 3 (고급)**: 10-15시간

**총 예상 시간: 24-35시간**

## 9. 주의사항

1. **타임존 처리**: 한국 시간(Asia/Seoul) 기준으로 통일
2. **날짜 라이브러리**: date-fns 또는 dayjs 사용 권장 (moment.js 피하기)
3. **캐싱 전략**: 현재 월/주 데이터만 메모리에 유지
4. **오프라인 지원**: localStorage 임시 저장 후 동기화 (선택)
5. **권한 관리**: 각 사용자는 자신의 일정만 접근 (RLS로 보장)

---

이 계획을 따라 구현하면 실용적이고 모바일 친화적인 일정 관리 시스템을 구축할 수 있습니다! 🎯
