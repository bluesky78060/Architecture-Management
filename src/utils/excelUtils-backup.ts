/* eslint-disable */
import * as ExcelJS from 'exceljs';
// XLSX is expected to be provided globally in browser context
// Declare to satisfy TypeScript during build.
declare const XLSX: any;
import { Client, WorkItem, Invoice, Estimate, CompanyInfo } from '../types/domain';
import type { WorkStatus, EstimateStatus } from '../types/domain';
import '../types/global';

// XlsxPopulate 최소 타입 정의 (템플릿 기반 내보내기에 필요한 범위만)
type XPPopulate = {
  fromDataAsync: (data: ArrayBuffer) => Promise<XPWorkbook>;
};
type XPWorkbook = {
  sheet: (index: number) => XPWorksheet;
  outputAsync: () => Promise<ArrayBuffer>;
};
type XPWorksheet = {
  cell: (addr: string) => { value: (v: string | number | undefined) => void };
};

// Excel export mapping types
interface ExportClient {
  'ID': number | string;
  '이름': string;
  '전화번호'?: string;
  '이메일'?: string;
  '주소'?: string;
  '프로젝트': string;
  '총 청구금액'?: number;
  '미수금'?: number;
  '비고'?: string;
}

interface ExportWorkItem {
  'ID': number | string;
  '건축주': string;
  '작업장': string;
  '프로젝트': string;
  '내용': string;
  '카테고리'?: string;
  '기본단가'?: number;
  '수량': number;
  '단위'?: string;
  '총금액': number;
  '인부인원': number | string;
  '인부단가': number | string;
  '인부비': number;
  '총금액(인부포함)': number;
  '세부작업'?: string;
  '상태'?: string;
  '날짜'?: string;
  '비고'?: string;
}

interface ExportInvoice {
  '청구서번호': string;
  '건축주': string;
  '프로젝트'?: string;
  '작업장주소'?: string;
  '청구금액': number;
  '상태': string;
  '발행일'?: string;
  '작업항목수': number;
}

interface ExportEstimate {
  '견적서번호': string;
  '건축주'?: string;
  '프로젝트'?: string;
  '작업장주소'?: string;
  '견적금액': number;
  '상태': string;
  '발행일'?: string;
  '유효기한'?: string;
  '작업항목수': number;
}

interface ExportEstimateItem {
  '순번': number;
  '내용': string;
  '수량': number | string;
  '단가': number | string;
  '합계'?: number;
  '카테고리'?: string;
  '설명'?: string;
  '비고'?: string;
}

interface ExportInvoiceItem {
  '순번': number;
  '내용': string;
  '수량': number;
  '단가': number;
  '합계': number;
  '카테고리'?: string;
  '설명'?: string;
  '비고'?: string;
}

// Template interface for XlsxPopulate cell mapping
interface CellMapping {
  no: string;
  date: string;
  desc: string;
  qty: string;
  unit: string;
  unitPrice: string;
  total: string;
  notes: string;
}


