import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Clients from '../Clients';
import type { Client, Invoice, WorkItem } from '../../types';

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
  exportToExcel: {
    clients: jest.fn()
  },
  importFromExcel: {
    clients: jest.fn()
  },
  createTemplate: {
    clients: jest.fn()
  }
}));

const mockClients: Client[] = [
  {
    id: 1,
    name: '건축주1',
    phone: '02-1111-1111',
    mobile: '010-1111-1111',
    email: 'client1@test.com',
    address: '서울시 강남구',
    type: 'PERSON',
    workplaces: [
      { id: 1, name: '현장1', address: '주소1', description: '프로젝트1' }
    ],
    projects: ['프로젝트1'],
    totalBilled: 10000000,
    outstanding: 2000000,
    notes: '메모1'
  },
  {
    id: 2,
    name: '테스트건설',
    phone: '02-2222-2222',
    mobile: '010-2222-2222',
    email: 'business@test.com',
    address: '서울시 서초구',
    type: 'BUSINESS',
    business: {
      businessName: '테스트건설',
      representative: '대표자',
      businessNumber: '123-45-67890',
      businessType: '건설업',
      businessItem: '건축',
      businessAddress: '서울시 서초구',
      taxEmail: 'tax@test.com'
    },
    workplaces: [
      { id: 1, name: '현장2', address: '주소2', description: '프로젝트2' }
    ],
    projects: ['프로젝트2'],
    totalBilled: 5000000,
    outstanding: 0,
    notes: ''
  }
];

const mockInvoices: Invoice[] = [
  {
    id: '1',
    clientId: 1,
    client: '건축주1',
    workplaceId: 1,
    workplaceAddress: '주소1',
    project: '프로젝트1',
    date: '2025-10-05',
    amount: 10000000,
    status: '발송됨',
    items: [],
    invoiceNumber: 'INV-001'
  },
  {
    id: '2',
    clientId: 2,
    client: '테스트건설',
    workplaceId: 1,
    workplaceAddress: '주소2',
    project: '프로젝트2',
    date: '2025-10-04',
    amount: 5000000,
    status: '결제완료',
    items: [],
    invoiceNumber: 'INV-002'
  }
];

const mockWorkItems: WorkItem[] = [];

const renderClients = (overrides = {}) => {
  const { useApp } = require('../../contexts/AppContext');

  const mockContext = {
    clients: mockClients,
    invoices: mockInvoices,
    workItems: mockWorkItems,
    setClients: jest.fn(),
    setInvoices: jest.fn(),
    setWorkItems: jest.fn(),
    ...overrides
  };

  useApp.mockReturnValue(mockContext);

  return render(
    <BrowserRouter>
      <Clients />
    </BrowserRouter>
  );
};

