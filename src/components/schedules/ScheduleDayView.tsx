/* eslint-disable */
import { useMemo } from 'react';
import type { Schedule } from '../../types/domain';

interface ScheduleDayViewProps {
  schedules: Schedule[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
}

export default function ScheduleDayView({
  schedules,
  currentDate,
  onDateChange,
  onScheduleClick,
}: ScheduleDayViewProps) {
  // 일간 헬퍼 함수들
  const getDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayName = dayNames[date.getDay()];

    return `${year}년 ${month}월 ${day}일 ${dayName}`;
  };

  const navigatePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const navigateNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const navigateToday = () => {
    onDateChange(new Date());
  };

  // 시간대 (6시~22시)
  const hours = useMemo(() => {
    const result: number[] = [];
    for (let i = 6; i <= 22; i++) {
      result.push(i);
    }
    return result;
  }, []);

  // 오늘 날짜의 일정들
  const daySchedules = useMemo(() => {
    const dateString = currentDate.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.startDate === dateString);
  }, [schedules, currentDate]);

  // 특정 시간대의 일정들 가져오기
  const getSchedulesForHour = (hour: number): Schedule[] => {
    return daySchedules.filter(schedule => {
      if (schedule.allDay) return hour === 6; // 종일 일정은 첫 시간대에만 표시

      if (schedule.startTime) {
        const scheduleHour = parseInt(schedule.startTime.split(':')[0]);
        return scheduleHour === hour;
      }

      return hour === 6; // 시간 미지정은 첫 시간대에 표시
    });
  };

  // 오늘 날짜인지 확인
  const isToday = (): boolean => {
    const today = new Date();
    return currentDate.getFullYear() === today.getFullYear() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getDate() === today.getDate();
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 dark:bg-red-600';
      case 'high': return 'bg-orange-500 dark:bg-orange-600';
      case 'normal': return 'bg-blue-500 dark:bg-blue-600';
      case 'low': return 'bg-gray-400 dark:bg-gray-600';
      default: return 'bg-blue-500 dark:bg-blue-600';
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'in_progress': return '⏳';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📅';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {getDateString(currentDate)}
            {isToday() && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                오늘
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={navigateToday}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              오늘
            </button>
            <button
              onClick={navigatePrevDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNextDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 일정 요약 */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>전체 일정: <span className="font-medium text-gray-900 dark:text-white">{daySchedules.length}개</span></div>
          <div>완료: <span className="font-medium text-green-600 dark:text-green-400">{daySchedules.filter(s => s.status === 'completed').length}개</span></div>
          <div>진행중: <span className="font-medium text-blue-600 dark:text-blue-400">{daySchedules.filter(s => s.status === 'in_progress').length}개</span></div>
        </div>
      </div>

      {/* 시간대별 그리드 */}
      <div className="overflow-y-auto max-h-[600px]">
        {hours.map(hour => {
          const hourSchedules = getSchedulesForHour(hour);

          return (
            <div key={hour} className="flex border-b border-gray-200 dark:border-gray-700 min-h-[80px]">
              {/* 시간 */}
              <div className="w-20 flex-shrink-0 p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                <div className="font-medium">{hour}:00</div>
              </div>

              {/* 일정 영역 */}
              <div className="flex-1 p-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                {hourSchedules.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-600">
                    일정 없음
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hourSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => onScheduleClick(schedule)}
                        className={`p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow text-white ${getPriorityColor(schedule.priority)}`}
                      >
                        {/* 일정 헤더 */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-base">
                              {getStatusIcon(schedule.status)} {schedule.title}
                            </div>
                            {schedule.startTime && !schedule.allDay && (
                              <div className="text-xs mt-1 text-white text-opacity-90">
                                ⏰ {schedule.startTime}
                                {schedule.endTime && ` - ${schedule.endTime}`}
                              </div>
                            )}
                            {schedule.allDay && (
                              <div className="text-xs mt-1 text-white text-opacity-90">
                                📅 종일
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 일정 상세 */}
                        <div className="space-y-1 text-xs text-white text-opacity-90">
                          {schedule.clientName && (
                            <div>👤 {schedule.clientName}</div>
                          )}
                          {schedule.location && (
                            <div>📍 {schedule.location}</div>
                          )}
                          {schedule.projectName && (
                            <div>🏗️ {schedule.projectName}</div>
                          )}
                          {schedule.description && (
                            <div className="mt-2 text-white text-opacity-80">
                              {schedule.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 일정이 없는 경우 */}
      {daySchedules.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-gray-500 dark:text-gray-400">
            이 날짜에 예정된 일정이 없습니다
          </div>
        </div>
      )}
    </div>
  );
}
