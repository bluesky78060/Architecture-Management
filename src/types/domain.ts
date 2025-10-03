// 공용 도메인 타입 정의 (혼재된 JS/TS 환경에서 재사용)
// 신규/변경 파일은 가능한 이 타입들을 참조하세요.

// 공통 별칭
export type ID = number | string;
export type DateString = string; // 'YYYY-MM-DD'
export type CurrencyAmount = number; // 원 단위 정수

// 상태 값들
export type WorkStatus = '예정' | '진행중' | '완료' | '보류';
export type InvoiceStatus = '발송대기' | '발송됨' | '미결제' | '결제완료';
export type EstimateStatus = '검토중' | '승인됨' | '반려' | '임시저장' | '작업 전환됨';

// 단위/카테고리는 사용자 환경설정에 따라 가변이므로 문자열로 정의
export type UnitName = string;
export type CategoryName = string;

// 기본 엔터티
export interface Workplace {
  id: ID;
  name: string;
  address?: string;
  description?: string; // 작업장 설명(프로젝트명으로도 사용될 수 있음)
}

// 사업자 정보(선택)
export interface BusinessInfo {
  businessName: string; // 상호
  representative: string; // 대표자
  businessNumber: string; // 사업자등록번호(하이픈 포함)
  businessType: string; // 업태
  businessItem: string; // 업종
  businessAddress: string; // 사업장 주소
  taxEmail: string; // 계산서/세금계산서 발행 이메일
}

export interface Client {
  id: ID;
  name: string;
  // 연락처
  phone?: string;
  mobile?: string;
  email?: string;
  // 기본 주소 (일반 우편/연락용)
  address?: string;
  // 개인/사업자 구분
  type?: 'PERSON' | 'BUSINESS';
  // 사업자 상세 정보(사업자일 경우)
  business?: BusinessInfo;
  // 부가 정보
  workplaces?: Workplace[];
  projects?: string[]; // 자유형 프로젝트명 리스트
  totalBilled?: CurrencyAmount;
  outstanding?: CurrencyAmount;
  notes?: string;
  // 감사/메타
  createdAt?: DateString;
  updatedAt?: DateString;
}

// 작업 항목 (Work Item)
export interface WorkItem {
  id: ID;
  // 참조
  clientId: number;
  clientName?: string;
  workplaceId?: number | '';
  workplaceName?: string;
  projectName?: string;

  // 기본 정보
  name: string; // 내용
  category?: CategoryName;
  unit?: UnitName;
  quantity?: number;
  defaultPrice?: CurrencyAmount; // 단가
  description?: string; // 세부 작업
  notes?: string;
  status?: WorkStatus;
  date?: DateString;

  // 인력(선택) — 일부 화면에서 '' 문자열을 사용할 수 있어 유니온으로 허용
  laborPersons?: number | '';
  laborUnitRate?: CurrencyAmount | '';
  laborPersonsGeneral?: number | '';
  laborUnitRateGeneral?: CurrencyAmount | '';
}

// 청구서 항목 및 청구서
export interface InvoiceItem {
  name: string;
  quantity: number;
  unit?: UnitName;
  unitPrice: CurrencyAmount;
  total: CurrencyAmount;
  notes?: string;
  date?: DateString;
  // 추가 상세(선택): WorkItem에서 내려온 세부정보를 보전해 상세 출력에 활용
  category?: CategoryName;
  description?: string;
  // 인력(선택)
  laborPersons?: number | '';
  laborUnitRate?: CurrencyAmount | '';
  laborPersonsGeneral?: number | '';
  laborUnitRateGeneral?: CurrencyAmount | '';
}

export interface Invoice {
  id: string; // INV-YYYY-###
  clientId?: number; // 일부 화면에서 사용
  client: string; // 표시용 건축주명
  project?: string;
  workplaceAddress?: string;
  amount: CurrencyAmount; // 총액
  status: InvoiceStatus;
  date: DateString;
  dueDate?: DateString;
  workItems: InvoiceItem[];
}

// 견적 항목 및 견적서
export interface EstimateItem {
  category?: CategoryName;
  name: string;
  description?: string;
  quantity: number | '';
  unit?: UnitName;
  unitPrice: CurrencyAmount | '';
  total?: CurrencyAmount; // (quantity * unitPrice)로 파생 가능
  notes?: string;
}

export interface Estimate {
  id: string; // EST-YYYY-### 등
  clientId: number;
  clientName?: string;
  workplaceId?: number;
  workplaceName?: string;
  workplaceAddress?: string;
  projectName?: string;
  title: string;
  date?: DateString;
  validUntil?: DateString;
  status: EstimateStatus;
  totalAmount: CurrencyAmount;
  notes?: string;
  items: EstimateItem[];
}

// 환경설정
export interface CompanyInfo {
  name: string;
  representative?: string;
  phone?: string;
  email?: string;
  address?: string;
  businessNumber?: string;
  stampUrl?: string; // storage URL
  bankAccount?: string; // 은행/계좌 정보
  accountHolder?: string; // 예금주
}

// 컨텍스트에서 사용할 수 있는 집합 타입 (선택
export interface DomainState {
  companyInfo: CompanyInfo;
  clients: Client[];
  workItems: WorkItem[];
  invoices: Invoice[];
  estimates: Estimate[];
  units: UnitName[];
  categories: CategoryName[];
}
