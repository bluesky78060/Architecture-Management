import { DocumentTextIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { Estimate } from '../../types/domain';

type Props = {
  items: Estimate[];
  format: (n: number) => string;
};

export default function StatsCards({ items, format }: Props) {
  const total = items.length;
  const approved = items.filter(e => e.status === '승인됨').length;
  const reviewing = items.filter(e => e.status === '검토중').length;
  const totalAmount = items.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-2">총 견적서</p>
            <p className="text-base font-bold text-gray-900">{total}건</p>
          </div>
          <div className="bg-indigo-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="bg-green-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-2">승인된 견적서</p>
            <p className="text-base font-bold text-gray-900">{approved}건</p>
          </div>
          <div className="bg-green-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="bg-yellow-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-2">검토 중인 견적서</p>
            <p className="text-base font-bold text-gray-900">{reviewing}건</p>
          </div>
          <div className="bg-orange-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <ClockIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="bg-purple-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-2">총 견적 금액</p>
            <p className="text-base font-bold text-gray-900">{format(totalAmount)}원</p>
          </div>
          <div className="bg-purple-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <CurrencyDollarIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

