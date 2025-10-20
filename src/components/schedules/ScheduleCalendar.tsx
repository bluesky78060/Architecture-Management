/* eslint-disable */
import { useMemo } from 'react';
import type { Schedule } from '../../types/domain';

interface ScheduleCalendarProps {
  schedules: Schedule[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  onDateClick: (date: Date) => void;
}

export default function ScheduleCalendar({
  schedules,
  currentDate,
  onDateChange,
  onScheduleClick,
  onDateClick,
}: ScheduleCalendarProps) {
  // 달력 헬퍼 함수들
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthYear = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const navigatePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const navigateNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const navigateToday = () => {
    onDateChange(new Date());
  };

  // 현재 월의 날짜 그리드 생성
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: Array<{ date: number | null; fullDate: Date | null }> = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, fullDate: null });
    }

    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      days.push({ date: i, fullDate });
    }

    return days;
  }, [currentDate]);

  // 특정 날짜의 일정들 가져오기
  const getSchedulesForDate = (date: Date): Schedule[] => {
    if (!date) return [];

    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.startDate === dateString);
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
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
      {/* 캘린더 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {getMonthYear(currentDate)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={navigateToday}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              오늘
            </button>
            <button
              onClick={navigatePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`p-2 text-center text-sm font-semibold ${
              index === 0 ? 'text-red-600 dark:text-red-400' :
              index === 6 ? 'text-blue-600 dark:text-blue-400' :
              'text-gray-700 dark:text-gray-300'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const daySchedules = day.fullDate ? getSchedulesForDate(day.fullDate) : [];
          const isTodayDate = isToday(day.fullDate);

          return (
            <div
              key={index}
              onClick={() => day.fullDate && onDateClick(day.fullDate)}
              className={`min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-gray-700 ${
                day.date ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              {day.date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    isTodayDate
                      ? 'inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full'
                      : index % 7 === 0
                        ? 'text-red-600 dark:text-red-400'
                        : index % 7 === 6
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {day.date}
                  </div>

                  {/* 일정 표시 (최대 3개) */}
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick(schedule);
                        }}
                        className={`text-xs px-1 py-0.5 rounded truncate text-white ${getPriorityColor(schedule.priority)}`}
                        title={schedule.title}
                      >
                        {schedule.startTime && `${schedule.startTime} `}
                        {schedule.title}
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                        +{daySchedules.length - 3}개 더
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
