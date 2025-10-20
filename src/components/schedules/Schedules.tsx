/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import ScheduleList from './ScheduleList';
import ScheduleCalendar from './ScheduleCalendar';
import ScheduleWeekView from './ScheduleWeekView';
import ScheduleDayView from './ScheduleDayView';
import ScheduleForm from './ScheduleForm';
import ScheduleFilters, { type FilterState } from './ScheduleFilters';
import GoogleCalendarSync from './GoogleCalendarSync';
import type { Schedule } from '../../types/domain';
import { expandSchedulesForDateRange } from '../../utils/scheduleRecurrence';

type ViewMode = 'list' | 'calendar' | 'week' | 'day';

export default function Schedules() {
  const { schedules, clients } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showGoogleSync, setShowGoogleSync] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    scheduleType: [],
    status: [],
    clientId: null,
    searchText: '',
  });

  useEffect(() => {
    /* eslint-disable no-console */
    console.log('✅ [Schedules] Component mounted');
    /* eslint-enable no-console */
  }, []);

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDateClick = (_date: Date) => {
    // 날짜 클릭 시 해당 날짜로 일정 추가 폼 열기
    // TODO: 선택한 날짜로 초기값 설정
    setEditingSchedule(null);
    setShowForm(true);
  };

  // 필터링된 일정 목록
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      // 일정 타입 필터
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

      // 검색어 필터
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const titleMatch = schedule.title.toLowerCase().includes(searchLower);
        const descMatch = schedule.description?.toLowerCase().includes(searchLower);
        const clientMatch = schedule.clientName?.toLowerCase().includes(searchLower);
        const projectMatch = schedule.projectName?.toLowerCase().includes(searchLower);

        if (!titleMatch && !descMatch && !clientMatch && !projectMatch) {
          return false;
        }
      }

      return true;
    });
  }, [schedules, filters]);

  // 캘린더 뷰용 확장된 일정 목록 (반복 일정 포함)
  const expandedSchedules = useMemo(() => {
    // 현재 날짜 기준으로 ±2개월 범위의 일정 확장
    const startDate = new Date(currentDate);
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + 2);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return expandSchedulesForDateRange(
      filteredSchedules,
      formatDate(startDate),
      formatDate(endDate)
    );
  }, [filteredSchedules, currentDate]);

  // 건축주 목록 (필터용)
  const clientOptions = useMemo(() => {
    return clients.map((client) => ({
      id: client.id,
      name: client.name,
    }));
  }, [clients]);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">일정 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGoogleSync(true)}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              📅 Google Calendar
            </button>
            <button
              onClick={handleAddSchedule}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              + 일정 추가
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            리스트
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            일간
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            월간
          </button>
        </div>
      </div>

      {/* Filters */}
      <ScheduleFilters
        clients={clientOptions}
        onFilterChange={setFilters}
      />

      {/* Content */}
      {viewMode === 'list' && <ScheduleList schedules={filteredSchedules} onEdit={handleEditSchedule} />}
      {viewMode === 'day' && (
        <ScheduleDayView
          schedules={expandedSchedules}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onScheduleClick={handleScheduleClick}
        />
      )}
      {viewMode === 'week' && (
        <ScheduleWeekView
          schedules={expandedSchedules}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onScheduleClick={handleScheduleClick}
        />
      )}
      {viewMode === 'calendar' && (
        <ScheduleCalendar
          schedules={expandedSchedules}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onScheduleClick={handleScheduleClick}
          onDateClick={handleDateClick}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <ScheduleForm
          schedule={editingSchedule}
          onClose={handleCloseForm}
        />
      )}

      {/* Google Calendar Sync Modal */}
      {showGoogleSync && (
        <GoogleCalendarSync
          onClose={() => setShowGoogleSync(false)}
        />
      )}
    </div>
  );
}
