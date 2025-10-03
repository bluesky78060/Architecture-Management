import { useMemo, useState } from 'react';
import { 
  PlusIcon, 
  DocumentArrowDownIcon, 
  EyeIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext.impl';
import { Invoice, InvoiceStatus } from '../types/domain';

export default function InvoiceList() {
  const { invoices, setInvoices } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const allVisibleIds = useMemo(() => (invoices || []).map((i: Invoice) => i.id), [invoices]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allVisibleIds.length;
  const toggleSelectAll = (checked: boolean) => setSelectedIds(checked ? allVisibleIds : []);
  const toggleSelectOne = (id: string, checked: boolean) => setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setInvoices((prev: Invoice[]) => prev.filter((inv: Invoice) => !selectedIds.includes(inv.id)));
    setSelectedIds([]);
    setShowConfirmDelete(false);
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '발송대기': return 'bg-yellow-100 text-yellow-800';
      case '발송됨': return 'bg-blue-100 text-blue-800';
      case '미결제': return 'bg-orange-100 text-orange-800';
      case '결제완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChangeStatus = (id: string, next: string) => {
    setInvoices((prev: Invoice[]) => prev.map((inv: Invoice) => inv.id === id ? { ...inv, status: next as InvoiceStatus } : inv));
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">청구서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            작업 내역을 기반으로 청구서를 생성하고 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="btn-secondary"
              title="선택된 청구서 일괄 삭제"
            >
              🗑️ 선택 삭제({selectedIds.length})
            </button>
          )}
          <button className="btn-primary flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          청구서 생성
          </button>
        </div>
      </div>

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">선택된 {selectedIds.length}개의 청구서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowConfirmDelete(false)}>취소</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    title="전체 선택"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  청구서 번호
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래처</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">청구일자</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(invoices || []).map((invoice: Invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedIds.includes(invoice.id)}
                      onChange={(e) => toggleSelectOne(invoice.id, e.target.checked)}
                      title="항목 선택"
                    />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.date}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{invoice.project}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{invoice.client}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <select
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      value={invoice.status}
                      onChange={(e) => handleChangeStatus(invoice.id, e.target.value)}
                      title="청구서 상태 변경"
                    >
                      <option value="발송대기">발송대기</option>
                      <option value="발송됨">발송됨</option>
                      <option value="미결제">미결제</option>
                      <option value="결제완료">결제완료</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-gray-600 hover:text-gray-900" title="미리보기">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-900" title="수정">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="PDF 다운로드">
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">₩123,300,000</div>
            <div className="text-sm text-gray-500">이번 달 총 청구액</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">₩89,500,000</div>
            <div className="text-sm text-gray-500">입금 완료</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">₩33,800,000</div>
            <div className="text-sm text-gray-500">미수금</div>
          </div>
        </div>
      </div>
    </div>
  );
}
