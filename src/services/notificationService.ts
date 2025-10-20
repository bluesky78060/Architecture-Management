/* eslint-disable */
import type { Schedule } from '../types/domain';

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 알림 권한 상태 확인
export const checkNotificationPermission = (): 'granted' | 'denied' | 'default' => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

// 일정 알림 표시
export const showScheduleNotification = (schedule: Schedule, minutesUntil: number) => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const timeText = minutesUntil === 0
    ? '지금'
    : `${minutesUntil}분 후`;

  const notification = new Notification(`일정 알림: ${schedule.title}`, {
    body: `${timeText}에 일정이 있습니다.\n${schedule.description || ''}${schedule.location ? `\n📍 ${schedule.location}` : ''}`,
    icon: '/logo192.png',
    tag: `schedule-${schedule.id}`,
    requireInteraction: false,
    silent: false,
  });

  // 알림 클릭 시 일정 페이지로 이동
  notification.onclick = () => {
    window.focus();
    window.location.href = '/schedules';
    notification.close();
  };

  // 5초 후 자동으로 닫기
  setTimeout(() => {
    notification.close();
  }, 5000);
};

// 일정 알림 스케줄링 (메모리 기반)
interface ScheduledNotification {
  scheduleId: number;
  timeoutId: NodeJS.Timeout;
}

const scheduledNotifications: ScheduledNotification[] = [];

// 모든 예약된 알림 취소
export const cancelAllNotifications = () => {
  scheduledNotifications.forEach(({ timeoutId }) => {
    clearTimeout(timeoutId);
  });
  scheduledNotifications.length = 0;
};

// 특정 일정의 알림 취소
export const cancelScheduleNotification = (scheduleId: number) => {
  const index = scheduledNotifications.findIndex(n => n.scheduleId === scheduleId);
  if (index !== -1) {
    clearTimeout(scheduledNotifications[index].timeoutId);
    scheduledNotifications.splice(index, 1);
  }
};

// 일정 알림 스케줄링
export const scheduleNotification = (schedule: Schedule) => {
  if (!schedule.reminderEnabled || !schedule.reminderMinutesBefore) {
    return;
  }

  // 기존 알림 취소
  cancelScheduleNotification(schedule.id);

  // 알림 시간 계산
  const scheduleDateTime = new Date(`${schedule.startDate}T${schedule.startTime || '00:00'}:00`);
  const reminderTime = new Date(scheduleDateTime.getTime() - schedule.reminderMinutesBefore * 60 * 1000);
  const now = new Date();

  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  // 이미 지난 시간이면 즉시 알림 표시
  if (timeUntilReminder <= 0) {
    if (scheduleDateTime.getTime() > now.getTime()) {
      // 일정은 아직 시작 안 했지만 알림 시간은 지남
      const minutesUntil = Math.round((scheduleDateTime.getTime() - now.getTime()) / 60000);
      showScheduleNotification(schedule, minutesUntil);
    }
    return;
  }

  // 알림 예약 (최대 24시간 이내만 예약)
  if (timeUntilReminder <= 24 * 60 * 60 * 1000) {
    const timeoutId = setTimeout(() => {
      showScheduleNotification(schedule, schedule.reminderMinutesBefore || 0);
      cancelScheduleNotification(schedule.id);
    }, timeUntilReminder);

    scheduledNotifications.push({
      scheduleId: schedule.id,
      timeoutId,
    });
  }
};

// 여러 일정의 알림 스케줄링
export const scheduleMultipleNotifications = (schedules: Schedule[]) => {
  schedules.forEach(schedule => {
    if (schedule.reminderEnabled && schedule.reminderMinutesBefore) {
      scheduleNotification(schedule);
    }
  });
};

// 24시간 내 예정된 알림 개수 확인
export const getPendingNotificationCount = (): number => {
  return scheduledNotifications.length;
};
