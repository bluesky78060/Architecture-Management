/**
 * SQLite 마이그레이션 서비스
 * IndexedDB (Dexie) → SQLite (better-sqlite3) 데이터 마이그레이션
 * Electron 환경 전용
 */

// @ts-nocheck - IndexedDB 타입과 SQLite 타입 간의 불일치 허용
import { db as dexieDb } from './database.legacy';
import databaseService from './database';
import { format } from 'date-fns';

interface MigrationResult {
  success: boolean;
  clientsCount: number;
  estimatesCount: number;
  invoicesCount: number;
  workItemsCount: number;
  companyInfoMigrated: boolean;
  errors: string[];
  duration: number;
}

class MigrationService {
  private isElectron(): boolean {
    return window.cms !== undefined && window.cms !== null;
  }

  /**
   * IndexedDB → SQLite 마이그레이션 실행
   */
  async migrateToSQLite(): Promise<MigrationResult> {
    if (!this.isElectron()) {
      throw new Error('SQLite migration is only available in Electron environment');
    }

    const startTime = Date.now();
    const errors: string[] = [];
    let clientsCount = 0;
    let estimatesCount = 0;
    let invoicesCount = 0;
    let workItemsCount = 0;
    let companyInfoMigrated = false;

    console.log('🔄 Starting migration from IndexedDB to SQLite...');

    try {
      // 1. Clients 마이그레이션
      console.log('📦 Migrating clients...');
      const clients = await dexieDb.clients.toArray();

      for (const client of clients) {
        try {
          const clientId = databaseService.createClient({
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
            outstanding: client.outstanding || 0
          });
          console.log(`✅ Migrated client ${clientId}: ${client.name}`);
          clientsCount++;
        } catch (error: any) {
          errors.push(`Client migration error (${client.name}): ${error.message}`);
          console.error(`❌ Failed to migrate client ${client.name}:`, error);
        }
      }
      console.log(`✅ Migrated ${clientsCount}/${clients.length} clients`);

      // 2. Estimates 마이그레이션
      console.log('📦 Migrating estimates...');
      const estimates = await dexieDb.estimates.toArray();

      for (const estimate of estimates) {
        try {
          const estimateId = databaseService.createEstimate(
            {
              estimate_number: estimate.id,
              client_id: estimate.clientId,
              workplace_id: estimate.workplaceId,
              project_name: estimate.projectName || '',
              title: estimate.title,
              date: estimate.date || new Date().toISOString().split('T')[0],
              valid_until: estimate.validUntil,
              status: this.mapEstimateStatus(estimate.status),
              total_amount: estimate.totalAmount || 0,
              notes: estimate.notes || ''
            },
            (estimate.items || []).map((item: any, index: number) => ({
              category: item.category || '',
              name: item.name,
              description: item.description || '',
              quantity: item.quantity || 0,
              unit: item.unit || '',
              unit_price: item.unitPrice || 0,
              notes: item.notes || '',
              sort_order: index
            }))
          );
          console.log(`✅ Migrated estimate ${estimateId}: ${estimate.title}`);
          estimatesCount++;
        } catch (error: any) {
          errors.push(`Estimate migration error (${estimate.id}): ${error.message}`);
          console.error(`❌ Failed to migrate estimate ${estimate.id}:`, error);
        }
      }
      console.log(`✅ Migrated ${estimatesCount}/${estimates.length} estimates`);

      // 3. Invoices 마이그레이션
      console.log('📦 Migrating invoices...');
      const invoices = await dexieDb.invoices.toArray();

      for (const invoice of invoices) {
        try {
          const invoiceId = databaseService.createInvoice(
            {
              invoice_number: invoice.id,
              client_id: invoice.clientId,
              project_name: invoice.project || '',
              workplace_address: invoice.workplaceAddress || '',
              amount: invoice.amount,
              status: this.mapInvoiceStatus(invoice.status),
              date: invoice.date,
              due_date: invoice.dueDate
            },
            (invoice.workItems || []).map((item: any, index: number) => ({
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
          );
          console.log(`✅ Migrated invoice ${invoiceId}: ${invoice.id}`);
          invoicesCount++;
        } catch (error: any) {
          errors.push(`Invoice migration error (${invoice.id}): ${error.message}`);
          console.error(`❌ Failed to migrate invoice ${invoice.id}:`, error);
        }
      }
      console.log(`✅ Migrated ${invoicesCount}/${invoices.length} invoices`);

      // 4. WorkItems 마이그레이션
      console.log('📦 Migrating work items...');
      const workItems = await dexieDb.workItems.toArray();

      for (const item of workItems) {
        try {
          const workItemId = databaseService.createWorkItem({
            client_id: item.clientId,
            workplace_id: item.workplaceId,
            project_name: item.projectName || '',
            name: item.name,
            category: item.category || '',
            unit: item.unit || '',
            quantity: item.quantity,
            default_price: item.defaultPrice,
            description: item.description || '',
            notes: item.notes || '',
            status: this.mapWorkItemStatus(item.status),
            date: item.date,
            labor_persons: item.laborPersons,
            labor_unit_rate: item.laborUnitRate,
            labor_persons_general: item.laborPersonsGeneral,
            labor_unit_rate_general: item.laborUnitRateGeneral
          });
          console.log(`✅ Migrated work item ${workItemId}: ${item.name}`);
          workItemsCount++;
        } catch (error: any) {
          errors.push(`WorkItem migration error (${item.name}): ${error.message}`);
          console.error(`❌ Failed to migrate work item ${item.name}:`, error);
        }
      }
      console.log(`✅ Migrated ${workItemsCount}/${workItems.length} work items`);

      // 5. Company Info 마이그레이션
      console.log('📦 Migrating company info...');
      try {
        const companyInfo = await dexieDb.getCompanyInfo();
        if (companyInfo) {
          databaseService.updateCompanyInfo({
            name: companyInfo.name,
            representative: companyInfo.representative || '',
            phone: companyInfo.phone || '',
            email: companyInfo.email || '',
            address: companyInfo.address || '',
            business_number: companyInfo.businessNumber || '',
            stamp_url: companyInfo.stampUrl || '',
            bank_account: companyInfo.bankAccount || '',
            account_holder: companyInfo.accountHolder || ''
          });
          companyInfoMigrated = true;
          console.log('✅ Company info migrated');
        }
      } catch (error: any) {
        errors.push(`Company info migration error: ${error.message}`);
        console.error('❌ Failed to migrate company info:', error);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Migration completed in ${duration}ms`);
      console.log(`📊 Summary: ${clientsCount} clients, ${estimatesCount} estimates, ${invoicesCount} invoices, ${workItemsCount} work items`);

      return {
        success: errors.length === 0,
        clientsCount,
        estimatesCount,
        invoicesCount,
        workItemsCount,
        companyInfoMigrated,
        errors,
        duration
      };

    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        clientsCount,
        estimatesCount,
        invoicesCount,
        workItemsCount,
        companyInfoMigrated,
        errors: [...errors, error.message],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 견적서 상태 매핑
   */
  private mapEstimateStatus(status: string): 'draft' | 'sent' | 'approved' | 'rejected' {
    const statusMap: Record<string, 'draft' | 'sent' | 'approved' | 'rejected'> = {
      '임시저장': 'draft',
      '발송됨': 'sent',
      '승인됨': 'approved',
      '거절됨': 'rejected',
      'draft': 'draft',
      'sent': 'sent',
      'approved': 'approved',
      'rejected': 'rejected'
    };
    return statusMap[status] || 'draft';
  }

  /**
   * 청구서 상태 매핑
   */
  private mapInvoiceStatus(status: string): 'pending' | 'paid' | 'overdue' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'paid' | 'overdue' | 'cancelled'> = {
      '발송대기': 'pending',
      '발송됨': 'pending',
      '미결제': 'pending',
      '결제완료': 'paid',
      '연체': 'overdue',
      '취소': 'cancelled',
      'pending': 'pending',
      'paid': 'paid',
      'overdue': 'overdue',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
  }

  /**
   * 작업 항목 상태 매핑
   */
  private mapWorkItemStatus(status: string): 'pending' | 'in_progress' | 'completed' {
    const statusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      '예정': 'pending',
      '진행중': 'in_progress',
      '완료': 'completed',
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed'
    };
    return statusMap[status] || 'pending';
  }

  /**
   * IndexedDB 백업 생성 (마이그레이션 전)
   */
  async createIndexedDBBackup(): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const backup = {
      timestamp,
      version: '1.0',
      clients: await dexieDb.clients.toArray(),
      estimates: await dexieDb.estimates.toArray(),
      invoices: await dexieDb.invoices.toArray(),
      workItems: await dexieDb.workItems.toArray(),
      companyInfo: await dexieDb.getCompanyInfo()
    };

    const backupJson = JSON.stringify(backup, null, 2);
    const backupFileName = `indexeddb_backup_${timestamp}.json`;

    // localStorage에 백업 저장
    localStorage.setItem('indexeddb_backup', backupJson);
    localStorage.setItem('indexeddb_backup_date', timestamp);

    console.log(`✅ IndexedDB backup created: ${backupFileName}`);
    return backupFileName;
  }

  /**
   * 마이그레이션 전 데이터 검증
   */
  async validateData(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // 1. Clients 검증
      const clients = await dexieDb.clients.toArray();
      const clientsWithoutName = clients.filter(c => !c.name || c.name.trim() === '');
      if (clientsWithoutName.length > 0) {
        issues.push(`${clientsWithoutName.length}개 건축주에 이름이 없습니다`);
      }

      // 2. Estimates 검증
      const estimates = await dexieDb.estimates.toArray();
      const estimatesWithoutClient = estimates.filter(e => !e.clientId);
      if (estimatesWithoutClient.length > 0) {
        issues.push(`${estimatesWithoutClient.length}개 견적서에 건축주 정보가 없습니다`);
      }

      // 3. Invoices 검증
      const invoices = await dexieDb.invoices.toArray();
      const invoicesWithoutClient = invoices.filter(i => !i.clientId);
      if (invoicesWithoutClient.length > 0) {
        issues.push(`${invoicesWithoutClient.length}개 청구서에 건축주 정보가 없습니다`);
      }

      // 4. WorkItems 검증
      const workItems = await dexieDb.workItems.toArray();
      const workItemsWithoutClient = workItems.filter(w => !w.clientId);
      if (workItemsWithoutClient.length > 0) {
        issues.push(`${workItemsWithoutClient.length}개 작업 항목에 건축주 정보가 없습니다`);
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error: any) {
      issues.push(`데이터 검증 실패: ${error.message}`);
      return {
        valid: false,
        issues
      };
    }
  }

  /**
   * SQLite 데이터베이스 무결성 검사
   */
  checkSQLiteIntegrity(): boolean {
    try {
      return databaseService.checkIntegrity();
    } catch (error) {
      console.error('SQLite integrity check failed:', error);
      return false;
    }
  }

  /**
   * 마이그레이션 통계
   */
  async getMigrationStats(): Promise<{
    indexeddb: { clients: number; estimates: number; invoices: number; workItems: number };
    sqlite: { clients: number; estimates: number; invoices: number; workItems: number };
  }> {
    return {
      indexeddb: {
        clients: await dexieDb.clients.count(),
        estimates: await dexieDb.estimates.count(),
        invoices: await dexieDb.invoices.count(),
        workItems: await dexieDb.workItems.count()
      },
      sqlite: {
        clients: databaseService.getAllClients().length,
        estimates: databaseService.getAllEstimates().length,
        invoices: databaseService.getAllInvoices().length,
        workItems: databaseService.getAllWorkItems().length
      }
    };
  }
}

export const migrationService = new MigrationService();
export default migrationService;
