import { useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext.impl';
import { Client } from '../types/domain';

export default function ClientList() {
  const { clients, setClients } = useApp();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const allVisibleIds = useMemo(() => (clients ?? []).map((c: Client) => c.id as number), [clients]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allVisibleIds.length;
  const toggleSelectAll = (checked: boolean) => setSelectedIds(checked ? allVisibleIds : []);
  const toggleSelectOne = (id: number, checked: boolean) => setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setClients((prev: Client[]) => prev.filter((c: Client) => !selectedIds.includes(c.id as number)));
    setSelectedIds([]);
    setShowConfirmDelete(false);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래처 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            청구서 발송 대상 거래처를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="btn-secondary"
              title="선택된 건축주 일괄 삭제"
            >
              🗑️ 선택 삭제({selectedIds.length})
            </button>
          )}
          <button className="btn-primary flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            신규 거래처
          </button>
        </div>
      </div>
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">선택된 {selectedIds.length}명의 건축주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    title="전체 선택"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연 락 처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업장 수
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(clients ?? []).map((c: Client) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedIds.includes(c.id as number)}
                      onChange={(e) => toggleSelectOne(c.id as number, e.target.checked)}
                      title="항목 선택"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.phone !== undefined && c.phone !== '') ? c.phone : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.address !== undefined && c.address !== '') ? c.address : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Array.isArray(c.projects) ? c.projects.length : 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Array.isArray(c.workplaces) ? c.workplaces.length : 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
