/**
 * Supabase 기반 데이터베이스 서비스
 *
 * SQLite database.ts와 동일한 인터페이스를 제공하지만
 * Supabase PostgreSQL을 백엔드로 사용
 */

import supabaseService, { SupabaseConfig } from './supabase';
import {
  DatabaseClient,
  DatabaseEstimate,
  DatabaseEstimateItem,
  DatabaseInvoice,
  DatabaseInvoiceItem,
  DatabaseWorkItem,
  DatabaseCompanyInfo,
  SearchFilters,
  Statistics
} from '../types/database';

class SupabaseDatabaseService {
  private initialized: boolean = false;

  /**
   * Supabase 데이터베이스 초기화
   */
  async initialize(config: SupabaseConfig): Promise<void> {
    try {
      console.log('🌐 Initializing Supabase Database Service...');

      // Supabase 연결
      supabaseService.initialize(config);

      this.initialized = true;
      console.log('✅ Supabase Database Service initialized');
    } catch (error) {
      console.error('❌ Supabase Database Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * 초기화 확인
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Supabase Database not initialized. Call initialize() first.');
    }
  }

  // ============================================
  // 건축주(Clients) CRUD
  // ============================================

  async getAllClients(): Promise<DatabaseClient[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get clients: ${error.message}`);
    return data || [];
  }

  async getClientById(id: number): Promise<DatabaseClient | null> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('clients')
      .select('*')
      .eq('client_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get client: ${error.message}`);
    }
    return data || null;
  }

  async createClient(data: Omit<DatabaseClient, 'client_id' | 'created_at' | 'updated_at'>): Promise<number> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data: result, error } = await client
      .from('clients')
      .insert([{
        company_name: data.company_name,
        representative: data.representative || null,
        business_number: data.business_number || null,
        address: data.address || null,
        email: data.email || null,
        phone: data.phone || null,
        contact_person: data.contact_person || null,
        type: data.type || 'BUSINESS',
        notes: data.notes || null,
        total_billed: data.total_billed || 0,
        outstanding: data.outstanding || 0
      }])
      .select('client_id')
      .single();

    if (error) throw new Error(`Failed to create client: ${error.message}`);
    return result.client_id;
  }

  async updateClient(id: number, data: Partial<DatabaseClient>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const updateData: any = {};
    if (data.company_name !== undefined) updateData.company_name = data.company_name;
    if (data.representative !== undefined) updateData.representative = data.representative;
    if (data.business_number !== undefined) updateData.business_number = data.business_number;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.contact_person !== undefined) updateData.contact_person = data.contact_person;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.total_billed !== undefined) updateData.total_billed = data.total_billed;
    if (data.outstanding !== undefined) updateData.outstanding = data.outstanding;

    const { error } = await client
      .from('clients')
      .update(updateData)
      .eq('client_id', id);

    if (error) throw new Error(`Failed to update client: ${error.message}`);
    return true;
  }

  async deleteClient(id: number): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('clients')
      .delete()
      .eq('client_id', id);

    if (error) throw new Error(`Failed to delete client: ${error.message}`);
    return true;
  }

  // ============================================
  // 견적서(Estimates) CRUD
  // ============================================

  async getAllEstimates(): Promise<DatabaseEstimate[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('estimates')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(`Failed to get estimates: ${error.message}`);
    return data || [];
  }

  async getEstimateById(id: number): Promise<DatabaseEstimate | null> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('estimates')
      .select('*')
      .eq('estimate_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get estimate: ${error.message}`);
    }
    return data || null;
  }

  async createEstimate(data: Omit<DatabaseEstimate, 'estimate_id' | 'created_at' | 'updated_at'>): Promise<number> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data: result, error } = await client
      .from('estimates')
      .insert([data])
      .select('estimate_id')
      .single();

    if (error) throw new Error(`Failed to create estimate: ${error.message}`);
    return result.estimate_id;
  }

  async updateEstimate(id: number, data: Partial<DatabaseEstimate>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('estimates')
      .update(data)
      .eq('estimate_id', id);

    if (error) throw new Error(`Failed to update estimate: ${error.message}`);
    return true;
  }

  async deleteEstimate(id: number): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('estimates')
      .delete()
      .eq('estimate_id', id);

    if (error) throw new Error(`Failed to delete estimate: ${error.message}`);
    return true;
  }

  // ============================================
  // 견적서 항목(Estimate Items) CRUD
  // ============================================

  async getEstimateItems(estimateId: number): Promise<DatabaseEstimateItem[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('estimate_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to get estimate items: ${error.message}`);
    return data || [];
  }

  async createEstimateItem(data: Omit<DatabaseEstimateItem, 'item_id' | 'amount'>): Promise<number> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data: result, error } = await client
      .from('estimate_items')
      .insert([data])
      .select('item_id')
      .single();

    if (error) throw new Error(`Failed to create estimate item: ${error.message}`);
    return result.item_id;
  }

  async updateEstimateItem(id: number, data: Partial<DatabaseEstimateItem>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('estimate_items')
      .update(data)
      .eq('item_id', id);

    if (error) throw new Error(`Failed to update estimate item: ${error.message}`);
    return true;
  }

  async deleteEstimateItem(id: number): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('estimate_items')
      .delete()
      .eq('item_id', id);

    if (error) throw new Error(`Failed to delete estimate item: ${error.message}`);
    return true;
  }

  // ============================================
  // 청구서(Invoices) CRUD
  // ============================================

  async getAllInvoices(): Promise<DatabaseInvoice[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(`Failed to get invoices: ${error.message}`);
    return data || [];
  }

  async getInvoiceById(id: number): Promise<DatabaseInvoice | null> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('invoices')
      .select('*')
      .eq('invoice_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get invoice: ${error.message}`);
    }
    return data || null;
  }

  async createInvoice(data: Omit<DatabaseInvoice, 'invoice_id' | 'created_at' | 'updated_at'>): Promise<number> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data: result, error } = await client
      .from('invoices')
      .insert([data])
      .select('invoice_id')
      .single();

    if (error) throw new Error(`Failed to create invoice: ${error.message}`);
    return result.invoice_id;
  }

  async updateInvoice(id: number, data: Partial<DatabaseInvoice>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('invoices')
      .update(data)
      .eq('invoice_id', id);

    if (error) throw new Error(`Failed to update invoice: ${error.message}`);
    return true;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('invoices')
      .delete()
      .eq('invoice_id', id);

    if (error) throw new Error(`Failed to delete invoice: ${error.message}`);
    return true;
  }

  // ============================================
  // 청구서 항목(Invoice Items) CRUD
  // ============================================

  async getInvoiceItems(invoiceId: number): Promise<DatabaseInvoiceItem[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to get invoice items: ${error.message}`);
    return data || [];
  }

  async createInvoiceItem(data: Omit<DatabaseInvoiceItem, 'item_id' | 'tax_amount' | 'subtotal' | 'total'>): Promise<number> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data: result, error } = await client
      .from('invoice_items')
      .insert([data])
      .select('item_id')
      .single();

    if (error) throw new Error(`Failed to create invoice item: ${error.message}`);
    return result.item_id;
  }

  async updateInvoiceItem(id: number, data: Partial<DatabaseInvoiceItem>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('invoice_items')
      .update(data)
      .eq('item_id', id);

    if (error) throw new Error(`Failed to update invoice item: ${error.message}`);
    return true;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('invoice_items')
      .delete()
      .eq('item_id', id);

    if (error) throw new Error(`Failed to delete invoice item: ${error.message}`);
    return true;
  }

  // ============================================
  // 작업 항목(Work Items) CRUD
  // ============================================

  async getAllWorkItems(): Promise<DatabaseWorkItem[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('work_items')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw new Error(`Failed to get work items: ${error.message}`);
    return data || [];
  }

  async getWorkItemById(id: number): Promise<DatabaseWorkItem | null> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('work_items')
      .select('*')
      .eq('work_item_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get work item: ${error.message}`);
    }
    return data || null;
  }

  async createWorkItem(data: Omit<DatabaseWorkItem, 'work_item_id' | 'created_at' | 'updated_at'>): Promise<number> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data: result, error } = await client
      .from('work_items')
      .insert([data])
      .select('work_item_id')
      .single();

    if (error) throw new Error(`Failed to create work item: ${error.message}`);
    return result.work_item_id;
  }

  async updateWorkItem(id: number, data: Partial<DatabaseWorkItem>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('work_items')
      .update(data)
      .eq('work_item_id', id);

    if (error) throw new Error(`Failed to update work item: ${error.message}`);
    return true;
  }

  async deleteWorkItem(id: number): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('work_items')
      .delete()
      .eq('work_item_id', id);

    if (error) throw new Error(`Failed to delete work item: ${error.message}`);
    return true;
  }

  // ============================================
  // 회사 정보(Company Info) CRUD
  // ============================================

  async getCompanyInfo(): Promise<DatabaseCompanyInfo | null> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { data, error } = await client
      .from('company_info')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get company info: ${error.message}`);
    }
    return data || null;
  }

  async updateCompanyInfo(data: Partial<DatabaseCompanyInfo>): Promise<boolean> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    const { error } = await client
      .from('company_info')
      .upsert({ id: 1, ...data });

    if (error) throw new Error(`Failed to update company info: ${error.message}`);
    return true;
  }

  // ============================================
  // 검색 및 필터링
  // ============================================

  async searchClients(filters: SearchFilters): Promise<DatabaseClient[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    let query = client.from('clients').select('*');

    if (filters.searchTerm) {
      query = query.or(`company_name.ilike.%${filters.searchTerm}%,representative.ilike.%${filters.searchTerm}%`);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to search clients: ${error.message}`);
    return data || [];
  }

  async searchEstimates(filters: SearchFilters): Promise<DatabaseEstimate[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    let query = client.from('estimates').select('*');

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw new Error(`Failed to search estimates: ${error.message}`);
    return data || [];
  }

  async searchInvoices(filters: SearchFilters): Promise<DatabaseInvoice[]> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    let query = client.from('invoices').select('*');

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw new Error(`Failed to search invoices: ${error.message}`);
    return data || [];
  }

  // ============================================
  // 통계
  // ============================================

  async getStatistics(): Promise<Statistics> {
    this.ensureInitialized();
    const client = supabaseService.getClient();

    // 병렬로 모든 카운트 가져오기
    const [clients, estimates, invoices, workItems] = await Promise.all([
      client.from('clients').select('*', { count: 'exact', head: true }),
      client.from('estimates').select('*', { count: 'exact', head: true }),
      client.from('invoices').select('*', { count: 'exact', head: true }),
      client.from('work_items').select('*', { count: 'exact', head: true }),
    ]);

    // 총 매출 계산
    const { data: totalRevenue } = await client
      .from('invoices')
      .select('amount')
      .eq('status', 'paid');

    const revenue = totalRevenue?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;

    // 미수금 계산
    const { data: pendingInvoices } = await client
      .from('invoices')
      .select('amount')
      .in('status', ['pending', 'overdue']);

    const outstanding = pendingInvoices?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;

    return {
      totalClients: clients.count || 0,
      totalEstimates: estimates.count || 0,
      totalInvoices: invoices.count || 0,
      totalWorkItems: workItems.count || 0,
      totalRevenue: revenue,
      totalOutstanding: outstanding,
    };
  }

  // ============================================
  // Health Check
  // ============================================

  async healthCheck(): Promise<boolean> {
    return await supabaseService.healthCheck();
  }

  /**
   * 통계 정보
   */
  getStats() {
    return supabaseService.getStats();
  }
}

// 싱글톤 인스턴스
export const supabaseDatabaseService = new SupabaseDatabaseService();
export default supabaseDatabaseService;
