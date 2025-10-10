const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cms', {
  storageGetSync: (key) => ipcRenderer.sendSync('cms:storage-get-sync', key),
  storageSet: (key, value) => ipcRenderer.send('cms:storage-set', key, value),
  getBaseDir: () => ipcRenderer.invoke('cms:get-base-dir'),
  chooseBaseDir: () => ipcRenderer.invoke('cms:choose-base-dir'),
  // Write XLSX buffer (Uint8Array) to latest.xlsx under base dir
  writeXlsx: (uint8Array, filename) => ipcRenderer.invoke('cms:xlsx-write', filename || 'latest.xlsx', uint8Array),
});
