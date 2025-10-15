/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-explicit-any, no-console */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { CompanyInfo, Client, WorkItem, Invoice, Estimate, UnitName, CategoryName } from '../types/domain';

// Timing constants for data synchronization
const INITIAL_LOAD_GRACE_PERIOD_MS = 100;
const DEBOUNCE_DELAY_MS = 1000;

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
        // 개발용 UUID (nil UUID)
        setUserId('00000000-0000-0000-0000-000000000000');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        // 인증 없이도 기본 사용자로 작동 (개발/테스트 모드)
        // 개발용 UUID (nil UUID)
        setUserId('00000000-0000-0000-0000-000000000000');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 자동 로그아웃 - 1시간 동안 활동 없으면 로그아웃
  useEffect(() => {
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE = 60;
    const MILLISECONDS_PER_SECOND = 1000;
    const INACTIVITY_TIMEOUT_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND; // 1시간 (밀리초)
    let timeoutId: NodeJS.Timeout;

    const handleLogout = async () => {
      if (!supabase) return;

      const LOGIN_DISABLED = (process.env.REACT_APP_DISABLE_LOGIN === '1') ||
        (typeof window !== 'undefined' && window.localStorage !== null && window.localStorage.getItem('CMS_DISABLE_LOGIN') === '1');

      if (LOGIN_DISABLED) return; // 로그인 비활성화 모드면 자동 로그아웃 안 함

      try {
        await supabase.auth.signOut();
        setUserId(null);
        setError('비활성 상태로 인해 자동 로그아웃되었습니다. 다시 로그인해주세요.');

        // 페이지 새로고침하여 로그인 화면으로 이동
        window.location.reload();
      } catch (err) {
        console.error('Auto logout failed:', err);
      }
    };

    const resetTimer = () => {
      // 기존 타이머 제거
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 새로운 타이머 설정
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);
    };

    // 사용자 활동 감지 이벤트들
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // 초기 타이머 설정
    resetTimer();

    // 클린업: 이벤트 리스너 제거 및 타이머 클리어
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [userId]);

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

        if (clientsError) {
          console.error('❌ Clients 로딩 실패:', clientsError);
          throw clientsError;
        }

        const mappedClients: Client[] = (clientsData || []).map((c: any) => ({
          id: c.client_id,
          name: c.company_name || '',
          phone: c.phone || '',
          mobile: c.mobile || '',
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
          workplaces: c.workplaces || [],
          projects: c.projects || [],
          totalBilled: c.total_billed || 0,
          outstanding: c.outstanding || 0,
          notes: c.notes || ''
        }));

        setClients(mappedClients);

        // Work Items 로딩
        const { data: workItemsData, error: workItemsError } = await supabase!
          .from('work_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (workItemsError) throw workItemsError;

        // Status 영어 -> 한글 변환 함수
        const fromDbStatus = (status: string): string => {
          const statusMap: Record<string, string> = {
            'planned': '예정',
            'in_progress': '진행중',
            'completed': '완료',
            'on_hold': '보류',
            'cancelled': '취소',
          };
          return statusMap[status] ?? '예정';
        };

        const mappedWorkItems: WorkItem[] = (workItemsData || []).map((w: any) => ({
          id: w.work_item_id,
          clientId: w.client_id,
          clientName: w.client_name || '',
          workplaceId: w.workplace_id,
          workplaceName: w.workplace_name || '',
          projectName: w.project_name || '',
          name: w.name,
          category: w.category || '',
          defaultPrice: w.default_price || 0,
          quantity: w.quantity || 0,
          unit: w.unit || '',
          description: w.description || '',
          status: fromDbStatus(w.status),
          date: w.date || '',
          notes: w.notes || '',
          laborPersons: w.labor_persons || 0,
          laborUnitRate: w.labor_unit_rate || 0,
          laborPersonsGeneral: w.labor_persons_general || 0,
          laborUnitRateGeneral: w.labor_unit_rate_general || 0
        }));

        setWorkItems(mappedWorkItems);

        // Estimates 로딩
        const { data: estimatesData, error: estimatesError } = await supabase!
          .from('estimates')
          .select(`
            *,
            estimate_items (*)
          `)
          .order('created_at', { ascending: false });

        if (estimatesError) throw estimatesError;

        const mappedEstimates: Estimate[] = (estimatesData || []).map((e: any) => ({
          id: e.estimate_id,
          clientId: e.client_id,
          clientName: e.client_name || '',
          workplaceId: e.workplace_id,
          workplaceName: e.workplace_name || '',
          projectName: e.project_name || '',
          title: e.project_name || '',
          status: e.status || '작성중',
          validUntil: e.valid_until || '',
          totalAmount: e.total_amount || 0,
          items: (e.estimate_items || []).map((item: any) => ({
            name: item.name,
            category: item.category || '',
            quantity: item.quantity || 0,
            unit: item.unit || '',
            unitPrice: item.unit_price || 0,
            total: item.total || 0,
            description: item.description || '',
            notes: item.notes || ''
          }))
        }));

        setEstimates(mappedEstimates);

        // Invoices 로딩
        const { data: invoicesData, error: invoicesError } = await supabase!
          .from('invoices')
          .select(`
            *,
            invoice_items (*)
          `)
          .order('created_at', { ascending: false });

        if (invoicesError) throw invoicesError;

        const mappedInvoices: Invoice[] = (invoicesData || []).map((inv: any) => ({
          id: inv.invoice_id,
          client: inv.client_name || '',
          project: inv.project_name || '',
          workplaceAddress: inv.workplace_address || '',
          amount: inv.amount || 0,
          status: inv.status || '발송대기',
          date: inv.invoice_date || '',
          dueDate: inv.due_date || '',
          workItems: (inv.invoice_items || []).map((item: any) => ({
            name: item.name,
            quantity: item.quantity || 0,
            unit: item.unit || '',
            unitPrice: item.unit_price || 0,
            total: item.total || 0,
            notes: item.notes || '',
            date: item.date || '',
            category: item.category || '',
            description: item.description || '',
            laborPersons: item.labor_persons || 0,
            laborUnitRate: item.labor_unit_rate || 0,
            laborPersonsGeneral: item.labor_persons_general || 0,
            laborUnitRateGeneral: item.labor_unit_rate_general || 0
          }))
        }));

        setInvoices(mappedInvoices);

        // Company Info 로딩
        const { data: companyData, error: companyError } = await supabase!
          .from('company_info')
          .select('*')
          .limit(1)
          .single();

        if (!companyError && companyData) {
          setCompanyInfo({
            name: companyData.company_name,
            businessNumber: companyData.business_number || '',
            address: companyData.address || '',
            phone: companyData.phone || '',
            email: companyData.email || '',
            representative: companyData.representative || '',
            bankAccount: companyData.bank_account || '',
            accountHolder: companyData.account_holder || ''
          });
        }

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
        // 초기 로딩 완료 표시
        setTimeout(() => setIsInitialLoad(false), INITIAL_LOAD_GRACE_PERIOD_MS);
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

  // Clients 저장 (디바운싱 적용)
  useEffect(() => {
    if (!userId || !supabase || loading || isInitialLoad) return;

    const timer = setTimeout(async () => {
      try {
        // 기존 데이터 삭제 후 재생성 (간단한 동기화)
        await supabase!.from('clients').delete().eq('user_id', userId);

        if (clients.length > 0) {
          const dbClients = clients.map(c => ({
            user_id: userId,
            company_name: c.business?.businessName || c.name,
            representative: c.business?.representative || '',
            business_number: c.business?.businessNumber || '',
            address: c.address || '',
            email: c.email || '',
            phone: c.phone || '',
            mobile: c.mobile || '',
            contact_person: c.type === 'PERSON' ? c.name : (c.business?.representative || ''),
            type: c.type || 'BUSINESS',
            notes: c.notes || '',
            workplaces: c.workplaces || [],
            projects: c.projects || [],
            total_billed: c.totalBilled || 0,
            outstanding: c.outstanding || 0
          }));

          const { error } = await supabase!.from('clients').insert(dbClients);
          if (error) {
            console.error('건축주 저장 오류:', error);
          }
        }
      } catch (err) {
        console.error('건축주 저장 실패:', err);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [clients, userId, loading, isInitialLoad]);

  // Company Info 저장 (디바운싱 적용)
  useEffect(() => {
    if (!userId || !supabase || loading || isInitialLoad) return;

    const timer = setTimeout(async () => {
      try {
        await supabase!
          .from('company_info')
          .upsert({
            user_id: userId,
            company_name: companyInfo.name,
            business_number: companyInfo.businessNumber,
            address: companyInfo.address,
            phone: companyInfo.phone,
            email: companyInfo.email,
            representative: companyInfo.representative,
            bank_account: companyInfo.bankAccount,
            account_holder: companyInfo.accountHolder
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('회사 정보 저장 실패:', err);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [companyInfo, userId, loading, isInitialLoad]);

  // Work Items 저장 (디바운싱 적용)
  useEffect(() => {
    if (!userId || !supabase || loading || isInitialLoad) return;

    const timer = setTimeout(async () => {
      try {
        await supabase!.from('work_items').delete().eq('user_id', userId);

        if (workItems.length > 0) {
          const dbWorkItems = workItems.map(w => ({
            user_id: userId,
            client_id: w.clientId,
            client_name: w.clientName,
            workplace_id: w.workplaceId,
            workplace_name: w.workplaceName,
            project_name: w.projectName,
            name: w.name,
            category: w.category || null,
            default_price: w.defaultPrice || 0,
            quantity: w.quantity || 0,
            unit: w.unit || null,
            description: w.description || null,
            status: w.status || '예정',
            date: w.date || null,
            notes: w.notes || null,
            labor_persons: w.laborPersons || 0,
            labor_unit_rate: w.laborUnitRate || 0,
            labor_persons_general: w.laborPersonsGeneral || 0,
            labor_unit_rate_general: w.laborUnitRateGeneral || 0
          }));

          const { error } = await supabase!.from('work_items').insert(dbWorkItems);
          if (error) {
            console.error('작업 항목 저장 오류:', error);
          }
        }
      } catch (err) {
        console.error('작업 항목 저장 실패:', err);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [workItems, userId, loading, isInitialLoad]);

  // Estimates 저장 (디바운싱 적용)
  useEffect(() => {
    if (!userId || !supabase || loading || isInitialLoad) return;

    const timer = setTimeout(async () => {
      try {
        await supabase!.from('estimate_items').delete().match({ user_id: userId });
        await supabase!.from('estimates').delete().eq('user_id', userId);

        if (estimates.length > 0) {
          for (const estimate of estimates) {
            const { data: estimateData, error: estError } = await supabase!
              .from('estimates')
              .insert({
                user_id: userId,
                client_id: estimate.clientId,
                client_name: estimate.clientName,
                workplace_id: estimate.workplaceId,
                workplace_name: estimate.workplaceName,
                project_name: estimate.projectName,
                status: estimate.status,
                valid_until: estimate.validUntil || null,
                total_amount: estimate.totalAmount
              })
              .select()
              .single();

            if (estError) {
              console.error('견적서 저장 오류:', estError);
              continue;
            }

            if (estimateData && estimate.items.length > 0) {
              const items = estimate.items.map(item => ({
                user_id: userId,
                estimate_id: estimateData.estimate_id,
                name: item.name,
                category: item.category || null,
                quantity: item.quantity || 0,
                unit: item.unit || null,
                unit_price: item.unitPrice || 0,
                total: item.total || 0,
                description: item.description || null,
                notes: item.notes || null
              }));

              const { error: itemsError } = await supabase!.from('estimate_items').insert(items);
              if (itemsError) {
                console.error('견적서 항목 저장 오류:', itemsError);
              }
            }
          }
        }
      } catch (err) {
        console.error('견적서 저장 실패:', err);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [estimates, userId, loading, isInitialLoad]);

  // Invoices 저장 (디바운싱 적용)
  useEffect(() => {
    if (!userId || !supabase || loading || isInitialLoad) return;

    const timer = setTimeout(async () => {
      try {
        await supabase!.from('invoice_items').delete().match({ user_id: userId });
        await supabase!.from('invoices').delete().eq('user_id', userId);

        if (invoices.length > 0) {
          for (const invoice of invoices) {
            const { data: invoiceData, error: invError } = await supabase!
              .from('invoices')
              .insert({
                user_id: userId,
                client_name: invoice.client,
                project_name: invoice.project,
                workplace_address: invoice.workplaceAddress,
                amount: invoice.amount,
                status: invoice.status,
                invoice_date: invoice.date,
                due_date: invoice.dueDate || null
              })
              .select()
              .single();

            if (invError) {
              console.error('청구서 저장 오류:', invError);
              continue;
            }

            if (invoiceData && invoice.workItems.length > 0) {
              const items = invoice.workItems.map(item => ({
                user_id: userId,
                invoice_id: invoiceData.invoice_id,
                name: item.name,
                quantity: item.quantity || 0,
                unit: item.unit || null,
                unit_price: item.unitPrice || 0,
                total: item.total || 0,
                notes: item.notes || null,
                date: item.date || null,
                category: item.category || null,
                description: item.description || null,
                labor_persons: item.laborPersons || 0,
                labor_unit_rate: item.laborUnitRate || 0,
                labor_persons_general: item.laborPersonsGeneral || 0,
                labor_unit_rate_general: item.laborUnitRateGeneral || 0
              }));

              const { error: itemsError } = await supabase!.from('invoice_items').insert(items);
              if (itemsError) {
                console.error('청구서 항목 저장 오류:', itemsError);
              }
            }
          }
        }
      } catch (err) {
        console.error('청구서 저장 실패:', err);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [invoices, userId, loading, isInitialLoad]);

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
