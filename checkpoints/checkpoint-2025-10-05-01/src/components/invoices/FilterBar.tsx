import type { Client } from '../../types/domain';

type Props = {
  clients: Client[];
  selectedClient: string | number;
  selectedStatus: string;
  filteredCount: number;
  onChangeClient: (val: string) => void;
  onChangeStatus: (val: string) => void;
  onReset: () => void;
};

export default function FilterBar({ clients, selectedClient, selectedStatus, filteredCount, onChangeClient, onChangeStatus, onReset }: Props) {
  const hasClient = String(selectedClient ?? '') !== '';
  const hasStatus = (selectedStatus ?? '').trim() !== '';
  const hasFilter = hasClient || hasStatus;
  return (
    <div className="bg-white rounded-md shadow-sm p-3 mb-4">
      <div className="flex items-center space-x-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500">필터:</span>
        <div className="relative inline-flex items-center">
          <select value={selectedClient == null ? '' : String(selectedClient)} onChange={(e) => onChangeClient(e.target.value)} className="border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0">
            <option value="">전체 건축주</option>
            {clients.map(c => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
          </select>
        </div>
        <div className="relative inline-flex items-center">
          <select value={selectedStatus} onChange={(e) => onChangeStatus(e.target.value)} disabled={!hasClient} className={`border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0 ${!hasClient ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}>
            <option value="">{!hasClient ? '건축주 선택 후' : '전체 상태'}</option>
            <option value="발송대기">발송대기</option>
            <option value="발송됨">발송됨</option>
            <option value="미결제">미결제</option>
            <option value="결제완료">결제완료</option>
          </select>
        </div>
        <span className="text-xs text-gray-500">{filteredCount}개</span>
        {hasFilter && (
          <button onClick={onReset} className="text-xs text-indigo-600 hover:text-indigo-800 underline">초기화</button>
        )}
      </div>
    </div>
  );
}
