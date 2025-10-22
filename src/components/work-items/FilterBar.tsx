import type { Client } from '../../types/domain';
import { isPositiveNumber } from '../../utils/guards';

type Props = {
  clients: Client[];
  selectedClient: string | number;
  selectedProject: string;
  filteredCount: number;
  totalCount: number;
  selectionCount: number;
  bulkStatus: string;
  statuses: string[];
  getClientProjects: (clientId?: number | string) => string[];
  onChangeClient: (val: string) => void;
  onChangeProject: (val: string) => void;
  onResetFilters: () => void;
  onBulkStatusChange: (val: string) => void;
  onApplyBulkStatus: () => void;
  onCreateBulkInvoice: () => void;
  onBulkDelete: () => void;
};

export default function FilterBar({
  clients,
  selectedClient,
  selectedProject,
  filteredCount,
  totalCount,
  selectionCount,
  bulkStatus,
  statuses,
  getClientProjects,
  onChangeClient,
  onChangeProject,
  onResetFilters,
  onBulkStatusChange,
  onApplyBulkStatus,
  onCreateBulkInvoice,
  onBulkDelete,
}: Props) {
  const hasClient = String(selectedClient ?? '') !== '';
  const hasProject = (selectedProject ?? '').trim() !== '';
  const hasFilter = hasClient || hasProject;
  const hasSelection = isPositiveNumber(selectionCount);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-2 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">필터:</span>
          <div className="relative inline-flex items-center">
            <label htmlFor="filter-client" className="sr-only">건축주 필터</label>
            <select
              id="filter-client"
              name="filterClient"
              autoComplete="off"
              value={selectedClient == null ? '' : String(selectedClient)}
              onChange={(e) => onChangeClient(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 pr-8 py-1.5 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0"
            >
              <option value="">전체 건축주</option>
              {clients.map(client => (
                <option key={client.id} value={String(client.id)}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="relative inline-flex items-center">
            <label htmlFor="filter-project" className="sr-only">프로젝트 필터</label>
            <select
              id="filter-project"
              name="filterProject"
              autoComplete="off"
              value={selectedProject}
              onChange={(e) => onChangeProject(e.target.value)}
              className={`border border-gray-300 dark:border-gray-600 rounded-md px-3 pr-8 py-1.5 bg-white dark:bg-gray-700 text-xs hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0 ${!hasClient ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300'}`}
              disabled={!hasClient}
            >
              <option value="">{hasClient ? '전체 프로젝트' : '건축주 선택 후'}</option>
              {hasClient && getClientProjects(selectedClient).map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {hasFilter ? `${filteredCount}개` : `총 ${totalCount}개`}
          </span>
          {hasSelection && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
              선택 {selectionCount}
            </span>
          )}
          {hasFilter && (
            <button
              onClick={onResetFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
            >
              초기화
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasSelection && (
            <>
              <div className="flex items-center space-x-2 mr-2">
                <label htmlFor="bulk-status-select" className="text-xs text-gray-600 dark:text-gray-300">상태 일괄 변경</label>
                <select
                  id="bulk-status-select"
                  name="bulkStatus"
                  autoComplete="off"
                  value={bulkStatus}
                  onChange={(e) => onBulkStatusChange(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">상태 선택</option>
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={onApplyBulkStatus}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-2 rounded flex items-center text-xs leading-none"
                >
                  적용
                </button>
              </div>
              <button onClick={onCreateBulkInvoice} className="flex items-center justify-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 dark:text-gray-300 text-xs leading-none">
                <span className="text-green-600 mr-1.5">📈</span>
                <span className="font-semibold">청구서 생성 ({selectionCount})</span>
              </button>
              <button onClick={onBulkDelete} className="flex items-center justify-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 dark:text-gray-300 text-xs leading-none">
                <span className="text-red-600 mr-1.5">🗑️</span>
                <span className="font-semibold">삭제 ({selectionCount})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
