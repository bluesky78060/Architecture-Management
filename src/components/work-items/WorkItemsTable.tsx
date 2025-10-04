import Tooltip from '../Tooltip';
import type { WorkItem } from '../../types/domain';
import type { Id } from '../../hooks/useSelection';

type Selection = {
  selected: Id[];
  toggleAll: (checked: boolean) => void;
  toggleOne: (id: Id, checked: boolean) => void;
};

type Props = {
  items: WorkItem[];
  selection: Selection;
  format: (n: number) => string;
  getLaborCost: (item: WorkItem) => number;
  getCategoryColor: (category?: string) => string;
  onEdit: (item: WorkItem) => void;
  onDelete: (id: Id) => void;
  onCreateInvoice: (item: WorkItem) => void;
};

export default function WorkItemsTable({ items, selection, format, getLaborCost, getCategoryColor, onEdit, onDelete, onCreateInvoice }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  onChange={(e) => selection.toggleAll(e.target.checked)}
                  checked={selection.selected.length > 0 && selection.selected.length === items.length}
                  className="w-4 h-4 rounded border-gray-300"
                  title="전체 선택"
                />
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">건축주</th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-52">내용</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">작업장</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-28">프로젝트</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-20">카테고리</th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32">단가/수량</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-16">상태</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">날짜</th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, idx) => (
              <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selection.selected.includes(item.id)}
                    onChange={(e) => selection.toggleOne(item.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    title="항목 선택"
                  />
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate w-16">{item.clientName}</div>
                </td>
                <td className="px-2 py-3 w-52">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate w-24">{item.workplaceName}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate w-28">{item.projectName}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-32 text-right">
                  <div className="text-sm font-medium text-gray-900">{format(item.defaultPrice || 0)}원</div>
                  <div className="text-xs text-gray-500">× {item.quantity || 1} {item.unit}</div>
                  <div className="text-xs text-gray-700 font-medium">{format(((item.defaultPrice || 0) * (item.quantity || 1)) + getLaborCost(item))}원</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-16">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === '완료' ? 'bg-green-100 text-green-800' : item.status === '진행중' ? 'bg-blue-100 text-blue-800' : item.status === '보류' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-24">
                  <div className="text-sm text-gray-900">{item.date}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium w-24">
                  <div className="flex space-x-3">
                    <Tooltip label="편집">
                      <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900" title="작업 항목 편집">✏️</button>
                    </Tooltip>
                    <Tooltip label="삭제">
                      <button onClick={() => onDelete(item.id as number)} className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs leading-none bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700" title="작업 항목 삭제">
                        <span className="text-red-600">🗑️</span>
                      </button>
                    </Tooltip>
                    {item.status === '완료' && (
                      <Tooltip label="청구서 생성">
                        <button onClick={() => onCreateInvoice(item)} className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs leading-none bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700" title="청구서 생성">
                          <span className="text-green-600">🧾</span>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
