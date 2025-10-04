// Automatic XLSX mirror of core app data (read-only export for humans)
import * as ExcelJS from 'exceljs';
import { browserFs } from './browserFs';
import { CompanyInfo, Client, WorkItem, Invoice, Estimate } from '../types/domain';
import '../types/global';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Application snapshot interface
interface AppSnapshot {
  companyInfo?: CompanyInfo;
  clients?: Client[];
  workItems?: WorkItem[];
  invoices?: Invoice[];
  estimates?: Estimate[];
  units?: string[];
  categories?: string[];
}

let timer: NodeJS.Timeout | null = null;
let lastPayload: AppSnapshot | null = null;

async function toArrayBuffer(workbook: ExcelJS.Workbook): Promise<ArrayBuffer> {
  // Generate an ArrayBuffer for writing via Electron or File System Access
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer; // ArrayBuffer
}

function normalizeArray<T>(arr: T[] | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export function buildWorkbook(snapshot: AppSnapshot): ExcelJS.Workbook {
  const {
    companyInfo = {},
    clients = [],
    workItems = [],
    invoices = [],
    estimates = [],
    units = [],
    categories = [],
  } = snapshot || {};

  const wb = new ExcelJS.Workbook();

  // Helper function to add JSON data to worksheet
  const addJsonSheet = (data: Array<Record<string, unknown>>, sheetName: string) => {
    const ws = wb.addWorksheet(sheetName);
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      ws.addRow(headers);
      data.forEach(item => {
        const row = headers.map(header => item[header]);
        ws.addRow(row);
      });
    }
    return ws;
  };

  // Company (single row)
  const companyRows = [companyInfo];
  addJsonSheet(companyRows as unknown as Array<Record<string, unknown>>, 'Company');

  // Core entities
  addJsonSheet(normalizeArray(clients) as unknown as Array<Record<string, unknown>>, 'Clients');
  addJsonSheet(normalizeArray(workItems) as unknown as Array<Record<string, unknown>>, 'WorkItems');
  addJsonSheet(normalizeArray(invoices) as unknown as Array<Record<string, unknown>>, 'Invoices');
  addJsonSheet(normalizeArray(estimates) as unknown as Array<Record<string, unknown>>, 'Estimates');

  // Lookups
  addJsonSheet(normalizeArray(units).map(v => ({ unit: v })), 'Units');
  addJsonSheet(normalizeArray(categories).map(v => ({ category: v })), 'Categories');

  return wb;
}

async function writeViaElectron(ab: ArrayBuffer): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const api = window.cms;
  if (!api || typeof api.writeXlsx !== 'function') return false;
  try {
    // Send as Uint8Array for efficient IPC transfer
    const uint = new Uint8Array(ab);
    await api.writeXlsx!(uint, 'latest.xlsx');
    return true;
  } catch (e) {
    return false;
  }
}

async function writeViaBrowserFs(ab: ArrayBuffer): Promise<boolean> {
  try {
    if (!browserFs.isSupported()) return false;
    const dir = await browserFs.getSavedDirectoryHandle();
    if (!dir) return false;
    const fileHandle = await dir.getFileHandle('latest.xlsx', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([ab], { type: XLSX_MIME }));
    await writable.close();
    return true;
  } catch (e) {
    return false;
  }
}

export async function mirrorNow(snapshot: AppSnapshot): Promise<boolean> {
  try {
    const wb = buildWorkbook(snapshot);
    const ab = await toArrayBuffer(wb);
    // Prefer Electron path; fallback to browser directory if previously granted
    const okElectron = await writeViaElectron(ab);
    if (okElectron) return true;
    const okBrowser = await writeViaBrowserFs(ab);
    return okBrowser;
  } catch (e) {
    return false;
  }
}

export function scheduleMirror(snapshot: AppSnapshot, delayMs: number = 1000): void {
  lastPayload = snapshot;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    if (lastPayload) {
      mirrorNow(lastPayload);
    }
  }, delayMs);
}