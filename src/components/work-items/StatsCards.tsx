import { WrenchScrewdriverIcon, CheckCircleIcon, ExclamationTriangleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { WorkItem } from '../../types/domain';

type Props = {
  filteredWorkItems: WorkItem[];
  format: (n: number) => string;
  getLaborCost: (item: WorkItem) => number;
};

export default function StatsCards({ filteredWorkItems, format, getLaborCost }: Props) {
  const total = filteredWorkItems.length;
  const completed = filteredWorkItems.filter(i => i.status === '완료').length;
  const inProgress = filteredWorkItems.filter(i => i.status === '진행중').length;
  const totalAmount = filteredWorkItems.reduce((sum, item) => {
    const priceRaw = Number(item.defaultPrice);
    const qtyRaw = Number(item.quantity);
    const price = Number.isFinite(priceRaw) ? priceRaw : 0;
    const qty = Number.isFinite(qtyRaw) ? qtyRaw : 1;
    return sum + price * qty + getLaborCost(item);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">총 작업 항목</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{total}건</p>
          </div>
          <div className="bg-blue-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <WrenchScrewdriverIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="bg-green-100 dark:bg-green-900/30 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">완료된 작업</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{completed}건</p>
          </div>
          <div className="bg-green-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">진행 중인 작업</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{inProgress}건</p>
          </div>
          <div className="bg-purple-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">총 작업 금액</p>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{format(totalAmount)}원</p>
          </div>
          <div className="bg-orange-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
            <CurrencyDollarIcon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
