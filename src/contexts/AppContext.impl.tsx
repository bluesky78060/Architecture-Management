import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MS_IN_SECOND } from '../constants/units';
import { storage } from '../services/storage';
import { scheduleMirror } from '../services/xlsxMirror';
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
  addWorkItemToInvoice: (workItem: WorkItem, quantity?: number | null, unitPrice?: number | null) => {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    laborPersons: number;
    laborUnitRate: number;
    laborPersonsGeneral: number;
    laborUnitRateGeneral: number;
    description: string;
    category: string;
    date: string;
    notes: string;
  };
  convertEstimateToWorkItems: (estimateId: string) => WorkItem[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (ctx === undefined) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};

const STORAGE_KEYS = {
  COMPANY_INFO: 'constructionApp_companyInfo',
  CLIENTS: 'constructionApp_clients',
  WORK_ITEMS: 'constructionApp_workItems',
  INVOICES: 'constructionApp_invoices',
  ESTIMATES: 'constructionApp_estimates',
  UNITS: 'constructionApp_units',
  CATEGORIES: 'constructionApp_categories',
  STAMP_IMAGE: 'constructionApp_stampImage',
} as const;

const loadFromStorage = <T,>(key: string, defaultValue: T): T => storage.getItem<T>(key, defaultValue);
const saveToStorage = <T,>(key: string, data: T): void => storage.setItem<T>(key, data);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const defaultCompanyInfo: CompanyInfo = {
    name: '한국건설', businessNumber: '123-45-67890', address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678', email: 'info@hangeonconstruction.com', representative: '홍길동',
    bankAccount: '신한은행 110-123-456789', accountHolder: '한국건설(주)'
  };

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => loadFromStorage(STORAGE_KEYS.COMPANY_INFO, defaultCompanyInfo));
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage(STORAGE_KEYS.CLIENTS, [] as Client[]));
  const [workItems, setWorkItems] = useState<WorkItem[]>(() => loadFromStorage(STORAGE_KEYS.WORK_ITEMS, [] as WorkItem[]));
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.INVOICES, [] as Invoice[]);
    // 샘플 데이터가 없으면 추가
    if (stored.length === 0) {
      return [
        {
          id: 'INV-2024-003',
          client: '이민호',
          project: '내부 칸막이',
          workplaceAddress: '서울시 강남구 테헤란로 123',
          amount: 5800000,
          status: '발송대기',
          date: '2024-09-30',
          workItems: [
            {
              name: '내부 칸막이',
              quantity: 30,
              unit: '',
              unitPrice: 120000,
              total: 3600000,
              notes: '소방 구획 준수 필요한 범위',
              date: '',
              category: '내부공사',
              description: '내부 칸막이벽 설치',
              laborPersons: '',
              laborUnitRate: '',
              laborPersonsGeneral: '',
              laborUnitRateGeneral: '',
            },
            {
              name: '전기공사',
              quantity: 1,
              unit: '',
              unitPrice: 1500000,
              total: 1500000,
              notes: '전원 융합 시 전원인 범위',
              date: '',
              category: '설비공사',
              description: '전기 배선 및 조명 설치',
              laborPersons: '',
              laborUnitRate: '',
              laborPersonsGeneral: '',
              laborUnitRateGeneral: '',
            },
            {
              name: '마감재 설치',
              quantity: 1,
              unit: '',
              unitPrice: 700000,
              total: 700000,
              notes: '방화 지진 사용 범위',
              date: '',
              category: '마감공사',
              description: '천장 및 벽면 마감재 설치',
              laborPersons: '',
              laborUnitRate: '',
              laborPersonsGeneral: '',
              laborUnitRateGeneral: '',
            },
          ],
        },
        {
          id: 'INV-2025-004',
          client: '정수진',
          project: '화장실 설치',
          workplaceAddress: '부산시 해운대구 해운대로 456',
          amount: 2330000,
          status: '발송대기',
          date: '2025-10-03',
          workItems: [
            {
              name: '화장실 철거',
              quantity: 1,
              unit: '식',
              unitPrice: 500000,
              total: 1100000,
              notes: '방수 지전 상태 확인인 범위',
              date: '2024-08-15',
              category: '철거공사',
              description: '기존 화장실 철거 및 폐기물 처리',
              laborPersons: 2,
              laborUnitRate: 150000,
              laborPersonsGeneral: 2,
              laborUnitRateGeneral: 100000,
            },
            {
              name: '화장실 설치',
              quantity: 1,
              unit: '식',
              unitPrice: 1000000,
              total: 1230000,
              notes: '급수 압력 대응 수도 압등',
              date: '2024-08-22',
              category: '설비공사',
              description: '신규 화장실 설치 및 배관 작업',
              laborPersons: 1,
              laborUnitRate: 180000,
              laborPersonsGeneral: 1,
              laborUnitRateGeneral: 50000,
            },
          ],
        },
      ];
    }
    return stored;
  });
  const [estimates, setEstimates] = useState<Estimate[]>(() => loadFromStorage(STORAGE_KEYS.ESTIMATES, [] as Estimate[]));
  const [units, setUnits] = useState<UnitName[]>(() => loadFromStorage(STORAGE_KEYS.UNITS, ['식', '㎡', '개', '톤', 'm', 'kg', '회', '일']));
  const [categories, setCategories] = useState<CategoryName[]>(() => loadFromStorage(STORAGE_KEYS.CATEGORIES, ['토목공사', '구조공사', '철거공사', '마감공사', '설비공사', '내부공사', '기타']));
  // stampImage는 useEffect에서 암호화된 저장소로부터 비동기 로드
  const [stampImage, setStampImage] = useState<string | null>(null);

  // 초기 로딩: 암호화된 도장 이미지 불러오기
  useEffect(() => {
    (async () => {
      try {
        const { loadStampImage } = await import('../utils/imageStorage');
        const loadedImage = loadStampImage();
        setStampImage(loadedImage);
      } catch (error) {
        // 로딩 실패 시 null 유지
      }
    })();
  }, []);

  const getCompletedWorkItems = (): WorkItem[] => workItems.filter(i => i.status === '완료');
  const getCompletedWorkItemsByClient = (clientId: number): WorkItem[] => workItems.filter(i => i.clientId === clientId && i.status === '완료');

  const addWorkItemToInvoice = (workItem: WorkItem, quantity: number | null = null, unitPrice: number | null = null) => {
    const finalQuantity = quantity !== null ? quantity : (workItem.quantity ?? 1);
    const finalUnitPrice = unitPrice ?? (workItem.defaultPrice ?? 0);
    const lpParsed = parseInt(String(workItem.laborPersons ?? 0), 10);
    const lrParsed = parseInt(String(workItem.laborUnitRate ?? 0), 10);
    const lpgParsed = parseInt(String(workItem.laborPersonsGeneral ?? 0), 10);
    const lrgParsed = parseInt(String(workItem.laborUnitRateGeneral ?? 0), 10);
    const lp = Number.isNaN(lpParsed) ? 0 : lpParsed;
    const lr = Number.isNaN(lrParsed) ? 0 : lrParsed;
    const lpg = Number.isNaN(lpgParsed) ? 0 : lpgParsed;
    const lrg = Number.isNaN(lrgParsed) ? 0 : lrgParsed;
    const laborCost = (lp * lr) + (lpg * lrg);
    return {
      name: workItem.name, quantity: finalQuantity, unit: workItem.unit ?? '',
      unitPrice: finalUnitPrice, total: (finalQuantity * finalUnitPrice) + laborCost,
      laborPersons: lp, laborUnitRate: lr, laborPersonsGeneral: lpg, laborUnitRateGeneral: lrg,
      description: workItem.description ?? '', category: workItem.category ?? '', date: workItem.date ?? '', notes: workItem.notes ?? ''
    };
  };

  useEffect(() => { saveToStorage(STORAGE_KEYS.COMPANY_INFO, companyInfo); }, [companyInfo]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CLIENTS, clients); }, [clients]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.WORK_ITEMS, workItems); }, [workItems]);
  useEffect(() => {
    const cleaned = Array.isArray(invoices)
      ? invoices.map(inv => ({
          ...inv,
          workItems: (Array.isArray(inv.workItems) ? inv.workItems : []).filter(item => {
            const name = String(item?.name ?? '');
            return !name.includes('일반: 일반') && !name.includes('숙련: 숙련') && !name.includes('인부임:') && !name.includes('일반 인부') && !name.includes('숙련 인부');
          }),
        }))
      : invoices;
    saveToStorage(STORAGE_KEYS.INVOICES, cleaned);
  }, [invoices]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ESTIMATES, estimates); }, [estimates]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.UNITS, units); }, [units]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CATEGORIES, categories); }, [categories]);
  // stampImage는 imageStorage.ts의 saveStampImage를 통해 암호화되어 저장됨
  useEffect(() => {
    const snapshot = { companyInfo, clients, workItems, invoices, estimates, units, categories };
    scheduleMirror(snapshot, 1 * MS_IN_SECOND);
  }, [companyInfo, clients, workItems, invoices, estimates, units, categories]);

  const convertEstimateToWorkItems = (estimateId: string): WorkItem[] => {
    const estimate = estimates.find(est => est.id === estimateId);
    if (estimate === undefined) return [];
    const baseMax = Math.max(0, ...workItems.map(i => {
      const n = Number(i.id);
      return Number.isFinite(n) ? n : 0;
    }));
    const newItems: WorkItem[] = estimate.items.map((item, index) => ({
      id: baseMax + index + 1,
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      workplaceId: estimate.workplaceId,
      workplaceName: estimate.workplaceName,
      projectName: estimate.projectName,
      name: item.name,
      category: item.category,
      defaultPrice: (typeof item.unitPrice === 'number' ? item.unitPrice : 0),
      quantity: (typeof item.quantity === 'number' ? item.quantity : 0),
      unit: item.unit,
      description: item.description,
      status: '예정',
      date: new Date().toISOString().split('T')[0],
      notes: item.notes ?? ''
    }));
    setWorkItems(prev => [...prev, ...newItems]);
    setEstimates(prev => prev.map(est => est.id === estimateId ? { ...est, status: '작업 전환됨' } : est));
    return newItems;
  };

  const value: AppContextValue = {
    companyInfo, setCompanyInfo,
    clients, setClients,
    workItems, setWorkItems,
    invoices, setInvoices,
    estimates, setEstimates,
    units, setUnits,
    categories, setCategories,
    stampImage, setStampImage,
    getCompletedWorkItems,
    getCompletedWorkItemsByClient,
    addWorkItemToInvoice,
    convertEstimateToWorkItems,
  };

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
};
