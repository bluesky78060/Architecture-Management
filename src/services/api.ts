/**
 * 통합 API 서비스 레이어
 * Electron 환경: SQLite (window.cms.db 사용)
 * 웹 환경: IndexedDB (Dexie.js 사용)
 */

// @ts-nocheck - IndexedDB 타입과 SQLite 타입 간의 불일치 허용
import { db as dexieDb } from './database.legacy';
import type {
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

// Electron 환경 감지
function isElectron(): boolean {
  return typeof window !== 'undefined' && window.cms !== undefined && window.cms.db !== undefined;
}

// 타입 안전한 cms.db 접근
function getCmsDb() {
  if (!window.cms?.db) throw new Error('Electron database not available');
  return window.cms.db;
}

// ============================================
// Clients API
// ============================================

export async function getAllClients(): Promise<DatabaseClient[]> {
  if (isElectron()) {
    const result = await getCmsDb().getAllClients();
    if (!result.success) throw new Error(result.error || 'Failed to get clients');
    return result.data || [];
  } else {
    // IndexedDB → SQLite 타입 변환
    const clients = await dexieDb.clients.toArray();
    return clients.map((c: any) => ({
      client_id: typeof c.id === 'number' ? c.id : parseInt(c.id),
      company_name: c.name,
      representative: c.representative || '',
      business_number: c.businessNumber || '',
      address: c.address || '',
      email: c.email || '',
      phone: c.phone || '',
      contact_person: c.contactPerson || '',
      type: c.type === 'business' ? 'BUSINESS' : 'PERSON',
      notes: c.notes || '',
      total_billed: c.totalBilled || 0,
      outstanding: c.outstanding || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

export async function getClientById(id: number): Promise<DatabaseClient | undefined> {
  if (isElectron()) {
    const result = await getCmsDb().getClientById(id);
    if (!result.success) throw new Error(result.error || 'Failed to get client');
    return result.data;
  } else {
    const client: any = await dexieDb.clients.get(id);
    if (!client) return undefined;
    return {
      client_id: typeof client.id === 'number' ? client.id : parseInt(client.id),
      company_name: client.name,
      representative: client.representative || '',
      business_number: client.businessNumber || '',
      address: client.address || '',
      email: client.email || '',
      phone: client.phone || '',
      contact_person: client.contactPerson || '',
      type: client.type === 'business' ? 'BUSINESS' : 'PERSON',
      notes: client.notes || '',
      total_billed: client.totalBilled || 0,
      outstanding: client.outstanding || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function createClient(data: Omit<DatabaseClient, 'client_id' | 'created_at' | 'updated_at'>): Promise<number> {
  if (isElectron()) {
    const result = await getCmsDb().createClient(data);
    if (!result.success) throw new Error(result.error || 'Failed to create client');
    return result.data || 0;
  } else {
    // SQLite → IndexedDB 타입 변환
    return await dexieDb.clients.add({
      name: data.company_name,
      representative: data.representative,
      businessNumber: data.business_number,
      address: data.address,
      email: data.email,
      phone: data.phone,
      contactPerson: data.contact_person,
      type: data.type === 'BUSINESS' ? 'business' as any : 'person' as any,
      notes: data.notes,
      totalBilled: data.total_billed,
      outstanding: data.outstanding
    } as any);
  }
}

export async function updateClient(id: number, data: Partial<DatabaseClient>): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().updateClient(id, data);
    if (!result.success) throw new Error(result.error || 'Failed to update client');
  } else {
    // SQLite → IndexedDB 타입 변환
    const updates: any = {};
    if (data.company_name !== undefined) updates.name = data.company_name;
    if (data.representative !== undefined) updates.representative = data.representative;
    if (data.business_number !== undefined) updates.businessNumber = data.business_number;
    if (data.address !== undefined) updates.address = data.address;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.contact_person !== undefined) updates.contactPerson = data.contact_person;
    if (data.type !== undefined) updates.type = data.type === 'BUSINESS' ? 'business' : 'person';
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.total_billed !== undefined) updates.totalBilled = data.total_billed;
    if (data.outstanding !== undefined) updates.outstanding = data.outstanding;

    await dexieDb.clients.update(id, updates);
  }
}

export async function deleteClient(id: number): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().deleteClient(id);
    if (!result.success) throw new Error(result.error || 'Failed to delete client');
  } else {
    await dexieDb.clients.delete(id);
  }
}

export async function searchClients(query: string): Promise<DatabaseClient[]> {
  if (isElectron()) {
    const result = await getCmsDb().searchClients(query);
    if (!result.success) throw new Error(result.error || 'Failed to search clients');
    return result.data || [];
  } else {
    const clients = await dexieDb.clients
      .filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.representative && c.representative.toLowerCase().includes(query.toLowerCase())) ||
        (c.businessNumber && c.businessNumber.includes(query))
      )
      .toArray();

    return clients.map((c: any) => ({
      client_id: typeof c.id === 'number' ? c.id : parseInt(c.id as string),
      company_name: c.name,
      representative: c.representative || '',
      business_number: c.businessNumber || '',
      address: c.address || '',
      email: c.email || '',
      phone: c.phone || '',
      contact_person: c.contactPerson || '',
      type: c.type === 'business' ? 'BUSINESS' : 'PERSON',
      notes: c.notes || '',
      total_billed: c.totalBilled || 0,
      outstanding: c.outstanding || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

// ============================================
// Estimates API
// ============================================

export async function getAllEstimates(): Promise<DatabaseEstimate[]> {
  if (isElectron()) {
    const result = await getCmsDb().getAllEstimates();
    if (!result.success) throw new Error(result.error || 'Failed to get estimates');
    return result.data || [];
  } else {
    const estimates = await dexieDb.estimates.toArray();
    return estimates.map((e: any) => ({
      estimate_id: parseInt(e.id),
      estimate_number: e.id,
      client_id: e.clientId,
      workplace_id: e.workplaceId,
      project_name: e.projectName || '',
      title: e.title,
      date: e.date || new Date().toISOString().split('T')[0],
      valid_until: e.validUntil,
      status: mapEstimateStatusToSQL(e.status),
      total_amount: e.totalAmount || 0,
      notes: e.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

export async function getEstimateWithItems(id: number): Promise<{
  estimate: DatabaseEstimate;
  items: DatabaseEstimateItem[];
}> {
  if (isElectron()) {
    const result = await getCmsDb().getEstimateWithItems(id);
    if (!result.success) throw new Error(result.error || 'Failed to get estimate');
    return result.data || { estimate: {} as DatabaseEstimate, items: [] };
  } else {
    const estimate = await dexieDb.estimates.get(id.toString());
    if (!estimate) throw new Error('Estimate not found');

    return {
      estimate: {
        estimate_id: parseInt(estimate.id),
        estimate_number: estimate.id,
        client_id: estimate.clientId,
        workplace_id: estimate.workplaceId,
        project_name: estimate.projectName || '',
        title: estimate.title,
        date: estimate.date || new Date().toISOString().split('T')[0],
        valid_until: estimate.validUntil,
        status: mapEstimateStatusToSQL(estimate.status),
        total_amount: estimate.totalAmount || 0,
        notes: estimate.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      items: (estimate.items || []).map((item: any, index: number) => ({
        item_id: index + 1,
        estimate_id: parseInt(estimate.id),
        category: item.category || '',
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        unit_price: item.unitPrice || 0,
        notes: item.notes || '',
        sort_order: index
      }))
    };
  }
}

export async function createEstimate(
  estimate: Omit<DatabaseEstimate, 'estimate_id' | 'created_at' | 'updated_at'>,
  items: Omit<DatabaseEstimateItem, 'item_id' | 'estimate_id'>[]
): Promise<number> {
  if (isElectron()) {
    const result = await getCmsDb().createEstimate(estimate, items);
    if (!result.success) throw new Error(result.error || 'Failed to create estimate');
    return result.data || 0;
  } else {
    const id = await dexieDb.estimates.add({
      id: estimate.estimate_number,
      clientId: estimate.client_id,
      workplaceId: estimate.workplace_id,
      projectName: estimate.project_name,
      title: estimate.title,
      date: estimate.date,
      validUntil: estimate.valid_until,
      status: mapEstimateStatusFromSQL(estimate.status),
      totalAmount: estimate.total_amount,
      notes: estimate.notes,
      items: items.map((item: any) => ({
        category: item.category,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        notes: item.notes
      }))
    });
    return parseInt(id);
  }
}

export async function updateEstimate(id: number, data: Partial<DatabaseEstimate>): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().updateEstimate(id, data);
    if (!result.success) throw new Error(result.error || 'Failed to update estimate');
  } else {
    const updates: any = {};
    if (data.client_id !== undefined) updates.clientId = data.client_id;
    if (data.workplace_id !== undefined) updates.workplaceId = data.workplace_id;
    if (data.project_name !== undefined) updates.projectName = data.project_name;
    if (data.title !== undefined) updates.title = data.title;
    if (data.date !== undefined) updates.date = data.date;
    if (data.valid_until !== undefined) updates.validUntil = data.valid_until;
    if (data.status !== undefined) updates.status = mapEstimateStatusFromSQL(data.status);
    if (data.total_amount !== undefined) updates.totalAmount = data.total_amount;
    if (data.notes !== undefined) updates.notes = data.notes;

    await dexieDb.estimates.update(id.toString(), updates);
  }
}

export async function deleteEstimate(id: number): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().deleteEstimate(id);
    if (!result.success) throw new Error(result.error || 'Failed to delete estimate');
  } else {
    await dexieDb.estimates.delete(id.toString());
  }
}

export async function searchEstimates(filters: SearchFilters): Promise<DatabaseEstimate[]> {
  if (isElectron()) {
    const result = await getCmsDb().searchEstimates(filters);
    if (!result.success) throw new Error(result.error || 'Failed to search estimates');
    return result.data || [];
  } else {
    let collection = dexieDb.estimates.toCollection();

    if (filters.query) {
      collection = dexieDb.estimates.filter(e =>
        e.title.toLowerCase().includes(filters.query!.toLowerCase()) ||
        (e.projectName && e.projectName.toLowerCase().includes(filters.query!.toLowerCase()))
      );
    }

    const estimates = await collection.toArray();
    let filtered = estimates;

    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters.clientId) {
      filtered = filtered.filter(e => e.clientId === filters.clientId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(e => e.date && e.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(e => e.date && e.date <= filters.dateTo!);
    }

    return filtered.map((e: any) => ({
      estimate_id: parseInt(e.id),
      estimate_number: e.id,
      client_id: e.clientId,
      workplace_id: e.workplaceId,
      project_name: e.projectName || '',
      title: e.title,
      date: e.date || new Date().toISOString().split('T')[0],
      valid_until: e.validUntil,
      status: mapEstimateStatusToSQL(e.status),
      total_amount: e.totalAmount || 0,
      notes: e.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

// ============================================
// Invoices API
// ============================================

export async function getAllInvoices(): Promise<DatabaseInvoice[]> {
  if (isElectron()) {
    const result = await getCmsDb().getAllInvoices();
    if (!result.success) throw new Error(result.error || 'Failed to get invoices');
    return result.data || [];
  } else {
    const invoices = await dexieDb.invoices.toArray();
    return invoices.map((i: any) => ({
      invoice_id: parseInt(i.id),
      invoice_number: i.id,
      client_id: i.clientId,
      project_name: i.project || '',
      workplace_address: i.workplaceAddress || '',
      amount: i.amount,
      status: mapInvoiceStatusToSQL(i.status),
      date: i.date,
      due_date: i.dueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

export async function getInvoiceWithItems(id: number): Promise<{
  invoice: DatabaseInvoice;
  items: DatabaseInvoiceItem[];
}> {
  if (isElectron()) {
    const result = await getCmsDb().getInvoiceWithItems(id);
    if (!result.success) throw new Error(result.error || 'Failed to get invoice');
    return result.data || { invoice: {} as DatabaseInvoice, items: [] };
  } else {
    const invoice = await dexieDb.invoices.get(id.toString());
    if (!invoice) throw new Error('Invoice not found');

    return {
      invoice: {
        invoice_id: parseInt(invoice.id),
        invoice_number: invoice.id,
        client_id: invoice.clientId,
        project_name: invoice.project || '',
        workplace_address: invoice.workplaceAddress || '',
        amount: invoice.amount,
        status: mapInvoiceStatusToSQL(invoice.status),
        date: invoice.date,
        due_date: invoice.dueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      items: (invoice.workItems || []).map((item: any, index: number) => ({
        item_id: index + 1,
        invoice_id: parseInt(invoice.id),
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        unit_price: item.unitPrice || 0,
        notes: item.notes || '',
        date: item.date,
        labor_persons: item.laborPersons,
        labor_unit_rate: item.laborUnitRate,
        labor_persons_general: item.laborPersonsGeneral,
        labor_unit_rate_general: item.laborUnitRateGeneral,
        sort_order: index
      }))
    };
  }
}

export async function createInvoice(
  invoice: Omit<DatabaseInvoice, 'invoice_id' | 'created_at' | 'updated_at'>,
  items: Omit<DatabaseInvoiceItem, 'item_id' | 'invoice_id'>[]
): Promise<number> {
  if (isElectron()) {
    const result = await getCmsDb().createInvoice(invoice, items);
    if (!result.success) throw new Error(result.error || 'Failed to create invoice');
    return result.data || 0;
  } else {
    const id = await dexieDb.invoices.add({
      id: invoice.invoice_number,
      clientId: invoice.client_id,
      project: invoice.project_name,
      workplaceAddress: invoice.workplace_address,
      amount: invoice.amount,
      status: mapInvoiceStatusFromSQL(invoice.status),
      date: invoice.date,
      dueDate: invoice.due_date,
      workItems: items.map((item: any) => ({
        name: item.name,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        notes: item.notes,
        date: item.date,
        laborPersons: item.labor_persons,
        laborUnitRate: item.labor_unit_rate,
        laborPersonsGeneral: item.labor_persons_general,
        laborUnitRateGeneral: item.labor_unit_rate_general
      }))
    });
    return parseInt(id);
  }
}

export async function updateInvoice(id: number, data: Partial<DatabaseInvoice>): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().updateInvoice(id, data);
    if (!result.success) throw new Error(result.error || 'Failed to update invoice');
  } else {
    const updates: any = {};
    if (data.client_id !== undefined) updates.clientId = data.client_id;
    if (data.project_name !== undefined) updates.project = data.project_name;
    if (data.workplace_address !== undefined) updates.workplaceAddress = data.workplace_address;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.status !== undefined) updates.status = mapInvoiceStatusFromSQL(data.status);
    if (data.date !== undefined) updates.date = data.date;
    if (data.due_date !== undefined) updates.dueDate = data.due_date;

    await dexieDb.invoices.update(id.toString(), updates);
  }
}

export async function deleteInvoice(id: number): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().deleteInvoice(id);
    if (!result.success) throw new Error(result.error || 'Failed to delete invoice');
  } else {
    await dexieDb.invoices.delete(id.toString());
  }
}

export async function searchInvoices(filters: SearchFilters): Promise<DatabaseInvoice[]> {
  if (isElectron()) {
    const result = await getCmsDb().searchInvoices(filters);
    if (!result.success) throw new Error(result.error || 'Failed to search invoices');
    return result.data || [];
  } else {
    let collection = dexieDb.invoices.toCollection();

    const invoices = await collection.toArray();
    let filtered = invoices;

    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }

    if (filters.clientId) {
      filtered = filtered.filter(i => i.clientId === filters.clientId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(i => i.date && i.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(i => i.date && i.date <= filters.dateTo!);
    }

    return filtered.map((i: any) => ({
      invoice_id: parseInt(i.id),
      invoice_number: i.id,
      client_id: i.clientId,
      project_name: i.project || '',
      workplace_address: i.workplaceAddress || '',
      amount: i.amount,
      status: mapInvoiceStatusToSQL(i.status),
      date: i.date,
      due_date: i.dueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

// ============================================
// WorkItems API
// ============================================

export async function getAllWorkItems(): Promise<DatabaseWorkItem[]> {
  if (isElectron()) {
    const result = await getCmsDb().getAllWorkItems();
    if (!result.success) throw new Error(result.error || 'Failed to get work items');
    return result.data || [];
  } else {
    const workItems = await dexieDb.workItems.toArray();
    return workItems.map((w: any) => ({
      item_id: w.id!,
      client_id: w.clientId,
      workplace_id: w.workplaceId,
      project_name: w.projectName || '',
      name: w.name,
      category: w.category || '',
      unit: w.unit || '',
      quantity: w.quantity,
      default_price: w.defaultPrice,
      description: w.description || '',
      notes: w.notes || '',
      status: mapWorkItemStatusToSQL(w.status),
      date: w.date,
      labor_persons: w.laborPersons,
      labor_unit_rate: w.laborUnitRate,
      labor_persons_general: w.laborPersonsGeneral,
      labor_unit_rate_general: w.laborUnitRateGeneral,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
}

export async function createWorkItem(data: Omit<DatabaseWorkItem, 'item_id' | 'created_at' | 'updated_at'>): Promise<number> {
  if (isElectron()) {
    const result = await getCmsDb().createWorkItem(data);
    if (!result.success) throw new Error(result.error || 'Failed to create work item');
    return result.data || 0;
  } else {
    return await dexieDb.workItems.add({
      clientId: data.client_id,
      workplaceId: data.workplace_id,
      projectName: data.project_name,
      name: data.name,
      category: data.category,
      unit: data.unit,
      quantity: data.quantity,
      defaultPrice: data.default_price,
      description: data.description,
      notes: data.notes,
      status: mapWorkItemStatusFromSQL(data.status),
      date: data.date,
      laborPersons: data.labor_persons,
      laborUnitRate: data.labor_unit_rate,
      laborPersonsGeneral: data.labor_persons_general,
      laborUnitRateGeneral: data.labor_unit_rate_general
    });
  }
}

export async function updateWorkItem(id: number, data: Partial<DatabaseWorkItem>): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().updateWorkItem(id, data);
    if (!result.success) throw new Error(result.error || 'Failed to update work item');
  } else {
    const updates: any = {};
    if (data.client_id !== undefined) updates.clientId = data.client_id;
    if (data.workplace_id !== undefined) updates.workplaceId = data.workplace_id;
    if (data.project_name !== undefined) updates.projectName = data.project_name;
    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.default_price !== undefined) updates.defaultPrice = data.default_price;
    if (data.description !== undefined) updates.description = data.description;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.status !== undefined) updates.status = mapWorkItemStatusFromSQL(data.status);
    if (data.date !== undefined) updates.date = data.date;
    if (data.labor_persons !== undefined) updates.laborPersons = data.labor_persons;
    if (data.labor_unit_rate !== undefined) updates.laborUnitRate = data.labor_unit_rate;
    if (data.labor_persons_general !== undefined) updates.laborPersonsGeneral = data.labor_persons_general;
    if (data.labor_unit_rate_general !== undefined) updates.laborUnitRateGeneral = data.labor_unit_rate_general;

    await dexieDb.workItems.update(id, updates);
  }
}

export async function deleteWorkItem(id: number): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().deleteWorkItem(id);
    if (!result.success) throw new Error(result.error || 'Failed to delete work item');
  } else {
    await dexieDb.workItems.delete(id);
  }
}

// ============================================
// Company Info API
// ============================================

export async function getCompanyInfo(): Promise<DatabaseCompanyInfo | undefined> {
  if (isElectron()) {
    const result = await getCmsDb().getCompanyInfo();
    if (!result.success) throw new Error(result.error || 'Failed to get company info');
    return result.data;
  } else {
    const info = await dexieDb.getCompanyInfo();
    if (!info) return undefined;
    return {
      id: 1,
      name: info.name,
      representative: info.representative || '',
      phone: info.phone || '',
      email: info.email || '',
      address: info.address || '',
      business_number: info.businessNumber || '',
      stamp_url: info.stampUrl || '',
      bank_account: info.bankAccount || '',
      account_holder: info.accountHolder || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function updateCompanyInfo(data: Partial<DatabaseCompanyInfo>): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().updateCompanyInfo(data);
    if (!result.success) throw new Error(result.error || 'Failed to update company info');
  } else {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.representative !== undefined) updates.representative = data.representative;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.address !== undefined) updates.address = data.address;
    if (data.business_number !== undefined) updates.businessNumber = data.business_number;
    if (data.stamp_url !== undefined) updates.stampUrl = data.stamp_url;
    if (data.bank_account !== undefined) updates.bankAccount = data.bank_account;
    if (data.account_holder !== undefined) updates.accountHolder = data.account_holder;

    await dexieDb.updateCompanyInfo(updates);
  }
}

// ============================================
// Statistics API
// ============================================

export async function getInvoiceStatistics(): Promise<Statistics> {
  if (isElectron()) {
    const result = await getCmsDb().getInvoiceStatistics();
    if (!result.success) throw new Error(result.error || 'Failed to get invoice statistics');
    return result.data || { total_count: 0, total_amount: 0 };
  } else {
    const invoices = await dexieDb.invoices.toArray();
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === '결제완료');
    const pendingInvoices = invoices.filter(inv => inv.status === '미결제' || inv.status === '발송됨');
    const overdueInvoices = invoices.filter(inv => inv.status === '연체');

    return {
      total_count: invoices.length,
      total_amount: totalAmount,
      paid_count: paidInvoices.length,
      paid_amount: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      pending_count: pendingInvoices.length,
      pending_amount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      overdue_count: overdueInvoices.length,
      overdue_amount: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    };
  }
}

export async function getEstimateStatistics(): Promise<Statistics> {
  if (isElectron()) {
    const result = await getCmsDb().getEstimateStatistics();
    if (!result.success) throw new Error(result.error || 'Failed to get estimate statistics');
    return result.data || { total_count: 0, total_amount: 0 };
  } else {
    const estimates = await dexieDb.estimates.toArray();
    return {
      total_count: estimates.length,
      total_amount: estimates.reduce((sum, est) => sum + (est.totalAmount || 0), 0)
    };
  }
}

// ============================================
// Utilities API
// ============================================

export async function backupDatabase(backupPath: string): Promise<void> {
  if (isElectron()) {
    const result = await getCmsDb().backup(backupPath);
    if (!result.success) throw new Error(result.error || 'Failed to backup database');
  } else {
    throw new Error('Backup is only available in Electron environment');
  }
}

export async function checkDatabaseIntegrity(): Promise<boolean> {
  if (isElectron()) {
    const result = await getCmsDb().checkIntegrity();
    if (!result.success) throw new Error(result.error || 'Failed to check database integrity');
    return result.data || false;
  } else {
    return true; // IndexedDB has built-in integrity
  }
}

export async function isDatabaseInitialized(): Promise<boolean> {
  if (isElectron()) {
    const result = await getCmsDb().isInitialized();
    return result.success && result.data === true;
  } else {
    return true; // IndexedDB is always available in browser
  }
}

// ============================================
// Status Mapping Helpers
// ============================================

function mapEstimateStatusToSQL(status: string): 'draft' | 'sent' | 'approved' | 'rejected' {
  const map: Record<string, 'draft' | 'sent' | 'approved' | 'rejected'> = {
    '임시저장': 'draft',
    '발송됨': 'sent',
    '승인됨': 'approved',
    '거절됨': 'rejected'
  };
  return map[status] || 'draft';
}

function mapEstimateStatusFromSQL(status: 'draft' | 'sent' | 'approved' | 'rejected'): string {
  const map: Record<string, string> = {
    'draft': '임시저장',
    'sent': '발송됨',
    'approved': '승인됨',
    'rejected': '거절됨'
  };
  return map[status] || '임시저장';
}

function mapInvoiceStatusToSQL(status: string): 'pending' | 'paid' | 'overdue' | 'cancelled' {
  const map: Record<string, 'pending' | 'paid' | 'overdue' | 'cancelled'> = {
    '발송대기': 'pending',
    '발송됨': 'pending',
    '미결제': 'pending',
    '결제완료': 'paid',
    '연체': 'overdue',
    '취소': 'cancelled'
  };
  return map[status] || 'pending';
}

function mapInvoiceStatusFromSQL(status: 'pending' | 'paid' | 'overdue' | 'cancelled'): string {
  const map: Record<string, string> = {
    'pending': '미결제',
    'paid': '결제완료',
    'overdue': '연체',
    'cancelled': '취소'
  };
  return map[status] || '미결제';
}

function mapWorkItemStatusToSQL(status: string): 'pending' | 'in_progress' | 'completed' {
  const map: Record<string, 'pending' | 'in_progress' | 'completed'> = {
    '예정': 'pending',
    '진행중': 'in_progress',
    '완료': 'completed'
  };
  return map[status] || 'pending';
}

function mapWorkItemStatusFromSQL(status: 'pending' | 'in_progress' | 'completed'): string {
  const map: Record<string, string> = {
    'pending': '예정',
    'in_progress': '진행중',
    'completed': '완료'
  };
  return map[status] || '예정';
}
