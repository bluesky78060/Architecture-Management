const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cms', {
  storageGetSync: (key) => ipcRenderer.sendSync('cms:storage-get-sync', key),
  storageSet: (key, value) => ipcRenderer.send('cms:storage-set', key, value),
  getBaseDir: () => ipcRenderer.invoke('cms:get-base-dir'),
  chooseBaseDir: () => ipcRenderer.invoke('cms:choose-base-dir'),
  // Write XLSX buffer (Uint8Array) to latest.xlsx under base dir
  writeXlsx: (uint8Array, filename) => ipcRenderer.invoke('cms:xlsx-write', filename || 'latest.xlsx', uint8Array),

  // SQLite Database API
  db: {
    // Clients
    getAllClients: () => ipcRenderer.invoke('db:get-all-clients'),
    getClientById: (id) => ipcRenderer.invoke('db:get-client-by-id', id),
    createClient: (data) => ipcRenderer.invoke('db:create-client', data),
    updateClient: (id, data) => ipcRenderer.invoke('db:update-client', id, data),
    deleteClient: (id) => ipcRenderer.invoke('db:delete-client', id),
    searchClients: (query) => ipcRenderer.invoke('db:search-clients', query),

    // Estimates
    getAllEstimates: () => ipcRenderer.invoke('db:get-all-estimates'),
    getEstimateWithItems: (id) => ipcRenderer.invoke('db:get-estimate-with-items', id),
    createEstimate: (estimate, items) => ipcRenderer.invoke('db:create-estimate', estimate, items),
    updateEstimate: (id, data) => ipcRenderer.invoke('db:update-estimate', id, data),
    deleteEstimate: (id) => ipcRenderer.invoke('db:delete-estimate', id),
    searchEstimates: (filters) => ipcRenderer.invoke('db:search-estimates', filters),

    // Invoices
    getAllInvoices: () => ipcRenderer.invoke('db:get-all-invoices'),
    getInvoiceWithItems: (id) => ipcRenderer.invoke('db:get-invoice-with-items', id),
    createInvoice: (invoice, items) => ipcRenderer.invoke('db:create-invoice', invoice, items),
    updateInvoice: (id, data) => ipcRenderer.invoke('db:update-invoice', id, data),
    deleteInvoice: (id) => ipcRenderer.invoke('db:delete-invoice', id),
    searchInvoices: (filters) => ipcRenderer.invoke('db:search-invoices', filters),

    // WorkItems
    getAllWorkItems: () => ipcRenderer.invoke('db:get-all-work-items'),
    createWorkItem: (data) => ipcRenderer.invoke('db:create-work-item', data),
    updateWorkItem: (id, data) => ipcRenderer.invoke('db:update-work-item', id, data),
    deleteWorkItem: (id) => ipcRenderer.invoke('db:delete-work-item', id),

    // Company Info
    getCompanyInfo: () => ipcRenderer.invoke('db:get-company-info'),
    updateCompanyInfo: (data) => ipcRenderer.invoke('db:update-company-info', data),

    // Statistics
    getInvoiceStatistics: () => ipcRenderer.invoke('db:get-invoice-statistics'),
    getEstimateStatistics: () => ipcRenderer.invoke('db:get-estimate-statistics'),

    // Utilities
    backup: (backupPath) => ipcRenderer.invoke('db:backup', backupPath),
    checkIntegrity: () => ipcRenderer.invoke('db:check-integrity'),
    isInitialized: () => ipcRenderer.invoke('db:is-initialized')
  }
});
