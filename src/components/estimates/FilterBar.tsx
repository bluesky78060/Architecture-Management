import type { Client } from '../../types/domain';

type Props = {
  clients: Client[];
  statuses: string[];
  selectedClient: string | number;
  selectedStatus: string;
  filteredCount: number;
  totalCount: number;
  onChangeClient: (val: string) => void;
  onChangeStatus: (val: string) => void;
  onReset: () => void;
};

export default function FilterBar({ clients, statuses, selectedClient, selectedStatus, filteredCount, totalCount, onChangeClient, onChangeStatus, onReset }: Props) {
  return (
    <div className="bg-white rounded-md shadow-sm p-3 mb-4">
      <div className="flex items-center space-x-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500">필터:</span>
        <div className="relative inline-flex items-center">
          <select value={String(selectedClient || '')} onChange={(e) => onChangeClient(e.target.value)} className="border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0">
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
        <span className="text-xs text-gray-500">{(selectedClient || selectedStatus) ? `${filteredCount}개` : `총 ${totalCount}개`}</span>
        {(selectedClient || selectedStatus) && (
          <button onClick={onReset} className="text-xs text-indigo-600 hover:text-indigo-800 underline">초기화</button>
        )}
      </div>
    </div>
  );
}

