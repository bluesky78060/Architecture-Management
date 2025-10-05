import { PlusIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function ProjectList() {
  const CURRENCY_DIVISOR_100M = 100000000;
  const mockProjects = [
    {
      project_id: 1,
      project_name: '아파트 신축공사 A동',
      client_name: '현대건설',
      address: '서울시 강남구',
      contract_amount: 5000000000,
      vat_mode: 'separate',
    },
    {
      project_id: 2,
      project_name: '오피스텔 B동 마감공사',
      client_name: 'GS건설',
      address: '경기도 성남시',
      contract_amount: 2300000000,
      vat_mode: 'included',
    },
  ];

  const formatCurrency = (amount: number) => {
    return `₩${(amount / CURRENCY_DIVISOR_100M).toFixed(1)}억`;
  };

  const getVATModeLabel = (mode: string) => {
    switch (mode) {
      case 'included': return 'VAT 포함';
      case 'separate': return 'VAT 별도';
      case 'exempt': return '면세';
      default: return mode;
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">현장 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            진행 중인 현장과 계약 정보를 관리합니다.
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          신규 현장
        </button>
      </div>

      <div className="card">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현장명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  발주처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  위치
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockProjects.map((project) => (
                <tr key={project.project_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {project.project_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                    {formatCurrency(project.contract_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-medium rounded-full
                      ${project.vat_mode === 'separate' 
                        ? 'bg-blue-100 text-blue-800' 
                        : project.vat_mode === 'included'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {getVATModeLabel(project.vat_mode)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-gray-600 hover:text-gray-900" title="상세보기">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-900" title="수정">
                        <PencilIcon className="h-4 w-4" />
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
