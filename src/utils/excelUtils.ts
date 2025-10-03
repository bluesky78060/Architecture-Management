import * as ExcelJS from 'exceljs';
import { Client, WorkItem, Invoice, Estimate, ID, InvoiceStatus } from '../types/domain';

// Helper types for Excel export
interface ExportClient {
  'ID': ID;
  '이름': string;
  '휴대폰': string;
  '이메일': string;
  '주소': string;
  '유형': string;
  '총청구액': number;
  '미수금': number;
  '등록일': string;
  '비고': string;
}

interface ExportWorkItem {
  'ID': ID;
  '건축주': string;
  '작업장': string;
  '프로젝트': string;
  '내용': string;
  '카테고리': string;
  '기본단가': number;
  '수량': number;
  '단위': string;
  '총금액': number;
  '인부인원': string | number;
  '인부단가': string | number;
  '일반인부인원': string | number;
  '일반인부단가': string | number;
  '상태': string;
  '작업일': string;
  '세부작업': string;
  '비고': string;
}

interface ExportInvoice {
  '청구서번호': string;
  '건축주': string;
  '프로젝트': string;
  '작업장주소': string;
  '청구금액': number;
  '상태': InvoiceStatus;
  '발행일': string;
  '작업항목수': number;
}

interface ExportEstimate {
  '견적서번호': string;
  '건축주': string;
  '작업장': string;
  '프로젝트': string;
  '제목': string;
  '총금액': number;
  '상태': string;
  '발행일': string;
  '작업항목수': number;
}

// Helper functions
const createWorkbook = (): ExcelJS.Workbook => {
  return new ExcelJS.Workbook();
};

const addJsonDataToSheet = (workbook: ExcelJS.Workbook, data: any[], sheetName: string, colWidths?: number[]): ExcelJS.Worksheet => {
  const worksheet = workbook.addWorksheet(sheetName);
  
  if (data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);
    
    // Style headers
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => item[header]);
      const dataRow = worksheet.addRow(row);
      
      // Style data cells
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Set column widths
    if (colWidths) {
      colWidths.forEach((width, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = width;
      });
    }
  }
  
  return worksheet;
};

