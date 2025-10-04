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
};

export default function InvoicesTable({ items, allSelected, selectedIds, onToggleAll, onToggleOne, format, onChangeStatus, onViewDetails, onOpenPrint, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} title="전체 선택" />
            </th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">청구서 번호</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">건축주</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">작업장</th>
            <th className="px-3 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">청구 금액</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">날짜</th>
            <th className="px-3 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">작업</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedIds.includes(invoice.id)} onChange={(e) => onToggleOne(invoice.id as string, e.target.checked)} title="선택" />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                <div className="text-xs text-gray-500">{invoice.dueDate}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-sm text-gray-900">{invoice.client}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{invoice.project}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{invoice.workplaceAddress}</td>
              <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{format(invoice.amount)}원</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <select className={"px-2 py-1 text-xs font-semibold rounded-full border-0 " + (invoice.status === "결제완료" ? "bg-green-100 text-green-800" : invoice.status === "발송됨" ? "bg-blue-100 text-blue-800" : invoice.status === "미결제" ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800") + " focus:outline-none focus:ring-0"} value={invoice.status} onChange={(e) => onChangeStatus(invoice.id as string, e.target.value)} title="청구서 상태 변경">
                  <option value="발송대기">발송대기</option>
                  <option value="발송됨">발송됨</option>
                  <option value="미결제">미결제</option>
                  <option value="결제완료">결제완료</option>
                </select>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{invoice.date}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                <div className="flex justify-center space-x-4">
                  <Tooltip label="상세보기"><button onClick={() => onViewDetails(invoice)} className="text-blue-600 hover:text-blue-900" title="청구서 상세보기">🔍</button></Tooltip>
                  <Tooltip label="출력"><button onClick={() => onOpenPrint(invoice)} className="text-green-600 hover:text-green-900" title="청구서 출력">🖨️</button></Tooltip>
                  <Tooltip label="삭제"><button onClick={() => onDelete(invoice.id as string)} className="text-red-600 hover:text-red-900" title="청구서 삭제">🗑️</button></Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

