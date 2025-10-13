// Global interface declarations for Electron and Browser APIs

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
} from './database';

interface DbOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ElectronDbAPI {
  // Clients
  getAllClients: () => Promise<DbOperationResult<DatabaseClient[]>>;
  getClientById: (id: number) => Promise<DbOperationResult<DatabaseClient>>;
  createClient: (data: Omit<DatabaseClient, 'client_id' | 'created_at' | 'updated_at'>) => Promise<DbOperationResult<number>>;
  updateClient: (id: number, data: Partial<DatabaseClient>) => Promise<DbOperationResult<boolean>>;
  deleteClient: (id: number) => Promise<DbOperationResult<boolean>>;
  searchClients: (query: string) => Promise<DbOperationResult<DatabaseClient[]>>;

  // Estimates
  getAllEstimates: () => Promise<DbOperationResult<DatabaseEstimate[]>>;
  getEstimateWithItems: (id: number) => Promise<DbOperationResult<{
    estimate: DatabaseEstimate;
    items: DatabaseEstimateItem[];
  }>>;
  createEstimate: (
    estimate: Omit<DatabaseEstimate, 'estimate_id' | 'created_at' | 'updated_at'>,
    items: Omit<DatabaseEstimateItem, 'item_id' | 'estimate_id'>[]
  ) => Promise<DbOperationResult<number>>;
  updateEstimate: (id: number, data: Partial<DatabaseEstimate>) => Promise<DbOperationResult<boolean>>;
  deleteEstimate: (id: number) => Promise<DbOperationResult<boolean>>;
  searchEstimates: (filters: SearchFilters) => Promise<DbOperationResult<DatabaseEstimate[]>>;

  // Invoices
  getAllInvoices: () => Promise<DbOperationResult<DatabaseInvoice[]>>;
  getInvoiceWithItems: (id: number) => Promise<DbOperationResult<{
    invoice: DatabaseInvoice;
    items: DatabaseInvoiceItem[];
  }>>;
  createInvoice: (
    invoice: Omit<DatabaseInvoice, 'invoice_id' | 'created_at' | 'updated_at'>,
    items: Omit<DatabaseInvoiceItem, 'item_id' | 'invoice_id'>[]
  ) => Promise<DbOperationResult<number>>;
  updateInvoice: (id: number, data: Partial<DatabaseInvoice>) => Promise<DbOperationResult<boolean>>;
  deleteInvoice: (id: number) => Promise<DbOperationResult<boolean>>;
  searchInvoices: (filters: SearchFilters) => Promise<DbOperationResult<DatabaseInvoice[]>>;

  // WorkItems
  getAllWorkItems: () => Promise<DbOperationResult<DatabaseWorkItem[]>>;
  createWorkItem: (data: Omit<DatabaseWorkItem, 'item_id' | 'created_at' | 'updated_at'>) => Promise<DbOperationResult<number>>;
  updateWorkItem: (id: number, data: Partial<DatabaseWorkItem>) => Promise<DbOperationResult<boolean>>;
  deleteWorkItem: (id: number) => Promise<DbOperationResult<boolean>>;

  // Company Info
  getCompanyInfo: () => Promise<DbOperationResult<DatabaseCompanyInfo>>;
  updateCompanyInfo: (data: Partial<DatabaseCompanyInfo>) => Promise<DbOperationResult<boolean>>;

  // Statistics
  getInvoiceStatistics: () => Promise<DbOperationResult<Statistics>>;
  getEstimateStatistics: () => Promise<DbOperationResult<Statistics>>;

  // Utilities
  backup: (backupPath: string) => Promise<DbOperationResult<boolean>>;
  checkIntegrity: () => Promise<DbOperationResult<boolean>>;
  isInitialized: () => Promise<DbOperationResult<boolean>>;
}

// File System Access API types
declare global {
  interface Window {
    cms?: {
      storageGetSync: (key: string) => unknown;
      storageSet: (key: string, data: unknown) => void;
      writeXlsx?: (data: Uint8Array, filename: string) => Promise<void>;
      // Electron helpers (optional)
      getBaseDir?: () => Promise<string>;
      chooseBaseDir?: () => Promise<string>;
      // SQLite Database API
      db?: ElectronDbAPI;
    };
    showDirectoryPicker?: (options?: { id?: string }) => Promise<FileSystemDirectoryHandle>;
    XlsxPopulate?: unknown;
  }

  interface FileSystemDirectoryHandle {
    name: string;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    queryPermission(options?: { mode?: string }): Promise<PermissionState>;
    requestPermission(options?: { mode?: string }): Promise<PermissionState>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream {
    write(data: Blob | string): Promise<void>;
    close(): Promise<void>;
  }
}

export {};
