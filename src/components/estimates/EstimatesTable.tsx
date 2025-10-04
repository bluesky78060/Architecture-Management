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
  selectedIds: ID[];
};

export default function EstimatesTable({ items, allSelected, onToggleAll, onToggleOne, format, getStatusColor, onEdit, onPrint, onDelete, onConvert, selectedIds }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left w-10">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} title="전체 선택" />
            </th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">견적서 번호</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">건축주</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">작업장</th>
            <th className="px-3 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">견적 금액</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">유효기한</th>
            <th className="px-3 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32">작업</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((estimate, idx) => (
            <tr key={`${estimate.id}-${idx}`} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-left w-10">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedIds.includes(estimate.id)} onChange={(e) => onToggleOne(estimate.id, e.target.checked)} title="선택" />
              </td>
              <td className="px-3 py-2 text-sm text-gray-900">{estimate.id}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{estimate.clientName}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{estimate.projectName}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{estimate.workplaceName}</td>
              <td className="px-3 py-2 text-sm text-gray-900 text-center">{format(estimate.totalAmount)}원</td>
              <td className="px-3 py-2 text-sm"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(estimate.status)}`}>{estimate.status}</span></td>
              <td className="px-3 py-2 text-sm text-gray-900">{estimate.validUntil || '-'}</td>
              <td className="px-3 py-2 text-center text-sm font-medium">
                <div className="flex items-center justify-center space-x-3">
                  <Tooltip label="편집"><button onClick={() => onEdit(estimate)} className="text-blue-600 hover:text-blue-900" title="견적서 편집">✏️</button></Tooltip>
                  <Tooltip label="출력"><button onClick={() => onPrint(estimate)} className="text-green-600 hover:text-green-900" title="견적서 출력">🖨️</button></Tooltip>
                  <Tooltip label="삭제"><button onClick={() => onDelete(estimate.id)} className="text-red-600 hover:text-red-900" title="견적서 삭제">🗑️</button></Tooltip>
                  {estimate.status === '승인됨' && (
                    <Tooltip label="작업 항목으로 변환"><button onClick={() => onConvert(estimate.id)} className="text-purple-600 hover:text-purple-900" title="작업 항목으로 변환">🔄</button></Tooltip>
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
