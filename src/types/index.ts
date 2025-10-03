export interface Client {
  client_id: number;
  company_name: string;
  representative?: string;
  business_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  project_id: number;
  client_id: number;
  project_name: string;
  address?: string;
  contract_amount?: number;
  vat_mode: 'included' | 'separate' | 'exempt';
  advance_rate: number;
  defect_rate: number;
  created_at: string;
  updated_at: string;
}

export interface WorkLog {
  work_id: number;
  project_id: number;
  work_date: string;
  area?: string;
  weather?: string;
  process_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  item_id: number;
  work_id: number;
  task_code: string;
  task_name: string;
  specification?: string;
  quantity: number;
  unit: string;
  progress_rate: number;
  notes?: string;
}

export interface LaborEntry {
  entry_id: number;
  item_id: number;
  trade: string;
  persons: number;
  hours: number;
  rate_type: 'daily' | 'hourly';
  unit_rate: number;
  total_cost: number;
}

export interface EquipmentEntry {
  entry_id: number;
  item_id: number;
  equipment_code: string;
  equipment_name: string;
  specification?: string;
  units: number;
  hours: number;
  hourly_rate: number;
  min_hours: number;
  mobilization_fee: number;
  total_cost: number;
}

export interface MaterialEntry {
  entry_id: number;
  item_id: number;
  material_code?: string;
  material_name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_cost: number;
  stock_type: 'stock' | 'purchase';
  supplier?: string;
}

export interface Invoice {
  invoice_id: number;
  project_id: number;
  invoice_number: string;
  issue_date: string;
  period_from: string;
  period_to: string;
  sequence: number;
  tax_mode: 'taxable' | 'exempt' | 'zero';
  vat_rate: number;
  supply_amount: number;
  vat_amount: number;
  total_amount: number;
}