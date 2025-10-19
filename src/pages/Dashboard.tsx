import { useMemo } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';

import { useApp } from '../contexts/AppContext.impl';

// Formatters
const formatKRW = (n: number) => {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('ko-KR').format(v) + '원';
};
const formatDate = (dateStr: string) => {
  if (dateStr.trim() === '') return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '.').replace(/\s/g, '');
};
const fromDbStatus = (dbStatus: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '검토중',
    'sent': '발송됨',
    'approved': '승인됨',
    'rejected': '거부됨',
    'pending': '발송대기',
    'paid': '결제완료',
    'overdue': '미결제'
  };
  return statusMap[dbStatus] ?? dbStatus;
};

// Constants

const TONE_COLORS = {
  indigo: 'bg-indigo-100 text-indigo-600',
  emerald: 'bg-emerald-100 text-emerald-600', 
  amber: 'bg-amber-100 text-amber-600',
  violet: 'bg-violet-100 text-violet-600'
};

// Components
interface KpiCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  tone: keyof typeof TONE_COLORS;
  isPrimary?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon: Icon, label, value, tone, isPrimary }) => {
  const bgColors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
    emerald: 'bg-green-100 dark:bg-green-900/30',
    amber: 'bg-orange-100 dark:bg-orange-900/30',
    violet: 'bg-blue-100 dark:bg-blue-900/30'
  };

  const iconBgColors = {
    indigo: 'bg-indigo-500 dark:bg-indigo-600',
    emerald: 'bg-green-500 dark:bg-green-600',
    amber: 'bg-orange-500 dark:bg-orange-600',
    violet: 'bg-blue-500 dark:bg-blue-600'
  };

  return (
    <div className={`${bgColors[tone]} rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 leading-snug">{label}</p>
          <p className={`font-bold text-gray-900 dark:text-gray-100 leading-tight ${(isPrimary === true) ? 'text-lg' : 'text-base'}`}>
            {value}
          </p>
        </div>
        <div className={`${iconBgColors[tone]} rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

interface StatusChipProps {
  status: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const koreanStatus = fromDbStatus(status);
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold ${
      koreanStatus === '결제완료' ? 'bg-success-100 dark:bg-success-900/50 text-success-700 dark:text-success-300 shadow-sm' :
      koreanStatus === '발송됨' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm' :
      koreanStatus === '발송대기' ? 'bg-warning-100 dark:bg-warning-900/50 text-warning-700 dark:text-warning-300 shadow-sm' :
      koreanStatus === '미결제' ? 'bg-danger-100 dark:bg-danger-900/50 text-danger-700 dark:text-danger-300 shadow-sm' :
      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm'
    }`}>
      {koreanStatus}
    </span>
  );
};

interface ListCardProps {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

const ListCard: React.FC<ListCardProps> = ({ title, icon: Icon, children }) => (
  <div className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 shadow-soft hover:shadow-card-hover border border-white/20 dark:border-gray-700/50 transition-all duration-300 ease-out hover:scale-[1.02]">
    {/* Glassmorphism Background */}
    <div className="absolute inset-0 bg-gradient-glass opacity-10 dark:opacity-5" />

    <div className="relative">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-2 text-white mr-3 flex items-center justify-center w-8 h-8">
          <Icon className="h-4 w-4 stroke-2" aria-hidden="true" />
        </div>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { invoices, estimates, clients } = useApp();
  const RECENT_INVOICES_LIMIT = 5; // eslint-disable-line no-magic-numbers
  const RECENT_ESTIMATES_LIMIT = 3; // eslint-disable-line no-magic-numbers
  const recentInvoices = useMemo(() => {
    const list = invoices.slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    return list.slice(0, RECENT_INVOICES_LIMIT);
  }, [invoices]);

  const recentEstimates = useMemo(() => {
    const list = estimates.slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    return list.slice(0, RECENT_ESTIMATES_LIMIT);
  }, [estimates]);

  const summary = useMemo(() => {
    const total = invoices.reduce((s: number, i) => s + (Number.isFinite(i.amount) ? Number(i.amount) : 0), 0);
    const paid = invoices
      .filter((i) => i.status === '결제완료')
      .reduce((s: number, i) => s + (Number.isFinite(i.amount) ? Number(i.amount) : 0), 0);
    const pending = total - paid;
    return { total, paid, pending };
  }, [invoices]);

  const kpiCards = [
    { 
      label: '전체 청구액', 
      value: formatKRW(summary.total), 
      icon: ChartBarIcon, 
      tone: 'indigo' as const,
      isPrimary: true
    },
    { 
      label: '결제완료', 
      value: formatKRW(summary.paid), 
      icon: CurrencyDollarIcon, 
      tone: 'emerald' as const
    },
    { 
      label: '미수금', 
      value: formatKRW(summary.pending), 
      icon: DocumentTextIcon, 
      tone: 'amber' as const
    },
    {
      label: '등록된 건축주',
      value: `${clients.length}명`,
      icon: UsersIcon,
      tone: 'violet' as const
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Header with tighter spacing */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          대시보드
        </h1>
        <p className="mt-2 text-base font-medium-light text-gray-600 dark:text-gray-300 leading-snug">
          현장 작업 현황과 청구 관리 상태를 한눈에 확인하세요.
        </p>
      </div>

      {/* Enhanced Stats Cards (tighter gaps) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {kpiCards.map((card, _index) => (
          <KpiCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            tone={card.tone}
            isPrimary={card.isPrimary}
          />
        ))}
      </div>

      {/* Enhanced Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ListCard title="최근 견적" icon={CalculatorIcon}>
          {recentEstimates.map((estimate) => {
            const koreanStatus = fromDbStatus(estimate.status);
            return (
              <div key={estimate.id} className="flex items-center justify-between py-2 px-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-gray-100/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-600/50 hover:shadow-sm transition-all duration-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{estimate.id} · {estimate.clientName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(estimate.date ?? '')} | {estimate.projectName}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  koreanStatus === '승인됨' ? 'text-success-600 dark:text-success-300 bg-success-50 dark:bg-success-900/50' :
                  koreanStatus === '검토중' ? 'text-warning-600 dark:text-warning-300 bg-warning-50 dark:bg-warning-900/50' :
                  'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
                }`}>
                  {koreanStatus}
                </span>
              </div>
            );
          })}
        </ListCard>

        <ListCard title="최근 청구서" icon={CurrencyDollarIcon}>
          {recentInvoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-2 px-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-gray-100/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-600/50 hover:shadow-sm transition-all duration-200">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {inv.id} · {inv.client}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {inv.project} · {formatKRW(inv.amount)}
                </p>
              </div>
              <StatusChip status={inv.status} />
            </div>
          ))}
        </ListCard>
      </div>
    </div>
  );
}
