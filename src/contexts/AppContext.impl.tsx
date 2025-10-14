/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-explicit-any, no-console */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { CompanyInfo, Client, WorkItem, Invoice, Estimate, UnitName, CategoryName } from '../types/domain';

export interface AppContextValue {
  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  estimates: Estimate[];
  setEstimates: React.Dispatch<React.SetStateAction<Estimate[]>>;
  units: UnitName[];
  setUnits: React.Dispatch<React.SetStateAction<UnitName[]>>;
  categories: CategoryName[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryName[]>>;
  stampImage: string | null;
  setStampImage: React.Dispatch<React.SetStateAction<string | null>>;
  getCompletedWorkItems: () => WorkItem[];
  getCompletedWorkItemsByClient: (clientId: number) => WorkItem[];
  addWorkItemToInvoice: (workItem: WorkItem, quantity?: number | null, unitPrice?: number | null) => any;
  convertEstimateToWorkItems: (estimateId: string) => WorkItem[];
  loading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};

const defaultCompanyInfo: CompanyInfo = {
  name: '한국건설',
  businessNumber: '123-45-67890',
  address: '서울시 강남구 테헤란로 123',
  phone: '02-1234-5678',
  email: 'info@hangeonconstruction.com',
  representative: '홍길동',
  bankAccount: '신한은행 110-123-456789',
  accountHolder: '한국건설(주)'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [clients, setClients] = useState<Client[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [units, setUnits] = useState<UnitName[]>(['식', '㎡', '개', '톤', 'm', 'kg', '회', '일']);
  const [categories, setCategories] = useState<CategoryName[]>(['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '내부공사', '기타']);
  const [stampImage, setStampImage] = useState<string | null>(null);

  // 사용자 인증 확인
  useEffect(() => {
    const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
      (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

    const checkAuth = async () => {
      if (!supabase) {
        setError('Supabase가 초기화되지 않았습니다');
        setLoading(false);
        return;
      }

      // 로그인 비활성화 모드면 인증 체크 건너뛰기
      if (LOGIN_DISABLED) {
        setUserId('dev-user-id'); // 개발용 임시 user_id
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setError('로그인이 필요합니다');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    if (!userId || !supabase) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Clients 로딩
        const { data: clientsData, error: clientsError } = await supabase!
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;

        const mappedClients: Client[] = (clientsData || []).map((c: any) => ({
          id: c.client_id,
          name: c.company_name || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          type: c.type || 'BUSINESS',
          business: c.type === 'BUSINESS' ? {
            businessName: c.company_name || '',
            representative: c.representative || '',
            businessNumber: c.business_number || '',
            businessType: '',
            businessItem: '',
            businessAddress: c.address || '',
            taxEmail: c.email || ''
          } : undefined,
          totalBilled: c.total_billed || 0,
          outstanding: c.outstanding || 0,
          notes: c.notes || ''
        }));

        setClients(mappedClients);

        // 도장 이미지 로딩
        const { loadStampImage } = await import('../utils/imageStorage');
        const loadedImage = await loadStampImage();
        setStampImage(loadedImage);

        setError(null);
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const getCompletedWorkItems = (): WorkItem[] => workItems.filter(i => i.status === '완료');

  const getCompletedWorkItemsByClient = (clientId: number): WorkItem[] =>
    workItems.filter(i => i.clientId === clientId && i.status === '완료');

  const addWorkItemToInvoice = (
    workItem: WorkItem,
    quantity: number | null = null,
    unitPrice: number | null = null
  ) => {
    const finalQuantity = quantity !== null ? quantity : (workItem.quantity ?? 1);
    const finalUnitPrice = unitPrice ?? (workItem.defaultPrice ?? 0);
    const lp = parseInt(String(workItem.laborPersons ?? 0), 10) || 0;
    const lr = parseInt(String(workItem.laborUnitRate ?? 0), 10) || 0;
    const lpg = parseInt(String(workItem.laborPersonsGeneral ?? 0), 10) || 0;
    const lrg = parseInt(String(workItem.laborUnitRateGeneral ?? 0), 10) || 0;
    const laborCost = (lp * lr) + (lpg * lrg);

    return {
      name: workItem.name,
      quantity: finalQuantity,
      unit: workItem.unit ?? '',
      unitPrice: finalUnitPrice,
      total: (finalQuantity * finalUnitPrice) + laborCost,
      laborPersons: lp,
      laborUnitRate: lr,
      laborPersonsGeneral: lpg,
      laborUnitRateGeneral: lrg,
      description: workItem.description ?? '',
      category: workItem.category ?? '',
      date: workItem.date ?? '',
      notes: workItem.notes ?? ''
    };
  };

  const convertEstimateToWorkItems = (estimateId: string): WorkItem[] => {
    const estimate = estimates.find(est => est.id === estimateId);
    if (!estimate) return [];

    const baseMax = Math.max(
      0,
      ...workItems.map(i => {
        const n = Number(i.id);
        return Number.isFinite(n) ? n : 0;
      })
    );

    const newItems: WorkItem[] = estimate.items.map((item, index) => ({
      id: baseMax + index + 1,
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      workplaceId: estimate.workplaceId,
      workplaceName: estimate.workplaceName,
      projectName: estimate.projectName,
      name: item.name,
      category: item.category,
      defaultPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      unit: item.unit,
      description: item.description,
      status: '예정',
      date: new Date().toISOString().split('T')[0],
      notes: item.notes ?? ''
    }));

    setWorkItems(prev => [...prev, ...newItems]);
    setEstimates(prev =>
      prev.map(est =>
        est.id === estimateId ? { ...est, status: '작업 전환됨' as any } : est
      )
    );

    return newItems;
  };

  // Clients 저장
  useEffect(() => {
    if (!userId || !supabase || loading) return;

    const saveClients = async () => {
      try {
        // 기존 데이터 삭제 후 재생성 (간단한 동기화)
        await supabase!.from('clients').delete().neq('client_id', 0);

        if (clients.length > 0) {
          const dbClients = clients.map(c => ({
            client_id: typeof c.id === 'number' ? c.id : parseInt(String(c.id)),
            company_name: c.business?.businessName || c.name,
            representative: c.business?.representative || '',
            business_number: c.business?.businessNumber || '',
            address: c.address || '',
            email: c.email || '',
            phone: c.phone || '',
            contact_person: '',
            type: c.type || 'BUSINESS',
            notes: c.notes || '',
            total_billed: c.totalBilled || 0,
            outstanding: c.outstanding || 0
          }));

          await supabase!.from('clients').insert(dbClients);
        }
      } catch (err) {
        console.error('건축주 저장 실패:', err);
      }
    };

    saveClients();
  }, [clients, userId, loading]);

  const value: AppContextValue = {
    companyInfo,
    setCompanyInfo,
    clients,
    setClients,
    workItems,
    setWorkItems,
    invoices,
    setInvoices,
    estimates,
    setEstimates,
    units,
    setUnits,
    categories,
    setCategories,
    stampImage,
    setStampImage,
    getCompletedWorkItems,
    getCompletedWorkItemsByClient,
    addWorkItemToInvoice,
    convertEstimateToWorkItems,
    loading,
    error
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
