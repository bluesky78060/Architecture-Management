import Tooltip from '../Tooltip';
import type { Invoice } from '../../types/domain';

type Props = {
  items: Invoice[];
  allSelected: boolean;
  selectedIds: (string | number)[];
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: string, checked: boolean) => void;
  format: (n: number) => string;
  onChangeStatus: (id: string, next: string) => void;
  onViewDetails: (invoice: Invoice) => void;
  onOpenPrint: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  statuses: string[];
  getStatusColor: (status: string) => string;
};

export default function InvoicesTable({ items, allSelected, selectedIds, onToggleAll, onToggleOne, format, onChangeStatus, onViewDetails, onOpenPrint, onDelete, statuses, getStatusColor }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
              <input id="invoice-select-all" name="invoice-select-all" type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} title="전체 선택" />
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              청구서 번호
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              건 축 주
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              프로젝트
            </th>
            <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              작 업 장
            </th>
            <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              청구 금액
            </th>
            <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              상&nbsp;&nbsp;&nbsp;&nbsp;태
            </th>
            <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              날&nbsp;&nbsp;&nbsp;&nbsp;짜
            </th>
            <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
              작&nbsp;&nbsp;&nbsp;&nbsp;업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
          {items.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-3 py-2 whitespace-nowrap">
                <input id={`invoice-select-${invoice.id}`} name={`invoice-select-${invoice.id}`} type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" checked={selectedIds.includes(invoice.id)} onChange={(e) => onToggleOne(invoice.id as string, e.target.checked)} title="선택" />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.id}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.dueDate}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">{invoice.client}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{invoice.project}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{invoice.workplaceAddress}</td>
              <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">{format(invoice.amount)}원</td>
              <td className="px-3 py-2 whitespace-nowrap text-center">
                <select
                  className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(invoice.status)} focus:outline-none focus:ring-0`}
                  value={invoice.status}
                  onChange={(e) => onChangeStatus(invoice.id as string, e.target.value)}
                  title="청구서 상태 변경"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{invoice.date}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                <div className="flex justify-center">
                  <Tooltip label="상세보기"><button onClick={() => onViewDetails(invoice)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mx-2" title="청구서 상세보기">🔍</button></Tooltip>
                  <Tooltip label="출력"><button onClick={() => onOpenPrint(invoice)} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mx-2" title="청구서 출력">🖨️</button></Tooltip>
                  <Tooltip label="삭제"><button onClick={() => onDelete(invoice.id as string)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mx-2" title="청구서 삭제">🗑️</button></Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

