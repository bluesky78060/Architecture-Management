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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                <input
                  id="workitem-select-all"
                  name="workitem-select-all"
                  type="checkbox"
                  onChange={(e) => selection.toggleAll(e.target.checked)}
                  checked={selection.selected.length > 0 && selection.selected.length === items.length}
                  className="w-4 h-4 rounded border-gray-300"
                  title="전체 선택"
                />
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                건 축 주
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-52">
                내&nbsp;&nbsp;&nbsp;&nbsp;용
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                작 업 장
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-28">
                프로젝트
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-20 whitespace-nowrap">
카테고리
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">
단가/수량
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-16">
                상&nbsp;&nbsp;&nbsp;&nbsp;태
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                날&nbsp;&nbsp;&nbsp;&nbsp;짜
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
                작&nbsp;&nbsp;&nbsp;&nbsp;업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item, idx) => (
              <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    id={`workitem-select-${item.id}`}
                    name={`workitem-select-${item.id}`}
                    type="checkbox"
                    checked={selection.selected.includes(item.id)}
                    onChange={(e) => selection.toggleOne(item.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    title="항목 선택"
                  />
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-16">{item.clientName}</div>
                </td>
                <td className="px-2 py-3 w-52">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate w-24">{item.workplaceName}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate w-28">{item.projectName}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-32 text-right">
                  {(() => {
                    const priceRaw = Number(item.defaultPrice);
                    const qtyRaw = Number(item.quantity);
                    const price = Number.isFinite(priceRaw) ? priceRaw : 0;
                    const qty = Number.isFinite(qtyRaw) ? qtyRaw : 1;
                    const laborCost = getLaborCost(item);
                    const line = price * qty + laborCost;
                    return (
                      <>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{format(price)}원</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">× {qty} {item.unit}</div>
                        {laborCost > 0 && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400">+ 인건비 {format(laborCost)}원</div>
                        )}
                        <div className="text-xs text-gray-700 dark:text-gray-200 font-medium">{format(line)}원</div>
                      </>
                    );
                  })()}
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-16">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === '완료' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : item.status === '진행중' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' : item.status === '보류' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-24">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{item.date}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium w-24">
                  <div className="flex">
                    <Tooltip label="편집">
                      <button onClick={() => onEdit(item)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mx-2" title="작업 항목 편집">✏️</button>
                    </Tooltip>
                    <Tooltip label="삭제">
                      <button onClick={() => onDelete(item.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mx-2" title="작업 항목 삭제">🗑️</button>
                    </Tooltip>
                    {item.status === '완료' && (
                      <Tooltip label="청구서 생성">
                        <button onClick={() => onCreateInvoice(item)} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mx-2" title="청구서 생성">🧾</button>
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
