// 데이터베이스 관련 타입 정의
export interface DatabaseClient {
  client_id: number;
  company_name: string;
  representative?: string;
  business_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  type?: 'PERSON' | 'BUSINESS';
  notes?: string;
  total_billed?: number;
  outstanding?: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseWorkplace {
  workplace_id: number;
  client_id: number;
  name: string;
  address?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEstimate {
  estimate_id: number;
  estimate_number: string;
  client_id: number;
  workplace_id?: number;
  project_name?: string;
  title: string;
  date?: string;
  valid_until?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEstimateItem {
  item_id: number;
  estimate_id: number;
  category?: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total: number;
  notes?: string;
  sort_order: number;
}

export interface DatabaseInvoice {
  invoice_id: number;
  invoice_number: string;
  client_id: number;
  project_name?: string;
  workplace_address?: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  date: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInvoiceItem {
  item_id: number;
  invoice_id: number;
  name: string;
  category?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total: number;
  notes?: string;
  date?: string;
  labor_persons?: number;
  labor_unit_rate?: number;
  labor_persons_general?: number;
  labor_unit_rate_general?: number;
  sort_order: number;
}

export interface DatabaseWorkItem {
  item_id: number;
  client_id: number;
  workplace_id?: number;
  project_name?: string;
  name: string;
  category?: string;
  unit?: string;
  quantity?: number;
  default_price?: number;
  description?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  date?: string;
  labor_persons?: number;
  labor_unit_rate?: number;
  labor_persons_general?: number;
  labor_unit_rate_general?: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCompanyInfo {
  id: number;
  name: string;
  representative?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_number?: string;
  stamp_url?: string;
  bank_account?: string;
  account_holder?: string;
  created_at: string;
  updated_at: string;
}

// 검색 필터 타입
export interface SearchFilters {
  query?: string;
  status?: string;
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// 통계 결과 타입
export interface Statistics {
  total_count: number;
  total_amount: number;
  paid_count?: number;
  paid_amount?: number;
  pending_count?: number;
  pending_amount?: number;
  overdue_count?: number;
  overdue_amount?: number;
}
