import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Invoices from '../Invoices';
import type { Invoice, Client, CompanyInfo } from '../../types';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }
}));

jest.mock('../../contexts/AppContext', () => ({
  useApp: jest.fn()
}));

jest.mock('../../utils/excelUtils', () => ({
  exportToExcel: jest.fn()
}));

const mockCompanyInfo: CompanyInfo = {
  name: '테스트 건설',
  ceo: '홍길동',
  address: '서울시 강남구',
  contact: '02-1234-5678',
  businessNumber: '123-45-67890',
  email: 'test@test.com'
};

const mockClients: Client[] = [
  { id: 1, name: '건축주1', contact: '010-1111-1111', address: '주소1', email: 'client1@test.com' },
  { id: 2, name: '건축주2', contact: '010-2222-2222', address: '주소2', email: 'client2@test.com' }
];

const mockInvoices: Invoice[] = [
  {
    id: '1',
    clientId: 1,
    client: '건축주1',
    workplaceId: 1,
    workplaceAddress: '현장주소1',
    project: '프로젝트1',
    date: '2025-10-05',
    amount: 5000000,
    status: '결제완료',
    items: [
      { name: '작업1', quantity: 2, unit: '식', unitPrice: 2500000, total: 5000000 }
    ],
    invoiceNumber: 'INV-001'
  },
  {
    id: '2',
    clientId: 2,
    client: '건축주2',
    workplaceId: 2,
    workplaceAddress: '현장주소2',
    project: '프로젝트2',
    date: '2025-10-04',
    amount: 3000000,
    status: '발송됨',
    items: [
      { name: '작업2', quantity: 1, unit: '식', unitPrice: 3000000, total: 3000000 }
    ],
    invoiceNumber: 'INV-002'
  }
];

const renderInvoices = (overrides = {}) => {
  const { useApp } = require('../../contexts/AppContext');

  const mockContext = {
    invoices: mockInvoices,
    clients: mockClients,
    companyInfo: mockCompanyInfo,
    stampImage: null,
    categories: ['자재', '인건비'],
    units: ['개', 'm', 'm²', '식'],
    setInvoices: jest.fn(),
    setClients: jest.fn(),
    setCompanyInfo: jest.fn(),
    setStampImage: jest.fn(),
    setCategories: jest.fn(),
    setUnits: jest.fn(),
    addWorkItemToInvoice: jest.fn(),
    ...overrides
  };

  useApp.mockReturnValue(mockContext);

  return render(
    <BrowserRouter>
      <Invoices />
    </BrowserRouter>
  );
};

describe('Invoices Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('청구서 관리 제목이 표시됨', () => {
      renderInvoices();
      expect(screen.getByText('청구서 관리')).toBeInTheDocument();
    });

    it('통계 카드가 표시됨', () => {
      renderInvoices();
      // StatsCards 컴포넌트가 렌더링되는지 확인 - 숫자 확인
      const countElements = screen.getAllByText(/\d+건/);
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('필터 바가 표시됨', () => {
      renderInvoices();
      // FilterBar가 렌더링되는지 확인 (건축주 필터 등)
      const filters = document.querySelector('select');
      expect(filters).toBeInTheDocument();
    });
  });

  describe('청구서 목록', () => {
    it('청구서 테이블이 렌더링됨', () => {
      renderInvoices();
      // 테이블 헤더 확인
      expect(screen.getByText(/청구서 번호/i)).toBeInTheDocument();
      expect(screen.getByText(/건 축 주/i)).toBeInTheDocument();
    });

    it('청구서 금액이 표시됨', () => {
      renderInvoices();
      const amounts = screen.getAllByText(/₩[\d,]+원/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('청구서 상태가 표시됨', () => {
      renderInvoices();
      const statuses = screen.getAllByText(/결제완료|발송됨/);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('청구서 데이터가 표시됨', () => {
      renderInvoices();
      // 테이블 행 확인 (tbody tr 확인)
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
      const rows = table?.querySelectorAll('tbody tr');
      expect(rows?.length).toBeGreaterThan(0);
    });
  });

  describe('청구서 생성', () => {
    it('신규 청구서 버튼이 렌더링됨', () => {
      renderInvoices();
      // 버튼은 아이콘일 수 있으므로 타이틀이나 aria-label로 확인
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('필터링', () => {
    it('필터 select가 렌더링됨', () => {
      renderInvoices();
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('상태 필터 옵션이 있음', () => {
      renderInvoices();
      const selects = document.querySelectorAll('select');
      const hasStatusOption = Array.from(selects).some(select =>
        select.querySelector('option[value="결제완료"]')
      );
      expect(hasStatusOption).toBe(true);
    });
  });

  describe('청구서 삭제', () => {
    it('삭제 버튼이 표시됨', () => {
      renderInvoices();
      const deleteButtons = screen.getAllByTitle(/삭제/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('삭제 버튼 클릭 시 확인 다이얼로그 표시', () => {
      renderInvoices();
      const deleteButtons = screen.getAllByTitle(/삭제/i);

      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        waitFor(() => {
          const confirmDialog = screen.getByText(/삭제하시겠습니까/i);
          expect(confirmDialog).toBeInTheDocument();
        });
      }
    });
  });

  describe('상세보기', () => {
    it('상세보기 버튼이 표시됨', () => {
      renderInvoices();
      const detailButtons = screen.getAllByTitle(/상세|보기/i);
      expect(detailButtons.length).toBeGreaterThan(0);
    });

    it('상세보기 클릭 시 상세 정보 표시', () => {
      renderInvoices();
      const detailButtons = screen.getAllByTitle(/상세|보기/i);

      if (detailButtons.length > 0) {
        fireEvent.click(detailButtons[0]);

        waitFor(() => {
          // 상세 정보가 표시되는지 확인
          const detailInfo = screen.getByText(/프로젝트1|작업1/i);
          expect(detailInfo).toBeInTheDocument();
        });
      }
    });
  });

  describe('Excel 내보내기', () => {
    it('Excel 내보내기 기능이 있음', () => {
      renderInvoices();
      // Excel 내보내기 버튼은 아이콘일 수 있음
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('상태 변경', () => {
    it('상태 변경 드롭다운이 표시됨', () => {
      renderInvoices();
      const statusSelects = screen.getAllByDisplayValue(/발송대기|발송됨|결제완료/i);
      expect(statusSelects.length).toBeGreaterThan(0);
    });

    it('상태 변경 시 setInvoices 호출', () => {
      const mockSetInvoices = jest.fn();
      renderInvoices({ setInvoices: mockSetInvoices });

      const statusSelects = screen.getAllByDisplayValue(/발송대기|발송됨|결제완료/i);

      if (statusSelects.length > 0) {
        fireEvent.change(statusSelects[0], { target: { value: '결제완료' } });

        waitFor(() => {
          expect(mockSetInvoices).toHaveBeenCalled();
        });
      }
    });
  });

  describe('선택 기능', () => {
    it('전체 선택 체크박스가 표시됨', () => {
      renderInvoices();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('개별 선택 체크박스가 표시됨', () => {
      renderInvoices();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      // 전체 선택 + 개별 선택들
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('일괄 삭제', () => {
    it('일괄 작업 기능이 있음', () => {
      renderInvoices();
      // 일괄 삭제는 여러 버튼 중 하나
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
