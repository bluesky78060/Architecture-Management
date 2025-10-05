import { logger } from '../utils/logger';
import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

interface Stat {
  title: string;
  value: string;
  color: string;
  iconBg: string;
  icon: string;
  href?: string;
}

const Dashboard: React.FC = () => {
  const {
    invoices, clients,
    companyInfo, workItems, estimates, units, categories, stampImage,
    setCompanyInfo, setClients, setWorkItems, setInvoices, setEstimates, setUnits, setCategories, setStampImage
  } = useApp();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  
  const RECENT_ITEMS_LIMIT = 5;

  const JSON_INDENT_SPACES = 2;

  const formatCurrency = (n: number): string => `₩${(n ?? 0).toLocaleString()}원`;

  const recentInvoices = useMemo(() => {
    const list = (invoices ?? []).slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    return list.slice(0, RECENT_ITEMS_LIMIT);
  }, [invoices]);

  const total = useMemo(() => (invoices ?? []).reduce((s, i) => s + (i.amount ?? 0), 0), [invoices]);
  const paid = useMemo(() => (invoices ?? []).filter(i => i.status === '결제완료').reduce((s, i) => s + (i.amount ?? 0), 0), [invoices]);
  const pending = total - paid;

  const stats: Stat[] = [
    { title: '전체 청구액', value: formatCurrency(total), color: 'bg-blue-100', iconBg: 'bg-blue-500', icon: '📊' },
    { title: '미수금(요약)', value: formatCurrency(pending), color: 'bg-orange-100', iconBg: 'bg-orange-500', icon: '💰' },
    { title: '결제완료', value: formatCurrency(paid), color: 'bg-green-100', iconBg: 'bg-green-500', icon: '✅' },
    { title: '등록된 건축주', value: `${(clients ?? []).length}명`, color: 'bg-purple-100', iconBg: 'bg-purple-500', icon: '👥', href: '/clients' }
  ];

  return (
    <div className="p-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">청구서 발행 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const payload = {
                meta: { exportedAt: new Date().toISOString(), app: 'Construction Management System' },
                companyInfo, clients, workItems, invoices, estimates, units, categories, stampImage,
              };
              const blob = new Blob([JSON.stringify(payload, null, JSON_INDENT_SPACES)], { type: 'application/json;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              const stampStr = new Date().toISOString().replace(/[:.]/g, '-');
              a.href = url;
              a.download = `cms-backup-${stampStr}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex flex-col items-center justify-center w-24 h-24 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
            title="모든 데이터를 JSON으로 저장"
          >
            <span className="text-2xl text-blue-500 mb-1">💾</span>
            <span className="text-sm font-semibold text-gray-700">백업</span>
            <span className="text-xs text-gray-500">데이터 저장</span>
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json"
            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file === undefined) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.companyInfo !== undefined && data.companyInfo !== null) setCompanyInfo(data.companyInfo);
                if (Array.isArray(data.clients)) setClients(data.clients);
                if (Array.isArray(data.workItems)) setWorkItems(data.workItems);
                if (Array.isArray(data.invoices)) setInvoices(data.invoices);
                if (Array.isArray(data.estimates)) setEstimates(data.estimates);
                if (Array.isArray(data.units)) setUnits(data.units);
                if (Array.isArray(data.categories)) setCategories(data.categories);
                if (data.stampImage !== undefined) setStampImage(data.stampImage);
                alert('데이터 복원이 완료되었습니다.');
              } catch (err) {
                logger.error('복원 오류:', err);
                alert('복원 중 오류가 발생했습니다. 올바른 백업 파일인지 확인하세요.');
              } finally {
                if (restoreInputRef.current !== null) restoreInputRef.current.value = '';
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => restoreInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-24 h-24 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
            title="백업 JSON에서 복원"
          >
            <span className="text-2xl text-green-500 mb-1">♻️</span>
            <span className="text-sm font-semibold text-gray-700">복원</span>
            <span className="text-xs text-gray-500">데이터 복구</span>
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const valueSize = (
            stat.title === '전체 청구액' ||
            stat.title === '결제완료' ||
            stat.title === '미수금(요약)' ||
            stat.title === '등록된 건축주'
          ) ? 'text-base' : 'text-2xl';
          const Card = (
            <div className={`${stat.color} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <p className={`${valueSize} font-bold text-gray-900`}>{stat.value}</p>
                </div>
                <div className={`${stat.iconBg} rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
          return (
            <div key={index} className="rounded-lg">
              {stat.href !== undefined ? (
                <Link to={stat.href} aria-label={`${stat.title} 자세히 보기`} className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                  {Card}
                </Link>
              ) : (
                Card
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 문구 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md px-4 py-3">
        작업 종료 시 상단의 '백업' 버튼을 눌러 데이터를 보관하세요. 복원이 필요한 경우 '복원' 버튼을 통해 백업 파일을 선택하면 됩니다.
      </div>

      {/* 최근 청구서 / 최근 견적서 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 청구서 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">최근 청구서</h2>
            <Link to="/invoices" className="text-sm text-indigo-600 hover:text-indigo-800">더보기</Link>
          </div>
          <div className="px-6 py-4">
            {recentInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 청구서가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.client}</p>
                      <p className="text-sm text-gray-500">{invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        invoice.status === '결제완료' ? 'bg-green-100 text-green-800' :
                        invoice.status === '발송됨' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 최근 견적서 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">최근 견적서</h2>
            <Link to="/estimates" className="text-sm text-indigo-600 hover:text-indigo-800">더보기</Link>
          </div>
          <div className="px-6 py-4">
            {estimates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 견적서가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {estimates.slice(0, RECENT_ITEMS_LIMIT).map((estimate, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{estimate.clientName}</p>
                      <p className="text-sm text-gray-500">{estimate.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(estimate.totalAmount)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        estimate.status === '승인됨' ? 'bg-green-100 text-green-800' :
                        estimate.status === '작업 전환됨' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {estimate.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;