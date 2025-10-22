import Tooltip from '../Tooltip';
import type { Estimate, ID } from '../../types/domain';

type Props = {
  items: Estimate[];
  allSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: ID, checked: boolean) => void;
  format: (n: number) => string;
  getStatusColor: (s: string) => string;
  onEdit: (e: Estimate) => void;
  onPrint: (e: Estimate) => void;
  onDelete: (id: ID) => void;
  onConvert: (id: ID) => void;
  onStatusChange: (id: ID, status: string) => void;
  selectedIds: ID[];
  statuses: string[];
};

export default function EstimatesTable({ items, allSelected, onToggleAll, onToggleOne, format, getStatusColor, onEdit, onPrint, onDelete, onConvert, onStatusChange, selectedIds, statuses }: Props) {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
              <input id="estimate-select-all" name="estimate-select-all" type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} title="전체 선택" />
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              견적서 번호
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              건 축 주
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              프로젝트
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              작 업 장
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              견적 금액
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              상&nbsp;&nbsp;&nbsp;&nbsp;태
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              유효기한
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
              작&nbsp;&nbsp;&nbsp;&nbsp;업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((estimate, idx) => (
            <tr key={`${estimate.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-3 py-2 text-left w-10">
                <input id={`estimate-select-${estimate.id}`} name={`estimate-select-${estimate.id}`} type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" checked={selectedIds.includes(estimate.id)} onChange={(e) => onToggleOne(estimate.id, e.target.checked)} title="선택" />
              </td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{estimate.id}</td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{estimate.clientName}</td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{estimate.projectName}</td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{estimate.workplaceName}</td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 text-center">{format(estimate.totalAmount)}원</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <select
                  id={`estimate-status-${estimate.id}`}
                  name={`estimate-status-${estimate.id}`}
                  className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(estimate.status)} focus:outline-none focus:ring-0`}
                  value={estimate.status}
                  onChange={(e) => onStatusChange(estimate.id, e.target.value)}
                  title="견적서 상태 변경"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{estimate.validUntil ?? '-'}</td>
              <td className="px-3 py-2 text-center text-sm font-medium">
                <div className="flex items-center justify-center">
                  <Tooltip label="편집"><button onClick={() => onEdit(estimate)} className="text-blue-600 hover:text-blue-900 mx-2" title="견적서 편집">✏️</button></Tooltip>
                  <Tooltip label="출력"><button onClick={() => onPrint(estimate)} className="text-green-600 hover:text-green-900 mx-2" title="견적서 출력">🖨️</button></Tooltip>
                  <Tooltip label="삭제"><button onClick={() => onDelete(estimate.id)} className="text-red-600 hover:text-red-900 mx-2" title="견적서 삭제">🗑️</button></Tooltip>
                  {estimate.status === '승인됨' && (
                    <Tooltip label="작업 항목으로 변환"><button onClick={() => onConvert(estimate.id)} className="text-purple-600 hover:text-purple-900 mx-2" title="작업 항목으로 변환">🔄</button></Tooltip>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
