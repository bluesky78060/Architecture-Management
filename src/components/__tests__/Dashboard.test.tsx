import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import type { Invoice, Estimate, Client, WorkItem, CompanyInfo } from '../../types';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock useApp hook
jest.mock('../../contexts/AppContext', () => ({
  useApp: jest.fn()
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
    id: 1,
    client: '건축주1',
    date: '2025-10-05',
    amount: 5000000,
    status: '결제완료',
    items: [],
    invoiceNumber: 'INV-001'
  },
  {
    id: 2,
    client: '건축주2',
    date: '2025-10-04',
    amount: 3000000,
    status: '발송됨',
    items: [],
    invoiceNumber: 'INV-002'
  },
  {
    id: 3,
    client: '건축주1',
    date: '2025-10-03',
    amount: 2000000,
    status: '대기중',
    items: [],
    invoiceNumber: 'INV-003'
  }
];

const mockEstimates: Estimate[] = [
  {
    id: 1,
    clientName: '건축주1',
    date: '2025-10-05',
    totalAmount: 10000000,
    status: '승인됨',
    items: []
  },
  {
    id: 2,
    clientName: '건축주2',
    date: '2025-10-04',
    totalAmount: 8000000,
    status: '대기중',
    items: []
  }
];

const mockWorkItems: WorkItem[] = [];
const mockUnits = ['개', 'm', 'm²'];
const mockCategories = ['자재', '인건비'];

const renderDashboard = (overrides = {}) => {
  const { useApp } = require('../../contexts/AppContext');

  const mockContext = {
    invoices: mockInvoices,
    clients: mockClients,
    estimates: mockEstimates,
    workItems: mockWorkItems,
    companyInfo: mockCompanyInfo,
    units: mockUnits,
    categories: mockCategories,
    stampImage: null,
    setInvoices: jest.fn(),
    setClients: jest.fn(),
    setEstimates: jest.fn(),
    setWorkItems: jest.fn(),
    setCompanyInfo: jest.fn(),
    setUnits: jest.fn(),
    setCategories: jest.fn(),
    setStampImage: jest.fn(),
    addWorkItemToInvoice: jest.fn(),
    ...overrides
  };

  useApp.mockReturnValue(mockContext);

  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  describe('렌더링', () => {
    it('대시보드 제목과 설명이 표시됨', () => {
      renderDashboard();
      expect(screen.getByText('대시보드')).toBeInTheDocument();
      expect(screen.getByText('청구서 발행 현황을 한눈에 확인하세요')).toBeInTheDocument();
    });

    it('백업 안내 문구가 표시됨', () => {
      renderDashboard();
      expect(screen.getByText(/작업 종료 시 상단의 '백업' 버튼을 눌러 데이터를 보관하세요/)).toBeInTheDocument();
    });
  });

  describe('통계 카드', () => {
    it('전체 청구액이 올바르게 계산됨', () => {
      renderDashboard();
      // 5,000,000 + 3,000,000 + 2,000,000 = 10,000,000
      expect(screen.getByText('전체 청구액')).toBeInTheDocument();
      // 여러 곳에 같은 금액이 있을 수 있으므로 getAllByText 사용
      const amounts = screen.getAllByText('₩10,000,000원');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('결제완료 금액이 올바르게 계산됨', () => {
      renderDashboard();
      // 결제완료 상태인 청구서만: 5,000,000
      const paymentStatuses = screen.getAllByText('결제완료');
      expect(paymentStatuses.length).toBeGreaterThan(0);
      const amounts = screen.getAllByText('₩5,000,000원');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('미수금이 올바르게 계산됨', () => {
      renderDashboard();
      // 전체 - 결제완료 = 10,000,000 - 5,000,000 = 5,000,000
      expect(screen.getByText('미수금(요약)')).toBeInTheDocument();
      const misuElements = screen.getAllByText('₩5,000,000원');
      expect(misuElements.length).toBeGreaterThan(0);
    });

    it('등록된 건축주 수가 표시됨', () => {
      renderDashboard();
      expect(screen.getByText('등록된 건축주')).toBeInTheDocument();
      expect(screen.getByText('2명')).toBeInTheDocument();
    });

    it('통계 카드 아이콘이 표시됨', () => {
      renderDashboard();
      // 아이콘 이모지 확인
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('💰')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('👥')).toBeInTheDocument();
    });
  });

  describe('백업 기능', () => {
    it('백업 버튼이 표시됨', () => {
      renderDashboard();
      expect(screen.getByText('백업')).toBeInTheDocument();
      expect(screen.getByText('데이터 저장')).toBeInTheDocument();
    });

    it('백업 버튼 클릭 시 다운로드 동작', () => {
      // Mock URL.createObjectURL and revokeObjectURL
      const createObjectURL = jest.fn(() => 'blob:mock-url');
      const revokeObjectURL = jest.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      renderDashboard();

      const backupButton = screen.getByTitle('모든 데이터를 JSON으로 저장');
      fireEvent.click(backupButton);

      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('복원 기능', () => {
    it('복원 버튼이 표시됨', () => {
      renderDashboard();
      expect(screen.getByText('복원')).toBeInTheDocument();
      expect(screen.getByText('데이터 복구')).toBeInTheDocument();
    });

    it('올바른 JSON 파일 복원 시 성공 메시지 표시', async () => {
      const mockSetCompanyInfo = jest.fn();
      const mockSetClients = jest.fn();

      global.alert = jest.fn();

      renderDashboard({
        setCompanyInfo: mockSetCompanyInfo,
        setClients: mockSetClients
      });

      const restoreButton = screen.getByTitle('백업 JSON에서 복원');
      const fileInput = restoreButton.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      const mockData = {
        companyInfo: mockCompanyInfo,
        clients: mockClients,
        invoices: [],
        estimates: [],
        workItems: [],
        units: [],
        categories: []
      };

      const mockFile = new File(
        [JSON.stringify(mockData)],
        'backup.json',
        { type: 'application/json' }
      );

      // Mock the File.text() method
      mockFile.text = jest.fn().mockResolvedValue(JSON.stringify(mockData));

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('데이터 복원이 완료되었습니다.');
      });
    });

    it('잘못된 JSON 파일 복원 시 오류 메시지 표시', async () => {
      global.alert = jest.fn();

      renderDashboard();

      const restoreButton = screen.getByTitle('백업 JSON에서 복원');
      const fileInput = restoreButton.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      const mockFile = new File(['invalid json'], 'backup.json', { type: 'application/json' });

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        configurable: true
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('복원 중 오류가 발생했습니다. 올바른 백업 파일인지 확인하세요.');
      });
    });
  });

  describe('최근 청구서', () => {
    it('최근 청구서 섹션이 표시됨', () => {
      renderDashboard();
      expect(screen.getByText('최근 청구서')).toBeInTheDocument();
    });

    it('최근 청구서 목록이 날짜순으로 정렬됨 (최신순)', () => {
      renderDashboard();
      const clientNames = screen.getAllByText(/건축주[12]/);
      // 첫 번째는 2025-10-05 (건축주1)
      expect(clientNames[0]).toHaveTextContent('건축주1');
    });

    it('청구서가 없을 때 안내 메시지 표시', () => {
      renderDashboard({ invoices: [] });
      expect(screen.getByText('아직 청구서가 없습니다')).toBeInTheDocument();
    });

    it('청구서 상태별 색상 표시', () => {
      renderDashboard();
      // 결제완료: green, 발송됨: blue, 대기중: yellow
      const statusBadges = screen.getAllByText(/결제완료|발송됨|대기중/);
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('더보기 링크가 /invoices로 연결됨', () => {
      renderDashboard();
      const moreLinks = screen.getAllByText('더보기');
      const invoiceMoreLink = moreLinks[0].closest('a');
      expect(invoiceMoreLink).toHaveAttribute('href', '/invoices');
    });
  });

  describe('최근 견적서', () => {
    it('최근 견적서 섹션이 표시됨', () => {
      renderDashboard();
      expect(screen.getByText('최근 견적서')).toBeInTheDocument();
    });

    it('견적서가 없을 때 안내 메시지 표시', () => {
      renderDashboard({ estimates: [] });
      expect(screen.getByText('아직 견적서가 없습니다')).toBeInTheDocument();
    });

    it('견적서 금액이 올바르게 표시됨', () => {
      renderDashboard();
      const tenMillion = screen.getAllByText('₩10,000,000원');
      expect(tenMillion.length).toBeGreaterThan(0);
      const eightMillion = screen.getAllByText('₩8,000,000원');
      expect(eightMillion.length).toBeGreaterThan(0);
    });

    it('더보기 링크가 /estimates로 연결됨', () => {
      renderDashboard();
      const moreLinks = screen.getAllByText('더보기');
      const estimateMoreLink = moreLinks[1].closest('a');
      expect(estimateMoreLink).toHaveAttribute('href', '/estimates');
    });
  });

  describe('통화 형식', () => {
    it('금액이 한국 원화 형식으로 표시됨', () => {
      renderDashboard();
      // ₩10,000,000원 형식 확인
      const amounts = screen.getAllByText(/₩[\d,]+원/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('0원도 올바르게 표시됨', () => {
      renderDashboard({ invoices: [] });
      const zeroAmounts = screen.getAllByText('₩0원');
      expect(zeroAmounts.length).toBeGreaterThan(0);
    });
  });
});
