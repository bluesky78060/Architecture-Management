/* eslint-disable */
import { useMemo } from 'react';
import type { Schedule } from '../../types/domain';

interface ScheduleWeekViewProps {
  schedules: Schedule[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
}

export default function ScheduleWeekView({
  schedules,
  currentDate,
  onDateChange,
  onScheduleClick,
}: ScheduleWeekViewProps) {
  // 주간 헬퍼 함수들
  const getWeekDates = (date: Date): Date[] => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // 일요일로 이동
    const sunday = new Date(d.setDate(diff));

    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(sunday);
      weekDate.setDate(sunday.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const getWeekRange = (date: Date): string => {
    const weekDates = getWeekDates(date);
    const start = weekDates[0];
    const end = weekDates[6];

    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;

    if (startMonth === endMonth) {
      return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${end.getDate()}일`;
    } else {
      return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${endMonth}월 ${end.getDate()}일`;
    }
  };

  const navigatePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const navigateNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const navigateToday = () => {
    onDateChange(new Date());
  };

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // 시간대 (6시~22시)
  const hours = useMemo(() => {
    const result: number[] = [];
    for (let i = 6; i <= 22; i++) {
      result.push(i);
    }
    return result;
  }, []);

  // 특정 날짜의 일정들 가져오기
  const getSchedulesForDate = (date: Date): Schedule[] => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.startDate === dateString);
  };

  // 특정 날짜, 시간대의 일정들 가져오기
  const getSchedulesForDateTime = (date: Date, hour: number): Schedule[] => {
    const dateSchedules = getSchedulesForDate(date);

    return dateSchedules.filter(schedule => {
      if (schedule.allDay) return hour === 6; // 종일 일정은 첫 시간대에만 표시

      if (schedule.startTime) {
        const scheduleHour = parseInt(schedule.startTime.split(':')[0]);
        return scheduleHour === hour;
      }

      return hour === 6; // 시간 미지정은 첫 시간대에 표시
    });
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {getWeekRange(currentDate)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={navigateToday}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              오늘
            </button>
            <button
              onClick={navigatePrevWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNextWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 주간 그리드 */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
              시간
            </div>
            {weekDates.map((date, index) => {
              const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
              const isTodayDate = isToday(date);

              return (
                <div
                  key={index}
                  className={`p-2 text-center border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${
                    index === 0 ? 'text-red-600 dark:text-red-400' :
                    index === 6 ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{dayNames[index]}</div>
                  <div className={`text-sm ${isTodayDate ? 'inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 시간대별 그리드 */}
          <div>
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 min-h-[60px]">
                {/* 시간 */}
                <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                  {hour}:00
                </div>

                {/* 각 요일 */}
                {weekDates.map((date, dayIndex) => {
                  const daySchedules = getSchedulesForDateTime(date, hour);

                  return (
                    <div
                      key={dayIndex}
                      className="p-1 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="space-y-1">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            onClick={() => onScheduleClick(schedule)}
                            className={`text-xs px-1 py-0.5 rounded cursor-pointer text-white ${getPriorityColor(schedule.priority)}`}
                            title={schedule.title}
                          >
                            <div className="truncate font-medium">
                              {schedule.startTime && !schedule.allDay && `${schedule.startTime} `}
                              {schedule.title}
                            </div>
                            {schedule.location && (
                              <div className="truncate text-white text-opacity-80 text-[10px]">
                                📍 {schedule.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