// 엑셀 파일 내보내기 함수들
export const exportToExcel = {
  // 건축주 데이터 내보내기
  clients: (clients: Client[]): void => {
    const data: ExportClient[] = clients.map(client => ({
      'ID': client.id,
      '이름': client.name,
      '전화번호': client.phone,
      '이메일': client.email,
      '주소': client.address,
      '프로젝트': (client.projects || []).join(', '),
      '총 청구금액': client.totalBilled,
      '미수금': client.outstanding,
      '비고': client.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '건축주 목록');
    
    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 15 },  // 이름
      { width: 15 },  // 전화번호
      { width: 25 },  // 이메일
      { width: 30 },  // 주소
      { width: 20 },  // 프로젝트
      { width: 15 },  // 총 청구금액
      { width: 15 },  // 미수금
      { width: 30 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '건축주_목록.xlsx');
  },

  // 작업 항목 데이터 내보내기
  workItems: (workItems: WorkItem[]): void => {
    const data: ExportWorkItem[] = workItems.map(item => ({
      'ID': item.id,
      '건축주': item.clientName || '',
      '작업장': item.workplaceName || '',
      '프로젝트': item.projectName || '',
      '내용': item.name,
      '카테고리': item.category,
      '기본단가': item.defaultPrice,
      '수량': item.quantity || 1,
      '단위': item.unit,
      '총금액': (item.defaultPrice || 0) * (item.quantity || 1),
      '인부인원': item.laborPersons || '',
      '인부단가': item.laborUnitRate || '',
      '인부비': ((Number(item.laborPersons) || 0) * (Number(item.laborUnitRate) || 0)),
      '총금액(인부포함)': ((item.defaultPrice || 0) * (item.quantity || 1)) + ((Number(item.laborPersons) || 0) * (Number(item.laborUnitRate) || 0)),
      '세부작업': item.description,
      '상태': item.status,
      '날짜': item.date,
      '비고': item.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '작업 항목');
    
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 12 },  // 건축주
      { width: 20 },  // 작업장
      { width: 15 },  // 프로젝트
      { width: 15 },  // 내용
      { width: 12 },  // 카테고리
      { width: 15 },  // 기본단가
      { width: 8 },   // 수량
      { width: 8 },   // 단위
      { width: 15 },  // 총금액
      { width: 10 },  // 인부인원
      { width: 15 },  // 인부단가
      { width: 15 },  // 인부비
      { width: 18 },  // 총금액(인부포함)
      { width: 30 },  // 세부작업
      { width: 10 },  // 상태
      { width: 12 },  // 날짜
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '작업_항목.xlsx');
  },

  // 청구서 데이터 내보내기
  invoices: (invoices: Invoice[]): void => {
    const data: ExportInvoice[] = invoices.map(invoice => ({
      '청구서번호': invoice.id,
      '건축주': invoice.client,
      '프로젝트': invoice.project,
      '작업장주소': invoice.workplaceAddress,
      '청구금액': invoice.amount,
      '상태': invoice.status,
      '발행일': invoice.date,
      '작업항목수': invoice.workItems.length
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '청구서 목록');
    
    worksheet['!cols'] = [
      { width: 15 },  // 청구서번호
      { width: 12 },  // 건축주
      { width: 15 },  // 프로젝트
      { width: 35 },  // 작업장주소
      { width: 15 },  // 청구금액
      { width: 12 },  // 상태
      { width: 12 },  // 발행일
      { width: 12 }   // 작업항목수
    ];
    
    XLSX.writeFile(workbook, '청구서_목록.xlsx');
  },

  // 견적서 데이터 내보내기
  estimates: (estimates: Estimate[]): void => {
    const data: ExportEstimate[] = estimates.map(estimate => ({
      '견적서번호': estimate.id,
      '건축주': estimate.clientName,
      '프로젝트': estimate.projectName,
      '작업장주소': estimate.workplaceAddress,
      '견적금액': estimate.totalAmount,
      '상태': estimate.status,
      '발행일': estimate.date,
      '유효기한': estimate.validUntil,
      '작업항목수': estimate.items ? estimate.items.length : 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '견적서 목록');
    
    worksheet['!cols'] = [
      { width: 15 },  // 견적서번호
      { width: 12 },  // 건축주
      { width: 15 },  // 프로젝트
      { width: 35 },  // 작업장주소
      { width: 15 },  // 견적금액
      { width: 12 },  // 상태
      { width: 12 },  // 발행일
      { width: 12 },  // 유효기한
      { width: 12 }   // 작업항목수
    ];
    
    XLSX.writeFile(workbook, '견적서_목록.xlsx');
  },

  // 상세 견적서 내보내기
  estimateDetail: (estimate: Estimate): void => {
    const headerData: (string | number)[][] = [
      ['견적서 번호', estimate.id],
      ['건축주', estimate.clientName || ''],
      ['프로젝트', estimate.projectName || ''],
      ['작업장 주소', estimate.workplaceAddress || ''],
      ['발행일', estimate.date || ''],
      ['유효 기한', estimate.validUntil || ''],
      ['상태', estimate.status],
      ['총 금액', estimate.totalAmount],
      []
    ];

    const workItemData: ExportEstimateItem[] = (estimate.items || []).map((item, index) => ({
      '순번': index + 1,
      '내용': item.name,
      '수량': item.quantity,
      '단가': item.unitPrice,
      '합계': item.total,
      '카테고리': item.category,
      '설명': item.description,
      '비고': item.notes
    }));

    const workbook = XLSX.utils.book_new();
    
    // 헤더 시트
    const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.book_append_sheet(workbook, headerSheet, '견적서 정보');
    
    // 작업 항목 시트
    const workItemSheet = XLSX.utils.json_to_sheet(workItemData);
    XLSX.utils.book_append_sheet(workbook, workItemSheet, '작업 내역');
    
    workItemSheet['!cols'] = [
      { width: 8 },   // 순번
      { width: 20 },  // 내용
      { width: 10 },  // 수량
      { width: 15 },  // 단가
      { width: 15 },  // 합계
      { width: 12 },  // 카테고리
      { width: 30 },  // 설명
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, `견적서_${estimate.id}.xlsx`);
  },

  // 상세 청구서 내보내기
  invoiceDetail: (invoice: Invoice): void => {
    const headerData: (string | number)[][] = [
      ['청구서 번호', invoice.id],
      ['건축주', invoice.client],
      ['프로젝트', invoice.project || ''],
      ['작업장 주소', invoice.workplaceAddress || ''],
      ['발행일', invoice.date],
      ['상태', invoice.status],
      ['총 금액', invoice.amount],
      []
    ];

    const workItemData: ExportInvoiceItem[] = invoice.workItems.map((item, index) => ({
      '순번': index + 1,
      '내용': item.name,
      '수량': item.quantity,
      '단가': item.unitPrice,
      '합계': item.total,
      '카테고리': '', // InvoiceItem doesn't have category
      '설명': '', // InvoiceItem doesn't have description
      '비고': item.notes || ''
    }));

    const workbook = XLSX.utils.book_new();
    
    // 헤더 시트
    const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.book_append_sheet(workbook, headerSheet, '청구서 정보');
    
    // 작업 항목 시트
    const workItemSheet = XLSX.utils.json_to_sheet(workItemData);
    XLSX.utils.book_append_sheet(workbook, workItemSheet, '작업 내역');
    
    workItemSheet['!cols'] = [
      { width: 8 },   // 순번
      { width: 20 },  // 내용
      { width: 10 },  // 수량
      { width: 15 },  // 단가
      { width: 15 },  // 합계
      { width: 12 },  // 카테고리
      { width: 30 },  // 설명
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, `청구서_${invoice.id}.xlsx`);
  },

  /**
   * 템플릿 기반 청구서 상세 내보내기
   * - 템플릿 디자인과 인쇄 설정을 그대로 사용합니다.
   * - 템플릿 경로: `/docs/청구서 상세 폼(예제).xlsx` (배포 시 `/public/templates`로 옮기는 것을 권장)
   * - 런타임에 XlsxPopulate를 CDN에서 로드하여 값을 주입합니다.
   */
  invoiceByTemplate: async (invoice: Invoice, companyInfo: Partial<CompanyInfo> = {}): Promise<void> => {
    try {
      // 동적 로드 (CDN)
      const ensureXlsxPopulate = (): Promise<XPPopulate> => new Promise((resolve, reject) => {
        if (window.XlsxPopulate) return resolve(window.XlsxPopulate as unknown as XPPopulate);
        const candidates = [
          'https://unpkg.com/xlsx-populate/browser/xlsx-populate.min.js',
          'https://cdn.jsdelivr.net/npm/xlsx-populate/browser/xlsx-populate.min.js'
        ];
        const tryLoad = (i: number): void => {
          if (i >= candidates.length) return reject(new Error('Failed to load XlsxPopulate'));
          const s = document.createElement('script');
          s.src = candidates[i];
          s.onload = () => resolve(window.XlsxPopulate as unknown as XPPopulate);
          s.onerror = () => tryLoad(i + 1);
          document.head.appendChild(s);
        };
        tryLoad(0);
      });

      const XlsxPopulate = await ensureXlsxPopulate();

      // 템플릿 로드 (우선 docs, 실패 시 /templates)
      const base = (process.env.PUBLIC_URL || '');
      const templateUrls = [
        // 권장: public/templates/invoice-detail-template.xlsx (배포 안정)
        base + '/templates/invoice-detail-template.xlsx',
        // 루트 public에 직접 둘 경우
        base + '/invoice-detail-template.xlsx',
        // 프로젝트 루트의 docs 폴더(개발 환경에서만 접근 가능할 수 있음)
        base + '/docs/청구서상세폼예제).xlsx',
        base + '/docs/청구서%20상세%20폼(예제).xlsx'
      ];
      let ab: ArrayBuffer | null = null;
      const tried: string[] = [];
      for (const raw of templateUrls) {
        const url = encodeURI(raw);
        try {
          const res = await fetch(url);
          tried.push(url + ' => ' + res.status);
          if (res.ok) { 
            ab = await res.arrayBuffer(); 
            break; 
          }
        } catch (_) { 
          /* try next */ 
        }
      }
      if (!ab) throw new Error('템플릿을 불러올 수 없습니다. 시도한 경로: \n' + tried.join('\n'));

      // 간단 무결성 검사: XLSX(Zip) 시그니처 'PK' 확인
      const u8 = new Uint8Array(ab);
      if (!(u8.length > 4 && u8[0] === 0x50 && u8[1] === 0x4B)) {
        throw new Error('가져온 파일이 XLSX(Zip) 형식이 아닙니다. 템플릿 경로 또는 정적 서빙 설정을 확인하세요.');
      }

      const wb = await XlsxPopulate.fromDataAsync(ab);
      const ws = wb.sheet(0);

      // 셀 매핑(템플릿에 맞춰 필요 시 조정)
      const set = (addr: string, val: string | number | undefined): void => { 
        try { 
          ws.cell(addr).value(val ?? ''); 
        } catch (_) {
          // Ignore cell access errors
        } 
      };

      set('E4', invoice.id);                 // 청구서 번호
      set('E5', invoice.date);               // 발행일
      set('B6', invoice.client);             // 건축주
      set('B7', invoice.project || '');      // 프로젝트
      set('B8', invoice.workplaceAddress || ''); // 작업장 주소

      // 시공업체 정보 (있을 경우)
      set('E6', companyInfo.name || '');
      set('E7', companyInfo.address || '');
      set('E8', companyInfo.phone || '');

      // 항목 작성: 시작 행/열은 템플릿에 맞춰 조정
      const startRow = 15; // 예시: 15행부터 데이터
      const COL: CellMapping = { 
        no: 'A', 
        date: 'B', 
        desc: 'C', 
        qty: 'D', 
        unit: 'E', 
        unitPrice: 'F', 
        total: 'G', 
        notes: 'H' 
      };
      (invoice.workItems || []).forEach((it, i) => {
        const r = startRow + i;
        set(`${COL.no}${r}`, i + 1);
        set(`${COL.date}${r}`, it.date || '');
        set(`${COL.desc}${r}`, it.name || '');
        set(`${COL.qty}${r}`, it.quantity || 0);
        set(`${COL.unit}${r}`, it.unit || '');
        set(`${COL.unitPrice}${r}`, it.unitPrice || 0);
        set(`${COL.total}${r}`, (it.total != null ? it.total : (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)) || 0);
        set(`${COL.notes}${r}`, it.notes || '');
      });

      // 합계 (예: G열 마지막 합계 셀)
      set('G40', invoice.amount || 0);

      const out = await wb.outputAsync();
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `청구서_${invoice.id}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('템플릿 기반 내보내기에 실패하여 기본 형식으로 내보냅니다.');
      // 폴백: 기본 상세 내보내기
      exportToExcel.invoiceDetail(invoice);
    }
  }
};

// 엑셀 파일 가져오기 함수들
export const importFromExcel = {
  // 건축주 데이터 가져오기
  clients: (file: File): Promise<Client[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            reject(new Error('Failed to read file'));
            return;
          }
          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

          const getStr = (r: Record<string, unknown>, k: string): string => {
            const v = r[k];
            return v == null ? '' : String(v);
          };
          const getNum = (r: Record<string, unknown>, k: string, d = 0): number => {
            const v = r[k];
            if (typeof v === 'number') return v;
            const n = parseFloat(String(v ?? ''));
            return Number.isFinite(n) ? n : d;
          };

          const clients: Client[] = jsonData.map((row, index) => ({
            id: getStr(row, 'ID') || index + 1,
            name: getStr(row, '이름'),
            phone: getStr(row, '전화번호'),
            email: getStr(row, '이메일'),
            address: getStr(row, '주소'),
            projects: getStr(row, '프로젝트') ? getStr(row, '프로젝트').split(', ').map(s => s.trim()).filter(Boolean) : [],
            totalBilled: getNum(row, '총 청구금액', 0),
            outstanding: getNum(row, '미수금', 0),
            notes: getStr(row, '비고'),
            workplaces: [] // 기본값
          }));
          
          resolve(clients);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // 작업 항목 데이터 가져오기
  workItems: (file: File): Promise<WorkItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            reject(new Error('Failed to read file'));
            return;
          }
          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

          const getStr = (r: Record<string, unknown>, k: string): string => {
            const v = r[k];
            return v == null ? '' : String(v);
          };
          const getNum = (r: Record<string, unknown>, k: string, d = 0): number => {
            const v = r[k];
            if (typeof v === 'number') return v;
            const n = parseFloat(String(v ?? ''));
            return Number.isFinite(n) ? n : d;
          };

          const workItems: WorkItem[] = jsonData.map((row, index) => {
            const rawStatus = getStr(row, '상태');
            const allowedWork: readonly WorkStatus[] = ['예정', '진행중', '완료', '보류'];
            const status: WorkStatus = (allowedWork as readonly string[]).includes(rawStatus)
              ? (rawStatus as WorkStatus)
              : '예정';
            // labor fields coercion to number | ''
            const lpRaw = row['인부인원'] ?? row['LaborPersons'] ?? '';
            const lrRaw = row['인부단가'] ?? row['LaborUnitRate'] ?? '';
            const laborPersons: number | '' = typeof lpRaw === 'number' ? lpRaw : (String(lpRaw).trim() === '' ? '' : (parseInt(String(lpRaw), 10) || 0));
            const laborUnitRate: number | '' = typeof lrRaw === 'number' ? lrRaw : (String(lrRaw).trim() === '' ? '' : (parseInt(String(lrRaw), 10) || 0));

            return {
              id: getStr(row, 'ID') || index + 1,
              clientId: Number(getStr(row, '건축주ID') || 1),
              clientName: getStr(row, '건축주'),
              workplaceId: Number(getStr(row, '작업장ID') || 1),
              workplaceName: getStr(row, '작업장'),
              projectName: getStr(row, '프로젝트'),
              name: getStr(row, '내용'),
              category: getStr(row, '카테고리'),
              defaultPrice: getNum(row, '기본단가', 0),
              quantity: getNum(row, '수량', 1),
              unit: getStr(row, '단위'),
              description: getStr(row, '세부작업'),
              status,
              date: getStr(row, '날짜') || new Date().toISOString().split('T')[0],
              notes: getStr(row, '비고'),
              // 인부 필드: 한국어/영문 키 모두 허용
              laborPersons,
              laborUnitRate
            };
          });
          
          resolve(workItems);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  // 견적서 데이터 가져오기
  estimates: (file: File): Promise<Estimate[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            reject(new Error('Failed to read file'));
            return;
          }
          const data = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

          const getStr = (r: Record<string, unknown>, k: string): string => {
            const v = r[k];
            return v == null ? '' : String(v);
          };
          const getNum = (r: Record<string, unknown>, k: string, d = 0): number => {
            const v = r[k];
            if (typeof v === 'number') return v;
            const n = parseFloat(String(v ?? ''));
            return Number.isFinite(n) ? n : d;
          };

          const estimates: Estimate[] = jsonData.map((row, index) => {
            const raw = getStr(row, '상태');
            const normalized = raw === '거부됨' ? '반려' : raw === '수정 요청' ? '임시저장' : raw;
            const allowedEst: readonly EstimateStatus[] = ['검토중', '승인됨', '반려', '임시저장', '작업 전환됨'];
            const status: EstimateStatus = (allowedEst as readonly string[]).includes(normalized)
              ? (normalized as EstimateStatus)
              : '검토중';
            return {
              id: getStr(row, '견적서번호') || `EST-${Date.now()}-${index + 1}`,
              clientId: Number(getStr(row, '건축주ID') || 1),
              clientName: getStr(row, '건축주') || '',
              projectName: getStr(row, '프로젝트') || '',
              workplaceAddress: getStr(row, '작업장주소') || '',
              title: getStr(row, '제목') || '',
              totalAmount: getNum(row, '견적금액', 0),
              status,
              date: getStr(row, '발행일') || new Date().toISOString().split('T')[0],
              validUntil: getStr(row, '유효기한') || '',
              items: [], // 기본값
              notes: getStr(row, '비고') || ''
            };
          });
          
          resolve(estimates);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
};

// 엑셀 템플릿 생성 함수들
export const createTemplate = {
  // 건축주 템플릿
  clients: (): void => {
    const templateData: ExportClient[] = [
      {
        'ID': 1,
        '이름': '예시건축주',
        '전화번호': '010-1234-5678',
        '이메일': 'example@email.com',
        '주소': '서울시 강남구 테헤란로 123',
        '프로젝트': '주택 신축, 리모델링',
        '총 청구금액': 15000000,
        '미수금': 5000000,
        '비고': '우수 고객'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '건축주 템플릿');
    
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 15 },  // 이름
      { width: 15 },  // 전화번호
      { width: 25 },  // 이메일
      { width: 30 },  // 주소
      { width: 20 },  // 프로젝트
      { width: 15 },  // 총 청구금액
      { width: 15 },  // 미수금
      { width: 30 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '건축주_템플릿.xlsx');
  },

  // 작업 항목 템플릿
  workItems: (): void => {
    const templateData: ExportWorkItem[] = [
      {
        'ID': 1,
        '건축주': '예시건축주',
        '작업장': '신축 현장',
        '프로젝트': '주택 신축',
        '내용': '기초공사',
        '카테고리': '토목공사',
        '기본단가': 3000000,
        '수량': 1,
        '단위': '식',
        '총금액': 3000000,
        '인부인원': 2,
        '인부단가': 200000,
        '인부비': 400000, // (참고) 계산용, 가져오기시 무시됨
        '총금액(인부포함)': 3400000, // (참고)
        '세부작업': '건물 기초 및 지반 작업',
        '상태': '완료',
        '날짜': '2024-09-01',
        '비고': '콘크리트 강도 확인 필요'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '작업항목 템플릿');
    
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 12 },  // 건축주
      { width: 20 },  // 작업장
      { width: 15 },  // 프로젝트
      { width: 15 },  // 내용
      { width: 12 },  // 카테고리
      { width: 15 },  // 기본단가
      { width: 8 },   // 수량
      { width: 8 },   // 단위
      { width: 15 },  // 총금액
      { width: 10 },  // 인부인원
      { width: 15 },  // 인부단가
      { width: 15 },  // 인부비
      { width: 18 },  // 총금액(인부포함)
      { width: 30 },  // 세부작업
      { width: 10 },  // 상태
      { width: 12 },  // 날짜
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '작업항목_템플릿.xlsx');
  },

  // 견적서 템플릿
  estimates: (): void => {
    const templateData: ExportEstimate[] = [
      {
        '견적서번호': 'EST-2024-001',
        '건축주': '예시건축주',
        '프로젝트': '주택 신축',
        '작업장주소': '서울시 강남구 테헤란로 123',
        '견적금액': 50000000,
        '상태': '작성중',
        '발행일': '2024-09-01',
        '유효기한': '2024-10-01',
        '작업항목수': 5
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '견적서 템플릿');
    
    worksheet['!cols'] = [
      { width: 15 },  // 견적서번호
      { width: 12 },  // 건축주
      { width: 15 },  // 프로젝트
      { width: 35 },  // 작업장주소
      { width: 15 },  // 견적금액
      { width: 12 },  // 상태
      { width: 12 },  // 발행일
      { width: 12 },  // 유효기한
      { width: 12 }   // 작업항목수
    ];
    
    XLSX.writeFile(workbook, '견적서_템플릿.xlsx');
  },

  // 청구서 템플릿
  invoices: (): void => {
    const templateData: ExportInvoice[] = [
      {
        '청구서번호': 'INV-2024-001',
        '건축주': '예시건축주',
        '프로젝트': '주택 신축',
        '작업장주소': '서울시 강남구 테헤란로 123',
        '청구금액': 10000000,
        '상태': '발송됨',
        '발행일': '2024-09-01',
        '작업항목수': 3
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '청구서 템플릿');
    
    worksheet['!cols'] = [
      { width: 15 },  // 청구서번호
      { width: 12 },  // 건축주
      { width: 15 },  // 프로젝트
      { width: 35 },  // 작업장주소
      { width: 15 },  // 청구금액
      { width: 12 },  // 상태
      { width: 12 },  // 발행일
      { width: 12 },  // 작업항목수
      { width: 25 }   // 비고
    ];
    
    XLSX.writeFile(workbook, '청구서_템플릿.xlsx');
  }
};
