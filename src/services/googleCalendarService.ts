/* eslint-disable */
import type { Schedule } from '../types/domain';

// Google API 클라이언트 설정
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// 환경 변수 로드 확인
console.log('🔑 Google Calendar 환경 변수 확인:');
console.log('  CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ 설정됨' : '❌ 없음');
console.log('  API_KEY:', GOOGLE_API_KEY ? '✅ 설정됨' : '❌ 없음');

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiInitialized = false;
let tokenClient: any = null;

/**
 * Google API 클라이언트 초기화
 */
export async function initGoogleApi(): Promise<boolean> {
  if (gapiInitialized) return true;

  return new Promise((resolve) => {
    // gapi 스크립트 로드
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapiInitialized = true;

          // Google Identity Services 초기화
          const gisScript = document.createElement('script');
          gisScript.src = 'https://accounts.google.com/gsi/client';
          gisScript.async = true;
          gisScript.defer = true;
          gisScript.onload = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: SCOPES,
              callback: '', // 나중에 설정
            });
            resolve(true);
          };
          document.head.appendChild(gisScript);
        } catch (error) {
          console.error('Google API 초기화 실패:', error);
          resolve(false);
        }
      });
    };
    document.head.appendChild(gapiScript);
  });
}

/**
 * Google 계정 인증
 */
export async function authenticateGoogleCalendar(): Promise<boolean> {
  console.log('🔐 Google Calendar 인증 시작...');

  // 환경 변수 확인
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    const missing = [];
    if (!GOOGLE_CLIENT_ID) missing.push('REACT_APP_GOOGLE_CLIENT_ID');
    if (!GOOGLE_API_KEY) missing.push('REACT_APP_GOOGLE_API_KEY');
    console.error('❌ 환경 변수 누락:', missing.join(', '));
    alert(`환경 변수가 설정되지 않았습니다:\n${missing.join('\n')}\n\n.env 파일을 확인해주세요.`);
    return false;
  }

  if (!gapiInitialized) {
    console.log('⏳ Google API 초기화 중...');
    const initialized = await initGoogleApi();
    if (!initialized) {
      console.error('❌ Google API 초기화 실패');
      alert('Google API 초기화에 실패했습니다.\n네트워크 연결을 확인해주세요.');
      return false;
    }
    console.log('✅ Google API 초기화 완료');
  }

  if (!tokenClient) {
    console.error('❌ tokenClient가 초기화되지 않았습니다');
    alert('Google OAuth 클라이언트 초기화에 실패했습니다.\nClient ID를 확인해주세요.');
    return false;
  }

  return new Promise((resolve) => {
    tokenClient.callback = (response: any) => {
      if (response.error !== undefined) {
        console.error('❌ 인증 실패:', response);
        alert(`Google 계정 연결 실패:\n${response.error}\n\n${response.error_description || '알 수 없는 오류'}`);
        resolve(false);
        return;
      }
      console.log('✅ 인증 성공');
      resolve(true);
    };

    // 이미 인증된 경우
    if (window.gapi.client.getToken() !== null) {
      console.log('✅ 이미 인증됨');
      resolve(true);
      return;
    }

    // 새로운 인증 요청
    console.log('🔓 OAuth 팝업 열기...');
    try {
      // prompt: 'consent' 제거 - 처음 한 번만 인증, 이후 자동 갱신
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (error: any) {
      console.error('❌ OAuth 요청 실패:', error);
      alert(`OAuth 요청 실패:\n${error.message || '알 수 없는 오류'}\n\n팝업이 차단되었는지 확인해주세요.`);
      resolve(false);
    }
  });
}

/**
 * 인증 토큰 제거 (로그아웃)
 */
export function signOutGoogleCalendar(): void {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Google Calendar 연결 해제 완료');
    });
    window.gapi.client.setToken(null);
  }
}

/**
 * 인증 상태 확인
 */
export function isGoogleCalendarAuthenticated(): boolean {
  return gapiInitialized && window.gapi.client.getToken() !== null;
}

/**
 * Schedule을 Google Calendar 이벤트로 변환
 */
