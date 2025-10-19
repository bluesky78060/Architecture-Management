# 구글 캘린더 일정관리 통합 가이드

## 📋 개요

건축 관리 시스템에 구글 캘린더를 통합하면:
- 작업 일정 자동 등록
- 견적서/청구서 마감일 추적
- 건축주 미팅 일정 관리
- 작업자 스케줄 조율

---

## 🎯 통합 방식 선택

### 방식 1: Google Calendar API (추천) ⭐⭐⭐⭐⭐
**장점**:
- 완전한 제어 가능
- 사용자별 개인 캘린더 연동
- 양방향 동기화 (읽기/쓰기)

**단점**:
- OAuth 2.0 인증 구현 필요
- 복잡도 중상

### 방식 2: iCal 파일 다운로드 ⭐⭐⭐
**장점**:
- 구현 간단
- 구글 캘린더 계정 불필요

**단점**:
- 단방향 (내보내기만 가능)
- 실시간 동기화 불가

---

## 🔧 구현 단계 (Google Calendar API 기준)

### Phase 1: Google Cloud 설정 (30분)

**1.1 프로젝트 생성**
```
1. Google Cloud Console 접속
2. 새 프로젝트 생성: "Architecture Management Calendar"
3. Google Calendar API 활성화
4. OAuth 2.0 클라이언트 ID 생성
   - 웹 애플리케이션
   - 승인된 리디렉션 URI: https://architecture-management.vercel.app/auth/google/callback
5. 클라이언트 ID, 클라이언트 시크릿 복사
```

**1.2 환경 변수 설정**
```env
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret
REACT_APP_GOOGLE_REDIRECT_URI=https://architecture-management.vercel.app/auth/google/callback
```

---

### Phase 2: OAuth 인증 구현 (1시간)

**2.1 필요한 패키지**
```bash
npm install @react-oauth/google gapi-script
# 또는
npm install @google-cloud/calendar
```

**2.2 구현 파일**
```
src/
├── contexts/
│   └── CalendarContext.tsx          # 캘린더 상태 관리
├── services/
│   ├── googleAuth.ts                # OAuth 인증
│   └── googleCalendar.ts            # API 호출
└── components/
    ├── CalendarAuth.tsx             # 구글 로그인 버튼
    └── CalendarEventModal.tsx       # 일정 추가 모달
```

**2.3 OAuth 흐름**
```
1. 사용자가 "구글 캘린더 연동" 버튼 클릭
2. 구글 로그인 팝업
3. 사용자 권한 승인 (캘린더 읽기/쓰기)
4. Access Token 받기
5. Supabase에 토큰 저장 (암호화)
6. 자동 갱신 (Refresh Token)
```

---

### Phase 3: 데이터베이스 확장 (30분)

**3.1 새 테이블 생성**
```sql
-- 구글 캘린더 연동 정보
CREATE TABLE google_calendar_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 일정 매핑 (시스템 데이터 ↔ 구글 캘린더)
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'estimate', 'invoice', 'work_item'
  event_id INTEGER NOT NULL, -- estimates.id, invoices.id, work_items.id
  google_event_id VARCHAR(255) NOT NULL, -- 구글 캘린더 이벤트 ID
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_type, event_id)
);
```

**3.2 RLS 정책**
```sql
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
ON google_calendar_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

### Phase 4: 일정 생성 로직 (2시간)

**4.1 견적서 → 캘린더 이벤트**
```typescript
// 견적서 생성/수정 시 자동으로 일정 추가
interface CalendarEvent {
  summary: string;        // "견적서: [건축주명] - [프로젝트명]"
  description: string;    // 견적서 상세 정보
  start: Date;           // 견적 시작일
  end: Date;             // 예상 완료일
  location?: string;     // 작업장 주소
  attendees?: string[];  // 건축주 이메일
}

// Estimates.tsx에서 호출
await createCalendarEvent({
  summary: `견적서: ${client.name} - ${project.name}`,
  description: `견적 금액: ${totalAmount}원\n작업 내용: ...`,
  start: new Date(estimateDate),
  end: new Date(expectedCompletionDate),
  location: workplace.address,
  attendees: [client.email]
});
```

**4.2 청구서 → 캘린더 이벤트**
```typescript
// 청구서 마감일을 캘린더에 추가
await createCalendarEvent({
  summary: `청구서 마감: ${client.name}`,
  description: `청구 금액: ${amount}원\n지급 기한 알림`,
  start: new Date(dueDate),
  end: new Date(dueDate),
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 },  // 1일 전
      { method: 'popup', minutes: 60 }        // 1시간 전
    ]
  }
});
```

**4.3 작업 일정 → 캘린더 이벤트**
```typescript
// 작업 항목을 캘린더에 추가
await createCalendarEvent({
  summary: `작업: ${workItem.name}`,
  description: `현장: ${workplace.name}\n작업자: ${worker.name}`,
  start: new Date(scheduledDate),
  end: new Date(scheduledDate).setHours(+8), // 8시간 작업
  location: workplace.address,
  colorId: '9' // 파란색 (작업 일정)
});
```

---

### Phase 5: UI 구현 (2시간)

**5.1 Settings 페이지에 연동 섹션 추가**
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold mb-4">
    📅 구글 캘린더 연동
  </h2>

  {isConnected ? (
    <div>
      <p className="text-green-600">✅ 연동됨</p>
      <button onClick={disconnect}>연동 해제</button>
    </div>
  ) : (
    <button onClick={connectGoogleCalendar}>
      구글 캘린더 연동하기
    </button>
  )}
</div>
```