const saveWorkbook = async (workbook: ExcelJS.Workbook, filename: string): Promise<void> => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Export functions
export const excelUtils = {
  // 건축주 데이터 내보내기
  clients: async (clients: Client[]): Promise<void> => {
    const data: ExportClient[] = clients.map(client => ({
      'ID': client.id,
      '이름': client.name,
      '휴대폰': client.mobile || '',
      '이메일': client.email || '',
      '주소': client.address || '',
      '유형': client.type === 'BUSINESS' ? '사업자' : '개인',
      '총청구액': client.totalBilled || 0,
      '미수금': client.outstanding || 0,
      '등록일': client.createdAt || '',
      '비고': client.notes || ''
    }));

    const workbook = createWorkbook();
    addJsonDataToSheet(workbook, data, '건축주 목록', [
      8,   // ID
      12,  // 이름  
      15,  // 휴대폰
      20,  // 이메일
      25,  // 주소
      8,   // 유형
      12,  // 총청구액
      12,  // 미수금
      12,  // 등록일
      20   // 비고
    ]);
    
    await saveWorkbook(workbook, '건축주_목록.xlsx');
  },

  // 작업 항목 데이터 내보내기
  workItems: async (workItems: WorkItem[]): Promise<void> => {
    const data: ExportWorkItem[] = workItems.map(item => ({
      'ID': item.id,
      '건축주': item.clientName || '',
      '작업장': item.workplaceName || '',
      '프로젝트': item.projectName || '',
      '내용': item.name,
      '카테고리': item.category || '',
      '기본단가': item.defaultPrice || 0,
      '수량': item.quantity || 0,
      '단위': item.unit || '',
      '총금액': (item.defaultPrice || 0) * (item.quantity || 0),
      '인부인원': item.laborPersons || '',
      '인부단가': item.laborUnitRate || '',
      '일반인부인원': item.laborPersonsGeneral || '',
      '일반인부단가': item.laborUnitRateGeneral || '',
      '상태': item.status || '',
      '작업일': item.date || '',
      '세부작업': item.description || '',
      '비고': item.notes || ''
    }));

    const workbook = createWorkbook();
    addJsonDataToSheet(workbook, data, '작업 항목', [
      8,   // ID
      12,  // 건축주
      15,  // 작업장
      15,  // 프로젝트
      20,  // 내용
      10,  // 카테고리
      12,  // 기본단가
      8,   // 수량
      8,   // 단위
      12,  // 총금액
      10,  // 인부인원
      12,  // 인부단가
      12,  // 일반인부인원
      12,  // 일반인부단가
      8,   // 상태
      12,  // 작업일
      20,  // 세부작업
      15   // 비고
    ]);
    
    await saveWorkbook(workbook, '작업_항목.xlsx');
  },

  // 청구서 데이터 내보내기
  invoices: async (invoices: Invoice[]): Promise<void> => {
    const data: ExportInvoice[] = invoices.map(invoice => ({
      '청구서번호': invoice.id,
      '건축주': invoice.client,
      '프로젝트': invoice.project || '',
      '작업장주소': invoice.workplaceAddress || '',
      '청구금액': invoice.amount,
      '상태': invoice.status,
      '발행일': invoice.date,
      '작업항목수': invoice.workItems.length
    }));

    const workbook = createWorkbook();
    addJsonDataToSheet(workbook, data, '청구서 목록', [
      15,  // 청구서번호
      12,  // 건축주
      15,  // 프로젝트
      25,  // 작업장주소
      12,  // 청구금액
      10,  // 상태
      12,  // 발행일
      10   // 작업항목수
    ]);
    
    await saveWorkbook(workbook, '청구서_목록.xlsx');
  },

  // 견적서 데이터 내보내기
  estimates: async (estimates: Estimate[]): Promise<void> => {
    const data: ExportEstimate[] = estimates.map(estimate => ({
      '견적서번호': estimate.id,
      '건축주': estimate.clientName || '',
      '작업장': estimate.workplaceName || '',
      '프로젝트': estimate.projectName || '',
      '제목': estimate.title,
      '총금액': estimate.totalAmount,
      '상태': estimate.status,
      '발행일': estimate.date || '',
      '작업항목수': estimate.items.length
    }));

    const workbook = createWorkbook();
    addJsonDataToSheet(workbook, data, '견적서 목록', [
      15,  // 견적서번호
      12,  // 건축주
      15,  // 작업장
      15,  // 프로젝트
      20,  // 제목
      12,  // 총금액
      10,  // 상태
      12,  // 발행일
      10   // 작업항목수
    ]);
    
    await saveWorkbook(workbook, '견적서_목록.xlsx');
  },

  // 상세 견적서 내보내기
  estimateDetail: async (estimate: Estimate): Promise<void> => {
    const workbook = createWorkbook();
    
    // 견적서 정보 시트
    const headerData = [
      ['견적서번호', estimate.id],
      ['건축주', estimate.clientName || ''],
      ['작업장', estimate.workplaceName || ''],
      ['프로젝트', estimate.projectName || ''],
      ['제목', estimate.title],
      ['발행일', estimate.date || ''],
      ['유효기한', estimate.validUntil || ''],
      ['총금액', estimate.totalAmount],
      ['상태', estimate.status],
      ['비고', estimate.notes || '']
    ];
    
    const headerSheet = workbook.addWorksheet('견적서 정보');
    headerData.forEach(row => {
      headerSheet.addRow(row);
    });
    
    // 작업 항목 시트
    const workItemData = estimate.items.map((item, index) => ({
      '순번': index + 1,
      '카테고리': item.category || '',
      '내용': item.name,
      '세부작업': item.description || '',
      '수량': item.quantity,
      '단위': item.unit || '',
      '단가': item.unitPrice,
      '금액': typeof item.quantity === 'number' && typeof item.unitPrice === 'number' ? item.quantity * item.unitPrice : 0,
      '비고': item.notes || ''
    }));
    
    addJsonDataToSheet(workbook, workItemData, '작업 내역', [
      8,   // 순번
      12,  // 카테고리
      20,  // 내용
      20,  // 세부작업
      8,   // 수량
      8,   // 단위
      12,  // 단가
      12,  // 금액
      15   // 비고
    ]);
    
    await saveWorkbook(workbook, `견적서_${estimate.id}.xlsx`);
  },

  // 상세 청구서 내보내기
  invoiceDetail: async (invoice: Invoice): Promise<void> => {
    const workbook = createWorkbook();
    
    // 청구서 정보 시트
    const headerData = [
      ['청구서번호', invoice.id],
      ['건축주', invoice.client],
      ['프로젝트', invoice.project || ''],
      ['작업장주소', invoice.workplaceAddress || ''],
      ['발행일', invoice.date],
      ['총금액', invoice.amount],
      ['상태', invoice.status]
    ];
    
    const headerSheet = workbook.addWorksheet('청구서 정보');
    headerData.forEach(row => {
      headerSheet.addRow(row);
    });
    
    // 작업 항목 시트
    const workItemData = invoice.workItems.map((item, index) => ({
      '순번': index + 1,
      '카테고리': item.category || '',
      '내용': item.name,
      '세부작업': item.description || '',
      '수량': item.quantity,
      '단위': item.unit || '',
      '단가': item.unitPrice,
      '금액': item.total,
      '작업일': item.date || '',
      '비고': item.notes || ''
    }));
    
    addJsonDataToSheet(workbook, workItemData, '작업 내역', [
      8,   // 순번
      12,  // 카테고리
      20,  // 내용
      20,  // 세부작업
      8,   // 수량
      8,   // 단위
      12,  // 단가
      12,  // 금액
      12,  // 작업일
      15   // 비고
    ]);
    
    await saveWorkbook(workbook, `청구서_${invoice.id}.xlsx`);
  },

  /**
   * 파일 업로드 및 파싱 유틸리티
   */
  importFromExcel: {
    // 건축주 데이터 업로드
    clients: (file: File): Promise<Partial<Client>[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            if (!e.target?.result) {
              throw new Error('파일을 읽을 수 없습니다.');
            }
            const data = new Uint8Array(e.target.result as ArrayBuffer);
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.getWorksheet(1);
            
            if (!worksheet) {
              throw new Error('워크시트를 찾을 수 없습니다.');
            }

            const clients: Partial<Client>[] = [];
            const headers: string[] = [];
            
            // Get headers from first row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
              headers.push(cell.value as string);
            });

            // Process data rows
            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header row
              
              const client: Partial<Client> = {};
              const values: any[] = [];
              
              row.eachCell((cell) => {
                values.push(cell.value);
              });

              headers.forEach((header, index) => {
                const value = values[index];
                if (value === undefined || value === null) return;
                
                const val = String(value).trim();
                if (!val) return;

                switch (header) {
                  case 'ID':
                  case '이름':
                    client.name = val;
                    break;
                  case '휴대폰':
                    client.mobile = val;
                    break;
                  case '이메일':
                    client.email = val;
                    break;
                  case '주소':
                    client.address = val;
                    break;
                  case '유형':
                    client.type = val === '사업자' ? 'BUSINESS' : 'PERSON';
                    break;
                  case '비고':
                    client.notes = val;
                    break;
                }
              });
              
              if (client.name) {
                clients.push(client);
              }
            });

            resolve(clients);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('파일 읽기 오류'));
        reader.readAsArrayBuffer(file);
      });
    },

    // 작업 항목 데이터 업로드
    workItems: (file: File): Promise<Partial<WorkItem>[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            if (!e.target?.result) {
              throw new Error('파일을 읽을 수 없습니다.');
            }
            const data = new Uint8Array(e.target.result as ArrayBuffer);
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.getWorksheet(1);
            
            if (!worksheet) {
              throw new Error('워크시트를 찾을 수 없습니다.');
            }

            const workItems: Partial<WorkItem>[] = [];
            const headers: string[] = [];
            
            // Get headers from first row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
              headers.push(cell.value as string);
            });

            // Process data rows
            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header row
              
              const workItem: Partial<WorkItem> = {};
              const values: any[] = [];
              
              row.eachCell((cell) => {
                values.push(cell.value);
              });

              headers.forEach((header, index) => {
                const value = values[index];
                if (value === undefined || value === null) return;
                
                const val = String(value).trim();
                if (!val) return;

                switch (header) {
                  case '내용':
                    workItem.name = val;
                    break;
                  case '건축주':
                    workItem.clientName = val;
                    break;
                  case '작업장':
                    workItem.workplaceName = val;
                    break;
                  case '프로젝트':
                    workItem.projectName = val;
                    break;
                  case '카테고리':
                    workItem.category = val;
                    break;
                  case '단위':
                    workItem.unit = val;
                    break;
                  case '기본단가':
                    workItem.defaultPrice = Number(val) || 0;
                    break;
                  case '수량':
                    workItem.quantity = Number(val) || 0;
                    break;
                  case '상태':
                    workItem.status = val as any;
                    break;
                  case '작업일':
                    workItem.date = val;
                    break;
                  case '세부작업':
                    workItem.description = val;
                    break;
                  case '비고':
                    workItem.notes = val;
                    break;
                }
              });
              
              if (workItem.name) {
                workItems.push(workItem);
              }
            });

            resolve(workItems);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('파일 읽기 오류'));
        reader.readAsArrayBuffer(file);
      });
    },

    // 견적서 데이터 업로드
    estimates: (file: File): Promise<Partial<Estimate>[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            if (!e.target?.result) {
              throw new Error('파일을 읽을 수 없습니다.');
            }
            const data = new Uint8Array(e.target.result as ArrayBuffer);
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.getWorksheet(1);
            
            if (!worksheet) {
              throw new Error('워크시트를 찾을 수 없습니다.');
            }

            const estimates: Partial<Estimate>[] = [];
            const headers: string[] = [];
            
            // Get headers from first row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
              headers.push(cell.value as string);
            });

            // Process data rows
            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header row
              
              const estimate: Partial<Estimate> = {};
              const values: any[] = [];
              
              row.eachCell((cell) => {
                values.push(cell.value);
              });

              headers.forEach((header, index) => {
                const value = values[index];
                if (value === undefined || value === null) return;
                
                const val = String(value).trim();
                if (!val) return;

                switch (header) {
                  case '견적서번호':
                    estimate.id = val;
                    break;
                  case '건축주':
                    estimate.clientName = val;
                    break;
                  case '작업장':
                    estimate.workplaceName = val;
                    break;
                  case '프로젝트':
                    estimate.projectName = val;
                    break;
                  case '제목':
                    estimate.title = val;
                    break;
                  case '총금액':
                    estimate.totalAmount = Number(val) || 0;
                    break;
                  case '상태':
                    estimate.status = val as any;
                    break;
                  case '발행일':
                    estimate.date = val;
                    break;
                }
              });
              
              if (estimate.title) {
                estimates.push(estimate);
              }
            });

            resolve(estimates);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('파일 읽기 오류'));
        reader.readAsArrayBuffer(file);
      });
    }
  },

  // 템플릿 다운로드
  downloadTemplates: {
    // 건축주 템플릿
    clients: async (): Promise<void> => {
      const templateData = [
        {
          'ID': '',
          '이름': '홍길동',
          '휴대폰': '010-1234-5678',
          '이메일': 'hong@example.com',
          '주소': '서울시 강남구 테헤란로 123',
          '유형': '개인',
          '총청구액': 0,
          '미수금': 0,
          '등록일': '',
          '비고': '샘플 건축주'
        }
      ];

      const workbook = createWorkbook();
      addJsonDataToSheet(workbook, templateData, '건축주 템플릿', [
        8,   // ID
        12,  // 이름  
        15,  // 휴대폰
        20,  // 이메일
        25,  // 주소
        8,   // 유형
        12,  // 총청구액
        12,  // 미수금
        12,  // 등록일
        20   // 비고
      ]);
      
      await saveWorkbook(workbook, '건축주_템플릿.xlsx');
    },

    // 작업 항목 템플릿
    workItems: async (): Promise<void> => {
      const templateData = [
        {
          'ID': '',
          '건축주': '홍길동',
          '작업장': '서울 아파트',
          '프로젝트': '욕실 리모델링',
          '내용': '타일 시공',
          '카테고리': '마감공사',
          '기본단가': 50000,
          '수량': 10,
          '단위': 'm²',
          '총금액': 500000,
          '인부인원': 2,
          '인부단가': 200000,
          '일반인부인원': 1,
          '일반인부단가': 150000,
          '상태': '예정',
          '작업일': '',
          '세부작업': '벽면 타일 교체',
          '비고': '샘플 작업항목'
        }
      ];

      const workbook = createWorkbook();
      addJsonDataToSheet(workbook, templateData, '작업항목 템플릿', [
        8,   // ID
        12,  // 건축주
        15,  // 작업장
        15,  // 프로젝트
        20,  // 내용
        10,  // 카테고리
        12,  // 기본단가
        8,   // 수량
        8,   // 단위
        12,  // 총금액
        10,  // 인부인원
        12,  // 인부단가
        12,  // 일반인부인원
        12,  // 일반인부단가
        8,   // 상태
        12,  // 작업일
        20,  // 세부작업
        15   // 비고
      ]);
      
      await saveWorkbook(workbook, '작업항목_템플릿.xlsx');
    },

    // 견적서 템플릿
    estimates: async (): Promise<void> => {
      const templateData = [
        {
          '견적서번호': 'EST-2024-001',
          '건축주': '홍길동',
          '작업장': '서울 아파트',
          '프로젝트': '욕실 리모델링',
          '제목': '욕실 리모델링 견적서',
          '총금액': 1000000,
          '상태': '검토중',
          '발행일': '2024-01-01',
          '작업항목수': 5
        }
      ];

      const workbook = createWorkbook();
      addJsonDataToSheet(workbook, templateData, '견적서 템플릿', [
        15,  // 견적서번호
        12,  // 건축주
        15,  // 작업장
        15,  // 프로젝트
        20,  // 제목
        12,  // 총금액
        10,  // 상태
        12,  // 발행일
        10   // 작업항목수
      ]);
      
      await saveWorkbook(workbook, '견적서_템플릿.xlsx');
    },

    // 청구서 템플릿
    invoices: async (): Promise<void> => {
      const templateData = [
        {
          '청구서번호': 'INV-2024-001',
          '건축주': '홍길동',
          '프로젝트': '욕실 리모델링',
          '작업장주소': '서울시 강남구 테헤란로 123',
          '청구금액': 1000000,
          '상태': '발송대기',
          '발행일': '2024-01-01',
          '작업항목수': 5
        }
      ];

      const workbook = createWorkbook();
      addJsonDataToSheet(workbook, templateData, '청구서 템플릿', [
        15,  // 청구서번호
        12,  // 건축주
        15,  // 프로젝트
        25,  // 작업장주소
        12,  // 청구금액
        10,  // 상태
        12,  // 발행일
        10   // 작업항목수
      ]);
      
      await saveWorkbook(workbook, '청구서_템플릿.xlsx');
    }
  }
};

// Legacy API compatibility
export const exportToExcel = excelUtils;
export const importFromExcel = excelUtils.importFromExcel;
export const createTemplate = excelUtils.downloadTemplates;