function scheduleToGoogleEvent(schedule: Schedule): any {
  const event: any = {
    summary: schedule.title,
    description: schedule.description || '',
    location: schedule.location || '',
  };

  // 날짜/시간 설정
  if (schedule.allDay) {
    event.start = { date: schedule.startDate };
    event.end = { date: schedule.endDate || schedule.startDate };
  } else {
    const startDateTime = `${schedule.startDate}T${schedule.startTime || '00:00:00'}`;
    const endDateTime = schedule.endDate && schedule.endTime
      ? `${schedule.endDate}T${schedule.endTime}`
      : `${schedule.startDate}T${schedule.endTime || '23:59:59'}`;

    event.start = { dateTime: startDateTime, timeZone: 'Asia/Seoul' };
    event.end = { dateTime: endDateTime, timeZone: 'Asia/Seoul' };
  }

  // 반복 일정 설정
  if (schedule.isRecurring && schedule.recurrenceRule) {
    const { frequency, interval, endDate, daysOfWeek } = schedule.recurrenceRule;
    let rrule = `RRULE:FREQ=${frequency.toUpperCase()};INTERVAL=${interval}`;

    if (endDate) {
      rrule += `;UNTIL=${endDate.replace(/-/g, '')}`;
    }

    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const byDay = daysOfWeek.map(d => dayNames[d]).join(',');
      rrule += `;BYDAY=${byDay}`;
    }

    event.recurrence = [rrule];
  }

  // 알림 설정
  if (schedule.reminderEnabled && schedule.reminderMinutesBefore) {
    event.reminders = {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: schedule.reminderMinutesBefore },
        { method: 'email', minutes: schedule.reminderMinutesBefore },
      ],
    };
  }

  return event;
}

/**
 * Google Calendar 이벤트를 Schedule로 변환
 */
function googleEventToSchedule(event: any): Schedule {
  const isAllDay = !!event.start.date;

  const schedule: Schedule = {
    id: 0, // 임시 ID (저장 시 실제 ID 할당)
    userId: '',
    title: event.summary || '제목 없음',
    description: event.description || undefined,
    scheduleType: 'other',
    startDate: isAllDay ? event.start.date : event.start.dateTime.split('T')[0],
    startTime: isAllDay ? undefined : event.start.dateTime.split('T')[1].substring(0, 5),
    endDate: isAllDay ? event.end.date : (event.end?.dateTime?.split('T')[0] || undefined),
    endTime: isAllDay ? undefined : (event.end?.dateTime ? event.end.dateTime.split('T')[1].substring(0, 5) : undefined),
    allDay: isAllDay,
    status: 'scheduled',
    priority: 'normal',
    location: event.location || undefined,
    reminderEnabled: false,
    isRecurring: !!event.recurrence,
    createdAt: event.created || new Date().toISOString(),
    updatedAt: event.updated || new Date().toISOString(),
  };

  return schedule;
}

/**
 * 구글 캘린더에 일정 내보내기 (업로드)
 */
export async function exportToGoogleCalendar(schedules: Schedule[]): Promise<{ success: number; failed: number }> {
  if (!isGoogleCalendarAuthenticated()) {
    throw new Error('Google Calendar 인증이 필요합니다.');
  }

  let success = 0;
  let failed = 0;

  for (const schedule of schedules) {
    try {
      const event = scheduleToGoogleEvent(schedule);
      await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      success++;
    } catch (error) {
      console.error('일정 내보내기 실패:', schedule.title, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * 구글 캘린더에서 일정 가져오기 (다운로드)
 */
export async function importFromGoogleCalendar(
  startDate?: string,
  endDate?: string
): Promise<Schedule[]> {
  if (!isGoogleCalendarAuthenticated()) {
    throw new Error('Google Calendar 인증이 필요합니다.');
  }

  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate ? `${startDate}T00:00:00Z` : new Date().toISOString(),
      timeMax: endDate ? `${endDate}T23:59:59Z` : undefined,
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime',
    });

    const events = response.result.items || [];
    return events.map(googleEventToSchedule);
  } catch (error) {
    console.error('일정 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 구글 캘린더와 양방향 동기화
 */
export async function syncWithGoogleCalendar(
  localSchedules: Schedule[],
  options: {
    importFromGoogle: boolean;
    exportToGoogle: boolean;
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  imported: Schedule[];
  exported: { success: number; failed: number };
}> {
  const result = {
    imported: [] as Schedule[],
    exported: { success: 0, failed: 0 },
  };

  // 1. 구글에서 가져오기
  if (options.importFromGoogle) {
    try {
      result.imported = await importFromGoogleCalendar(options.startDate, options.endDate);
    } catch (error) {
      console.error('가져오기 실패:', error);
    }
  }

  // 2. 구글로 내보내기
  if (options.exportToGoogle) {
    try {
      result.exported = await exportToGoogleCalendar(localSchedules);
    } catch (error) {
      console.error('내보내기 실패:', error);
    }
  }

  return result;
}