**5.2 각 페이지에 "캘린더에 추가" 버튼**
```tsx
// Estimates.tsx, Invoices.tsx, WorkItems.tsx
<button
  onClick={() => addToCalendar(item)}
  className="..."
>
  📅 캘린더에 추가
</button>
```

**5.3 캘린더 뷰 추가 (선택사항)**
```tsx
// 새 페이지: Calendar.tsx
import FullCalendar from '@fullcalendar/react';
import googleCalendarPlugin from '@fullcalendar/google-calendar';

<FullCalendar
  plugins={[googleCalendarPlugin]}
  googleCalendarApiKey="YOUR_API_KEY"
  events={{
    googleCalendarId: 'user@gmail.com'
  }}
/>
```

---

### Phase 6: 동기화 로직 (2시간)

**6.1 자동 동기화**
```typescript
// 견적서/청구서 생성 시 자동으로 캘린더 이벤트 생성
useEffect(() => {
  if (isCalendarConnected && estimateCreated) {
    syncToCalendar(estimate);
  }
}, [estimateCreated]);
```

**6.2 양방향 동기화 (고급)**
```typescript
// 구글 캘린더에서 일정 수정 시 시스템에 반영
const syncFromCalendar = async () => {
  const events = await fetchGoogleCalendarEvents();

  for (const event of events) {
    const mapping = await findEventMapping(event.id);
    if (mapping) {
      // 시스템 데이터 업데이트
      await updateEstimate(mapping.event_id, {
        scheduledDate: event.start
      });
    }
  }
};
```

**6.3 충돌 해결**
```typescript
// 시스템과 캘린더 데이터가 다를 때
if (systemDate !== calendarDate) {
  // 옵션 1: 최신 수정 우선
  // 옵션 2: 사용자에게 선택 요청
  // 옵션 3: 시스템 데이터 우선
}
```

---

## 🔐 보안 고려사항

### 토큰 보안
```typescript
// ❌ 나쁜 예
localStorage.setItem('google_token', accessToken);

// ✅ 좋은 예
// Supabase에 암호화하여 저장
await supabase.from('google_calendar_tokens').insert({
  user_id: userId,
  access_token: encrypt(accessToken),
  refresh_token: encrypt(refreshToken)
});
```

### API 권한 최소화
```typescript
// 필요한 권한만 요청
const scopes = [
  'https://www.googleapis.com/auth/calendar.events', // 이벤트만
  // 'https://www.googleapis.com/auth/calendar' 전체 권한은 피하기
];
```

---

## 📊 예상 작업량

| 단계 | 예상 시간 | 난이도 |
|------|----------|--------|
| Google Cloud 설정 | 30분 | ⭐⭐ |
| OAuth 인증 구현 | 1시간 | ⭐⭐⭐⭐ |
| DB 확장 | 30분 | ⭐⭐ |
| 일정 생성 로직 | 2시간 | ⭐⭐⭐ |
| UI 구현 | 2시간 | ⭐⭐⭐ |
| 동기화 로직 | 2시간 | ⭐⭐⭐⭐ |
| 테스트 | 1시간 | ⭐⭐⭐ |
| **총합** | **9시간** | **⭐⭐⭐⭐** |

---

## 🎨 기능별 우선순위

### Phase 1 (필수) - MVP
- ✅ 구글 캘린더 연동 (OAuth)
- ✅ 견적서 일정 추가
- ✅ 청구서 마감일 추가

### Phase 2 (권장)
- ✅ 작업 일정 추가
- ✅ 자동 동기화
- ✅ 알림 설정

### Phase 3 (선택)
- ✅ 양방향 동기화
- ✅ 캘린더 뷰 (FullCalendar)
- ✅ 팀 캘린더 공유

---

## 🚨 주의사항

1. **API 할당량**
   - 무료: 1,000,000 요청/일
   - 충분하지만 남용 금지

2. **토큰 만료**
   - Access Token: 1시간
   - Refresh Token으로 자동 갱신 구현 필수

3. **사용자 교육**
   - 캘린더 권한 설명
   - 개인정보 처리 방침 업데이트

4. **에러 처리**
   - 네트워크 오류
   - 토큰 만료
   - API 한도 초과

---

## 💡 대안 솔루션

### 간단한 방법: iCal 내보내기
```typescript
// .ics 파일 생성
const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${eventName}
DTSTART:${startDate}
DTEND:${endDate}
END:VEVENT
END:VCALENDAR
`;

// 다운로드
const blob = new Blob([icsContent], { type: 'text/calendar' });
downloadFile(blob, 'event.ics');
```

**장점**: 구현 10분, OAuth 불필요
**단점**: 수동 가져오기, 동기화 없음

---

## 📚 참고 자료

- [Google Calendar API 공식 문서](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [FullCalendar](https://fullcalendar.io/)

---

**작성일**: 2025.10.17
**프로젝트**: Architecture Management System v2.0
**예상 구현 기간**: 2일 (9시간)
