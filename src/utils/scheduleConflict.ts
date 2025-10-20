/* eslint-disable */
import type { Schedule } from '../types/domain';
import { expandRecurringSchedule } from './scheduleRecurrence';

/**
 * 두 일정이 시간상으로 겹치는지 확인합니다.
 * @param schedule1 첫 번째 일정
 * @param schedule2 두 번째 일정
 * @returns 겹치면 true, 아니면 false
 */
export function isScheduleOverlap(schedule1: Schedule, schedule2: Schedule): boolean {
  // 같은 일정은 충돌로 간주하지 않음
  if (schedule1.id === schedule2.id) {
    return false;
  }

  // 날짜 비교
  const start1 = new Date(schedule1.startDate);
  const end1 = schedule1.endDate ? new Date(schedule1.endDate) : start1;
  const start2 = new Date(schedule2.startDate);
  const end2 = schedule2.endDate ? new Date(schedule2.endDate) : start2;

  // 날짜가 겹치지 않으면 충돌 없음
  if (end1 < start2 || end2 < start1) {
    return false;
  }

  // 종일 일정인 경우 시간 체크 생략
  if (schedule1.allDay || schedule2.allDay) {
    return true;
  }

  // 시간이 설정되어 있지 않으면 종일로 간주
  if (!schedule1.startTime || !schedule2.startTime) {
    return true;
  }

  // 날짜가 같은 경우에만 시간 체크
  const sameDay = start1.toDateString() === start2.toDateString();
  if (!sameDay) {
    return false;
  }

  // 시간 비교
  const time1Start = parseTime(schedule1.startTime);
  const time1End = schedule1.endTime ? parseTime(schedule1.endTime) : time1Start;
  const time2Start = parseTime(schedule2.startTime);
  const time2End = schedule2.endTime ? parseTime(schedule2.endTime) : time2Start;

  // 시간이 겹치는지 확인
  return !(time1End <= time2Start || time2End <= time1Start);
}

/**
 * HH:MM 형식의 시간을 분 단위로 변환합니다.
 */
function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 새 일정과 기존 일정들 사이의 충돌을 감지합니다.
 * @param newSchedule 확인할 새 일정
 * @param existingSchedules 기존 일정 목록
 * @returns 충돌하는 일정 배열
 */
export function detectScheduleConflicts(
  newSchedule: Schedule,
  existingSchedules: Schedule[]
): Schedule[] {
  const conflicts: Schedule[] = [];

  // 새 일정이 반복 일정인 경우, 확장된 인스턴스로 변환
  const newScheduleInstances: Schedule[] = newSchedule.isRecurring && newSchedule.recurrenceRule
    ? expandRecurringSchedule(newSchedule, newSchedule.startDate, getEndDateForExpansion(newSchedule))
    : [newSchedule];

  // 기존 일정들과 비교
  existingSchedules.forEach(existingSchedule => {
    // 기존 일정이 반복 일정인 경우, 확장된 인스턴스로 변환
    const existingInstances: Schedule[] = existingSchedule.isRecurring && existingSchedule.recurrenceRule
      ? expandRecurringSchedule(existingSchedule, existingSchedule.startDate, getEndDateForExpansion(existingSchedule))
      : [existingSchedule];

    // 각 인스턴스끼리 충돌 체크
    for (const newInstance of newScheduleInstances) {
      for (const existingInstance of existingInstances) {
        if (isScheduleOverlap(newInstance, existingInstance)) {
          // 원본 일정을 충돌 목록에 추가 (중복 제거)
          if (!conflicts.find(c => c.id === existingSchedule.id)) {
            conflicts.push(existingSchedule);
          }
          break;
        }
      }
      // 이미 충돌이 발견되면 다음 기존 일정으로
      if (conflicts.find(c => c.id === existingSchedule.id)) {
        break;
      }
    }
  });

  return conflicts;
}

/**
 * 일정 확장을 위한 종료일을 계산합니다.
 * 반복 종료일이 있으면 그것을 사용하고, 없으면 시작일로부터 1년 후를 사용합니다.
 */
function getEndDateForExpansion(schedule: Schedule): string {
  if (schedule.recurrenceRule?.endDate) {
    return schedule.recurrenceRule.endDate;
  }

  // 반복 종료일이 없으면 시작일로부터 1년 후까지 확장
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 충돌 정보를 사용자 친화적인 메시지로 변환합니다.
 */
export function formatConflictMessage(conflicts: Schedule[]): string {
  if (conflicts.length === 0) {
    return '';
  }

  if (conflicts.length === 1) {
    const conflict = conflicts[0];
    return `"${conflict.title}" 일정과 시간이 겹칩니다.`;
  }

  return `${conflicts.length}개의 일정과 시간이 겹칩니다: ${conflicts.map(c => c.title).join(', ')}`;
}
