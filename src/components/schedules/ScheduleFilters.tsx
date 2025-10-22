/* eslint-disable */
import { useState } from 'react';
import type { ScheduleType, ScheduleStatus } from '../../types/domain';

import type { ID } from '../../types/domain';

interface ScheduleFiltersProps {
  clients: Array<{ id: ID; name: string }>;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  scheduleType: ScheduleType[];
  status: ScheduleStatus[];
  clientId: ID | null;
  searchText: string;
}

export default function ScheduleFilters({
  clients,
  onFilterChange,
}: ScheduleFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    scheduleType: [],
    status: [],
    clientId: null,
    searchText: '',
  });

  // 일정 타입 옵션
  const scheduleTypes: Array<{ value: ScheduleType; label: string; icon: string }> = [
    { value: 'construction', label: '공사', icon: '🏗️' },
    { value: 'consultation', label: '상담', icon: '💬' },
    { value: 'meeting', label: '미팅', icon: '👥' },
    { value: 'other', label: '기타', icon: '📝' },
  ];

  // 상태 옵션
  const statusOptions: Array<{ value: ScheduleStatus; label: string; icon: string }> = [
    { value: 'scheduled', label: '예정', icon: '📅' },
    { value: 'in_progress', label: '진행중', icon: '⏳' },
    { value: 'completed', label: '완료', icon: '✅' },
    { value: 'cancelled', label: '취소', icon: '❌' },
  ];

  const handleTypeToggle = (type: ScheduleType) => {
    const newTypes = filters.scheduleType.includes(type)
      ? filters.scheduleType.filter(t => t !== type)
      : [...filters.scheduleType, type];

    const newFilters = { ...filters, scheduleType: newTypes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusToggle = (status: ScheduleStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];

    const newFilters = { ...filters, status: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClientChange = (clientIdStr: string) => {
    const clientId: ID | null = clientIdStr ? (isNaN(parseInt(clientIdStr)) ? clientIdStr : parseInt(clientIdStr)) : null;
    const newFilters = {
      ...filters,
      clientId,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (searchText: string) => {
    const newFilters = { ...filters, searchText };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      scheduleType: [],
      status: [],
      clientId: null,
      searchText: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount =
    filters.scheduleType.length +
    filters.status.length +
    (filters.clientId ? 1 : 0) +
    (filters.searchText ? 1 : 0);

  return (
    <div className="mb-4">
      {/* 필터 토글 버튼 */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          필터
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* 검색 입력 */}
        <div className="flex-1 relative">
          <input
            id="schedule-search"
            name="schedule-search"
            type="text"
            value={filters.searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="일정 제목이나 설명으로 검색..."
            className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            초기화
          </button>
        )}
      </div>

      {/* 필터 옵션 패널 */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          {/* 일정 타입 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              일정 타입
            </label>
            <div className="flex flex-wrap gap-2">
              {scheduleTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeToggle(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.scheduleType.includes(type.value)
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              상태
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusToggle(status.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.status.includes(status.value)
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {status.icon} {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* 건축주 필터 */}
          <div>
            <label htmlFor="schedule-client-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              건축주
            </label>
            <select
              id="schedule-client-filter"
              name="schedule-client-filter"
              value={filters.clientId || ''}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 건축주</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
