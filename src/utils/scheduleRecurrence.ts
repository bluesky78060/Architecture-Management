/* eslint-disable */
import type { Schedule } from '../types/domain';

/**
 * 반복 일정을 주어진 기간 내의 개별 일정 인스턴스로 확장합니다.
 * @param schedule 반복 일정 객체
 * @param startDate 확장할 기간의 시작일 (YYYY-MM-DD)
 * @param endDate 확장할 기간의 종료일 (YYYY-MM-DD)
 * @returns 확장된 일정 인스턴스 배열
 */
export function expandRecurringSchedule(
  schedule: Schedule,
  startDate: string,
  endDate: string
): Schedule[] {
  if (!schedule.isRecurring || !schedule.recurrenceRule) {
    return [schedule];
  }

  const instances: Schedule[] = [];
  const { frequency, interval, endDate: recurrenceEndDate, daysOfWeek } = schedule.recurrenceRule;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const scheduleStart = new Date(schedule.startDate);
  const recurrenceEnd = recurrenceEndDate ? new Date(recurrenceEndDate) : end;

  let currentDate = new Date(scheduleStart);

  // 반복 종료일이 조회 기간보다 이전이면 반복 종료일까지만
  const effectiveEnd = recurrenceEnd < end ? recurrenceEnd : end;

  while (currentDate <= effectiveEnd) {
    // 조회 기간 시작일 이후이고, 반복 규칙에 맞는 경우만 추가
    if (currentDate >= start) {
      // 주간 반복인 경우 요일 체크
      if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
        const dayOfWeek = currentDate.getDay();
        if (!daysOfWeek.includes(dayOfWeek)) {
          // 다음 반복일로 이동
          addInterval(currentDate, frequency, interval);
          continue;
        }
      }

      // 인스턴스 생성
      const instance: Schedule = {
        ...schedule,
        id: schedule.id, // 원본 ID 유지 (반복 일정 시리즈 식별용)
        startDate: formatDate(currentDate),
        endDate: schedule.endDate ? formatDate(
          new Date(new Date(currentDate).getTime() +
            (new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()))
        ) : undefined,
      };
      instances.push(instance);
    }

    // 다음 반복일로 이동
    addInterval(currentDate, frequency, interval);
  }

  return instances;
}

/**
 * 날짜에 반복 간격을 추가합니다.
 */
function addInterval(
  date: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number
): void {
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + interval * 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval);
      break;
  }
}

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환합니다.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 주어진 날짜 범위 내의 모든 일정(반복 일정 포함)을 확장합니다.
 */
export function expandSchedulesForDateRange(
  schedules: Schedule[],
  startDate: string,
  endDate: string
): Schedule[] {
  const expandedSchedules: Schedule[] = [];

  schedules.forEach(schedule => {
    if (schedule.isRecurring) {
      const instances = expandRecurringSchedule(schedule, startDate, endDate);
      expandedSchedules.push(...instances);
    } else {
      // 일반 일정은 날짜 범위 내에 있으면 추가
      if (schedule.startDate >= startDate && schedule.startDate <= endDate) {
        expandedSchedules.push(schedule);
      }
    }
  });

  return expandedSchedules;
}
