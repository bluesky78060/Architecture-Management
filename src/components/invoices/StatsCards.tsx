import { DocumentTextIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import type { Invoice } from '../../types/domain';

type Props = {
  invoices: Invoice[];
};

export default function StatsCards({ invoices }: Props) {
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((s, i) => {
    const n = Number(i.amount);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
  const paidCount = invoices.filter(i => i.status === '결제완료').length;
  const unpaidCount = invoices.filter(i => i.status === '미결제').length;
  const Card = ({ title, value, icon: Icon, bg, iconBg }: {
    title: string;
    value: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    bg: string;
    iconBg: string;
  }) => (
    <div className={`${bg} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">{title}</p>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`${iconBg} rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12`}>
          <Icon className="h-6 w-6" aria-hidden={true} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card title="총 청구서" value={`${totalCount}건`} icon={DocumentTextIcon} bg="bg-indigo-100 dark:bg-indigo-900/30" iconBg="bg-indigo-500 dark:bg-indigo-600" />
      <Card title="결제완료" value={`${paidCount}건`} icon={CheckCircleIcon} bg="bg-green-100 dark:bg-green-900/30" iconBg="bg-green-500 dark:bg-green-600" />
      <Card title="미결제" value={`${unpaidCount}건`} icon={ClockIcon} bg="bg-orange-100 dark:bg-orange-900/30" iconBg="bg-orange-500 dark:bg-orange-600" />
      <Card title="총 청구 금액" value={`₩${totalAmount.toLocaleString()}원`} icon={CurrencyDollarIcon} bg="bg-blue-100 dark:bg-blue-900/30" iconBg="bg-blue-500 dark:bg-blue-600" />
    </div>
  );
}
