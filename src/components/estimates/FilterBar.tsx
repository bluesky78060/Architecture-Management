import type { Client } from '../../types/domain';
import { isPositiveNumber } from '../../utils/guards';

type Props = {
  clients: Client[];
  statuses: string[];
  selectedClient: string | number;
  selectedStatus: string;
  filteredCount: number;
  totalCount: number;
  selectionCount: number;
  onChangeClient: (val: string) => void;
  onChangeStatus: (val: string) => void;
  onReset: () => void;
  onBulkDelete: () => void;
};

export default function FilterBar({ clients, statuses, selectedClient, selectedStatus, filteredCount, totalCount, selectionCount, onChangeClient, onChangeStatus, onReset, onBulkDelete }: Props) {
  const hasClient = String(selectedClient ?? '') !== '';
  const hasStatus = (selectedStatus ?? '').trim() !== '';
  const hasFilter = hasClient || hasStatus;
  const hasSelection = isPositiveNumber(selectionCount);
  return (
    <div className="bg-white rounded-md shadow-sm p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500">필터:</span>
          <div className="relative inline-flex items-center">
            <select value={selectedClient == null ? '' : String(selectedClient)} onChange={(e) => onChangeClient(e.target.value)} className="border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0">
              <option value="">전체 건축주</option>
              {clients.map(client => (
                <option key={client.id} value={String(client.id)}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="relative inline-flex items-center">
            <select value={selectedStatus} onChange={(e) => onChangeStatus(e.target.value)} className="border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0">
              <option value="">전체 상태</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-gray-500">{hasFilter ? `${filteredCount}개` : `총 ${totalCount}개`}</span>
          {hasSelection && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              선택 {selectionCount}
            </span>
          )}
          {hasFilter && (
            <button onClick={onReset} className="text-xs text-indigo-600 hover:text-indigo-800 underline">초기화</button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasSelection && (
            <button onClick={onBulkDelete} className="flex items-center justify-center px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 text-xs leading-none">
              <span className="text-red-600 mr-1.5">🗑️</span>
              <span className="font-semibold">삭제 ({selectionCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
