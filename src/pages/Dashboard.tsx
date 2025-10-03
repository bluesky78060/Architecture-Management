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
const formatKRW = (n: number) => new Intl.NumberFormat('ko-KR').format(n || 0) + '원';
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).replace(/\./g, '.').replace(/\s/g, '');
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
    indigo: 'bg-indigo-100',
    emerald: 'bg-green-100', 
    amber: 'bg-orange-100',
    violet: 'bg-blue-100'
  };
  
  const iconBgColors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-green-500',
    amber: 'bg-orange-500', 
    violet: 'bg-blue-500'
  };

  return (
    <div className={`${bgColors[tone]} rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1 leading-snug">{label}</p>
          <p className={`font-bold text-gray-900 leading-tight ${isPrimary ? 'text-lg' : 'text-base'}`}>
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

const StatusChip: React.FC<StatusChipProps> = ({ status }) => (
  <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold ${
    status === '결제완료' ? 'bg-success-100 text-success-700 shadow-sm' :
    status === '발송됨' ? 'bg-primary-100 text-primary-700 shadow-sm' :
    status === '발송대기' ? 'bg-warning-100 text-warning-700 shadow-sm' :
    status === '미결제' ? 'bg-danger-100 text-danger-700 shadow-sm' :
    'bg-gray-100 text-gray-700 shadow-sm'
  }`}>
    {status}
  </span>
);

interface ListCardProps {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

const ListCard: React.FC<ListCardProps> = ({ title, icon: Icon, children }) => (
  <div className="group relative overflow-hidden bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-soft hover:shadow-card-hover border border-white/20 transition-all duration-300 ease-out hover:scale-[1.02]">
    {/* Glassmorphism Background */}
    <div className="absolute inset-0 bg-gradient-glass opacity-10" />
    
    <div className="relative">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
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
  const { invoices, estimates } = useApp();
  const recentInvoices = useMemo(() => {
    const list = (invoices || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list.slice(0, 5);
  }, [invoices]);

  const recentEstimates = useMemo(() => {
    const list = (estimates || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list.slice(0, 3);
  }, [estimates]);

  const summary = useMemo(() => {
    const total = (invoices || []).reduce((s: number, i) => s + (i.amount || 0), 0);
    const paid = (invoices || []).filter((i) => i.status === '결제완료').reduce((s: number, i) => s + (i.amount || 0), 0);
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
      value: '4명',
      icon: UsersIcon,
      tone: 'violet' as const
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Header with tighter spacing */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          대시보드
        </h1>
        <p className="mt-2 text-base font-medium-light text-gray-600 leading-snug">
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
          {recentEstimates.map((estimate) => (
            <div key={estimate.id} className="flex items-center justify-between py-2 px-4 bg-white/50 rounded-2xl border border-gray-100/50 hover:bg-white/80 hover:shadow-sm transition-all duration-200">
              <div>
                <p className="text-sm font-semibold text-gray-900">{estimate.id} · {estimate.clientName}</p>
                <p className="text-xs text-gray-600">{formatDate(estimate.date || '')} | {estimate.projectName}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                estimate.status === '승인됨' ? 'text-success-600 bg-success-50' :
                estimate.status === '검토중' ? 'text-warning-600 bg-warning-50' :
                'text-gray-600 bg-gray-50'
              }`}>
                {estimate.status}
              </span>
            </div>
          ))}
        </ListCard>

        <ListCard title="최근 청구서" icon={CurrencyDollarIcon}>
          {recentInvoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-2 px-4 bg-white/50 rounded-2xl border border-gray-100/50 hover:bg-white/80 hover:shadow-sm transition-all duration-200">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {inv.id} · {inv.client}
                </p>
                <p className="text-xs text-gray-600">
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