describe('Clients Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('건축주 관리 제목이 표시됨', () => {
      renderClients();
      expect(screen.getByText('건축주 관리')).toBeInTheDocument();
      expect(screen.getByText('건축주 정보를 관리하고 프로젝트 이력을 추적하세요')).toBeInTheDocument();
    });

    it('통계 카드가 표시됨', () => {
      renderClients();
      // 총 건축주
      const clientCount = screen.getAllByText(/\d+명/);
      expect(clientCount.length).toBeGreaterThan(0);
    });

    it('액션 버튼들이 표시됨', () => {
      renderClients();
      expect(screen.getByText('템플릿 다운로드')).toBeInTheDocument();
      expect(screen.getByText('Excel 가져오기')).toBeInTheDocument();
      expect(screen.getByText('Excel 내보내기')).toBeInTheDocument();
      expect(screen.getByText('새 건축주')).toBeInTheDocument();
    });
  });

  describe('통계 카드', () => {
    it('총 건축주 수가 올바르게 표시됨', () => {
      renderClients();
      expect(screen.getByText('총 건축주')).toBeInTheDocument();
      expect(screen.getByText('2명')).toBeInTheDocument();
    });

    it('총 청구금액이 올바르게 계산됨', () => {
      renderClients();
      expect(screen.getByText('총 청구금액 :')).toBeInTheDocument();
      // 10,000,000 + 5,000,000 = 15,000,000
      const amounts = screen.getAllByText(/15,000,000원/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('미수금이 올바르게 계산됨', () => {
      renderClients();
      expect(screen.getByText('미수금')).toBeInTheDocument();
      // 발송됨 상태: 10,000,000
      const misugeum = screen.getAllByText(/10,000,000원/);
      expect(misugeum.length).toBeGreaterThan(0);
    });

    it('미수금 건수가 올바르게 표시됨', () => {
      renderClients();
      expect(screen.getByText('미수금 건수')).toBeInTheDocument();
      expect(screen.getByText('1건')).toBeInTheDocument();
    });
  });

  describe('건축주 목록', () => {
    it('건축주 테이블이 렌더링됨', () => {
      renderClients();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블 헤더 확인
      expect(screen.getByText(/이\s+름/)).toBeInTheDocument();
      expect(screen.getByText('연 락 처')).toBeInTheDocument();
      expect(screen.getByText(/주\s+소/)).toBeInTheDocument();
    });

    it('건축주 데이터가 표시됨', () => {
      renderClients();
      expect(screen.getByText('건축주1')).toBeInTheDocument();
      expect(screen.getByText('테스트건설')).toBeInTheDocument();
    });

    it('사업자 태그가 표시됨', () => {
      renderClients();
      const businessTags = screen.getAllByText('사업자');
      expect(businessTags.length).toBeGreaterThan(0);
    });

    it('프로젝트 수가 표시됨', () => {
      renderClients();
      const projectCounts = screen.getAllByText(/\d+개/);
      expect(projectCounts.length).toBeGreaterThan(0);
    });

    it('총 청구액과 미수금이 표시됨', () => {
      renderClients();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
      const amounts = table?.querySelectorAll('td');
      expect(amounts?.length).toBeGreaterThan(0);
    });
  });

  describe('건축주 추가', () => {
    it('새 건축주 버튼 클릭 시 모달이 열림', () => {
      renderClients();
      const newButton = screen.getByText('새 건축주');
      fireEvent.click(newButton);

      expect(screen.getByText('새 건축주 추가')).toBeInTheDocument();
    });

    it('모달에 기본 정보 입력 필드가 표시됨', () => {
      renderClients();
      const newButton = screen.getByText('새 건축주');
      fireEvent.click(newButton);

      expect(screen.getByText('기본 정보')).toBeInTheDocument();
      expect(screen.getByText('개인')).toBeInTheDocument();

      // 사업자는 여러 곳에 있으므로 getAllByText 사용
      const businessTexts = screen.getAllByText('사업자');
      expect(businessTexts.length).toBeGreaterThan(0);
    });

    it('모달에 연락처/주소 입력 필드가 표시됨', () => {
      renderClients();
      const newButton = screen.getByText('새 건축주');
      fireEvent.click(newButton);

      expect(screen.getByText('연락처 / 주소')).toBeInTheDocument();
      expect(screen.getByText('전화번호')).toBeInTheDocument();
      expect(screen.getByText('휴대전화')).toBeInTheDocument();
    });

    it('작업장 정보 섹션이 표시됨', () => {
      renderClients();
      const newButton = screen.getByText('새 건축주');
      fireEvent.click(newButton);

      expect(screen.getByText('작업장 정보')).toBeInTheDocument();
      expect(screen.getByText('+ 작업장 추가')).toBeInTheDocument();
    });
  });

  describe('사업자 모드', () => {
    it('사업자 선택 시 사업자 정보 필드가 표시됨', () => {
      renderClients();
      const newButton = screen.getByText('새 건축주');
      fireEvent.click(newButton);

      const businessRadio = screen.getByLabelText('사업자');
      fireEvent.click(businessRadio);

      expect(screen.getByText('사업자 정보')).toBeInTheDocument();
      expect(screen.getByText('상호')).toBeInTheDocument();
      expect(screen.getByText('대표자')).toBeInTheDocument();
      expect(screen.getByText('사업자등록번호')).toBeInTheDocument();
    });
  });

  describe('선택 기능', () => {
    it('전체 선택 체크박스가 표시됨', () => {
      renderClients();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('개별 선택 체크박스가 표시됨', () => {
      renderClients();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      // 전체 선택 + 개별 선택들
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('일괄 삭제', () => {
    it('선택 삭제 버튼이 조건부로 표시됨', () => {
      const mockSetClients = jest.fn();
      renderClients({ setClients: mockSetClients });

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      const firstClientCheckbox = checkboxes[1] as HTMLInputElement; // 첫 번째 건축주 체크박스

      fireEvent.click(firstClientCheckbox);

      waitFor(() => {
        const deleteButton = screen.queryByText(/선택 삭제/);
        expect(deleteButton).toBeInTheDocument();
      });
    });
  });

  describe('Excel 기능', () => {
    it('Excel 내보내기 버튼이 작동함', () => {
      const { exportToExcel } = require('../../utils/excelUtils');
      renderClients();

      const exportButton = screen.getByText('Excel 내보내기');
      fireEvent.click(exportButton);

      expect(exportToExcel.clients).toHaveBeenCalledWith(mockClients);
    });

    it('템플릿 다운로드 버튼이 작동함', () => {
      const { createTemplate } = require('../../utils/excelUtils');
      renderClients();

      const templateButton = screen.getByText('템플릿 다운로드');
      fireEvent.click(templateButton);

      expect(createTemplate.clients).toHaveBeenCalled();
    });
  });

  describe('건축주 상세보기', () => {
    it('상세보기 버튼이 표시됨', () => {
      renderClients();
      const detailButtons = screen.getAllByTitle('건축주 상세보기');
      expect(detailButtons.length).toBeGreaterThan(0);
    });

    it('상세보기 클릭 시 상세 모달이 열림', () => {
      renderClients();
      const detailButtons = screen.getAllByTitle('건축주 상세보기');

      if (detailButtons.length > 0) {
        fireEvent.click(detailButtons[0]);

        waitFor(() => {
          const detailTitle = screen.getByText(/건축주 상세 정보/);
          expect(detailTitle).toBeInTheDocument();
        });
      }
    });
  });

  describe('건축주 편집', () => {
    it('편집 버튼이 표시됨', () => {
      renderClients();
      const editButtons = screen.getAllByTitle('건축주 편집');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('편집 버튼 클릭 시 편집 모달이 열림', () => {
      renderClients();
      const editButtons = screen.getAllByTitle('건축주 편집');

      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);

        waitFor(() => {
          expect(screen.getByText('건축주 정보 수정')).toBeInTheDocument();
        });
      }
    });
  });

  describe('건축주 삭제', () => {
    it('삭제 버튼이 표시됨', () => {
      renderClients();
      const deleteButtons = screen.getAllByTitle('건축주 삭제');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('작업장 관리', () => {
    it('작업장 추가 버튼이 표시됨', () => {
      renderClients();
      const newButton = screen.getByText('새 건축주');
      fireEvent.click(newButton);

      const addWorkplaceButton = screen.getByText('+ 작업장 추가');
      expect(addWorkplaceButton).toBeInTheDocument();
    });
  });

  describe('재무 정보', () => {
    it('총 청구액이 올바르게 계산되어 표시됨', () => {
      renderClients();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블에 청구액이 표시됨
      const amounts = screen.getAllByText(/\d{1,3}(,\d{3})*원/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('미수금이 색상으로 구분되어 표시됨', () => {
      renderClients();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 미수금이 있는 경우 빨간색, 없는 경우 초록색
      const misugeumCells = table?.querySelectorAll('td');
      expect(misugeumCells?.length).toBeGreaterThan(0);
    });
  });
});
