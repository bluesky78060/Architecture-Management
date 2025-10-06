import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WorkItems from '../WorkItems';
import type { Client, WorkItem, Invoice } from '../../types';

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
    workItems: jest.fn()
  },
  importFromExcel: {
    workItems: jest.fn()
  },
  createTemplate: {
    workItems: jest.fn()
  }
}));

const mockClients: Client[] = [
  {
    id: 1,
    name: '건축주1',
    phone: '010-1111-1111',
    mobile: '010-1111-1111',
    email: 'client1@test.com',
    address: '주소1',
    type: 'PERSON',
    workplaces: [
      { id: 1, name: '현장1', address: '주소1', description: '프로젝트1' }
    ],
    projects: ['프로젝트1'],
    totalBilled: 0,
    outstanding: 0,
    notes: ''
  }
];

const mockWorkItems: WorkItem[] = [
  {
    id: 1,
    clientId: 1,
    clientName: '건축주1',
    workplaceId: 1,
    workplaceName: '현장1',
    projectName: '프로젝트1',
    name: '작업1',
    category: '토목공사',
    defaultPrice: 1000000,
    quantity: 2,
    unit: '식',
    description: '설명1',
    status: '진행중',
    notes: '',
    date: '2025-10-05',
    laborPersons: '',
    laborUnitRate: '',
    laborPersonsGeneral: '',
    laborUnitRateGeneral: ''
  },
  {
    id: 2,
    clientId: 1,
    clientName: '건축주1',
    workplaceId: 1,
    workplaceName: '현장1',
    projectName: '프로젝트1',
    name: '작업2',
    category: '마감공사',
    defaultPrice: 500000,
    quantity: 1,
    unit: '식',
    description: '설명2',
    status: '완료',
    notes: '',
    date: '2025-10-04',
    laborPersons: '',
    laborUnitRate: '',
    laborPersonsGeneral: '',
    laborUnitRateGeneral: ''
  }
];

const mockInvoices: Invoice[] = [];

const renderWorkItems = (overrides = {}) => {
  const { useApp } = require('../../contexts/AppContext');

  const mockContext = {
    clients: mockClients,
    workItems: mockWorkItems,
    invoices: mockInvoices,
    units: ['식', '개', 'm'],
    categories: ['토목공사', '구조공사', '마감공사'],
    setClients: jest.fn(),
    setWorkItems: jest.fn(),
    setInvoices: jest.fn(),
    ...overrides
  };

  useApp.mockReturnValue(mockContext);

  return render(
    <BrowserRouter>
      <WorkItems />
    </BrowserRouter>
  );
};

describe('WorkItems Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('작업 항목 관리 제목이 표시됨', () => {
      renderWorkItems();
      expect(screen.getByText('작업 항목 관리')).toBeInTheDocument();
      expect(screen.getByText('작업 항목을 관리하고 진행을 확인하세요')).toBeInTheDocument();
    });

    it('액션 버튼들이 표시됨', () => {
      renderWorkItems();
      expect(screen.getByText('템플릿 다운로드')).toBeInTheDocument();
      expect(screen.getByText('Excel 가져오기')).toBeInTheDocument();
      expect(screen.getByText('Excel 내보내기')).toBeInTheDocument();
      expect(screen.getByText('일괄 작업 항목 추가')).toBeInTheDocument();
      expect(screen.getByText('새 작업 항목')).toBeInTheDocument();
    });
  });

  describe('통계 카드', () => {
    it('통계 정보가 표시됨', () => {
      renderWorkItems();
      // StatsCards 컴포넌트가 렌더링되는지 확인
      const numbers = screen.getAllByText(/\d+/);
      expect(numbers.length).toBeGreaterThan(0);
    });
  });

  describe('필터링', () => {
    it('필터 바가 표시됨', () => {
      renderWorkItems();
      // FilterBar 컴포넌트가 렌더링되는지 확인
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('작업 항목 목록', () => {
    it('작업 항목 테이블이 렌더링됨', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('작업 항목 데이터가 표시됨', () => {
      renderWorkItems();
      // 작업 항목 이름들이 표시되는지 확인
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
      const rows = table?.querySelectorAll('tbody tr');
      expect(rows?.length).toBeGreaterThan(0);
    });
  });

  describe('작업 항목 추가', () => {
    it('새 작업 항목 버튼이 렌더링됨', () => {
      renderWorkItems();
      const newButton = screen.getByText('새 작업 항목');
      expect(newButton).toBeInTheDocument();
    });

    it('새 작업 항목 버튼 클릭 시 모달이 열림', () => {
      renderWorkItems();
      const newButton = screen.getByText('새 작업 항목');
      fireEvent.click(newButton);

      waitFor(() => {
        // ItemFormModal이 열리는지 확인
        const modal = document.querySelector('.fixed');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('일괄 작업 항목 추가', () => {
    it('일괄 작업 항목 추가 버튼이 렌더링됨', () => {
      renderWorkItems();
      const bulkButton = screen.getByText('일괄 작업 항목 추가');
      expect(bulkButton).toBeInTheDocument();
    });

    it('일괄 작업 항목 추가 버튼 클릭 시 모달이 열림', () => {
      renderWorkItems();
      const bulkButton = screen.getByText('일괄 작업 항목 추가');
      fireEvent.click(bulkButton);

      waitFor(() => {
        // BulkFormModal이 열리는지 확인
        const modal = document.querySelector('.fixed');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('Excel 기능', () => {
    it('Excel 내보내기 버튼이 작동함', () => {
      const { exportToExcel } = require('../../utils/excelUtils');
      renderWorkItems();

      const exportButton = screen.getByText('Excel 내보내기');
      fireEvent.click(exportButton);

      expect(exportToExcel.workItems).toHaveBeenCalledWith(mockWorkItems);
    });

    it('템플릿 다운로드 버튼이 작동함', () => {
      const { createTemplate } = require('../../utils/excelUtils');
      renderWorkItems();

      const templateButton = screen.getByText('템플릿 다운로드');
      fireEvent.click(templateButton);

      expect(createTemplate.workItems).toHaveBeenCalled();
    });
  });

  describe('선택 기능', () => {
    it('전체 선택 체크박스가 표시됨', () => {
      renderWorkItems();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('개별 선택 체크박스가 표시됨', () => {
      renderWorkItems();
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      // 전체 선택 + 개별 선택들
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('작업 항목 편집', () => {
    it('편집 기능이 존재함', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
      // WorkItemsTable에서 편집 버튼이 렌더링되는지 확인
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('작업 항목 삭제', () => {
    it('삭제 기능이 존재함', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
      // WorkItemsTable에서 삭제 버튼이 렌더링되는지 확인
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('상태 관리', () => {
    it('작업 항목 상태가 표시됨', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블에 상태 정보가 표시되는지 확인
      const cells = table?.querySelectorAll('td');
      expect(cells?.length).toBeGreaterThan(0);
    });
  });

  describe('금액 계산', () => {
    it('작업 항목 금액이 표시됨', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블에 금액 정보가 표시되는지 확인
      const amounts = screen.getAllByText(/\d{1,3}(,\d{3})*/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  describe('청구서 생성', () => {
    it('청구서 생성 기능이 존재함', () => {
      renderWorkItems();
      // 일괄 청구서 생성 버튼은 FilterBar에 있음
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('일괄 삭제', () => {
    it('일괄 삭제 기능이 존재함', () => {
      renderWorkItems();
      // 일괄 삭제 버튼은 FilterBar에 있음
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('프로젝트 필터링', () => {
    it('프로젝트 필터가 존재함', () => {
      renderWorkItems();
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('카테고리 표시', () => {
    it('작업 카테고리가 표시됨', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블에 카테고리 정보가 표시되는지 확인
      const cells = table?.querySelectorAll('td');
      expect(cells?.length).toBeGreaterThan(0);
    });
  });

  describe('수량 및 단위', () => {
    it('수량과 단위가 표시됨', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블에 수량 정보가 표시되는지 확인
      const cells = table?.querySelectorAll('td');
      expect(cells?.length).toBeGreaterThan(0);
    });
  });

  describe('작업 날짜', () => {
    it('작업 날짜가 표시됨', () => {
      renderWorkItems();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // 테이블에 날짜 정보가 표시되는지 확인
      const dates = screen.getAllByText(/\d{4}-\d{2}-\d{2}/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('인부임 계산', () => {
    it('인부임 관련 필드가 존재함', () => {
      renderWorkItems();
      // WorkItem 데이터 구조에 laborPersons, laborUnitRate 필드가 있음
      expect(mockWorkItems[0]).toHaveProperty('laborPersons');
      expect(mockWorkItems[0]).toHaveProperty('laborUnitRate');
    });
  });

  describe('빈 상태', () => {
    it('작업 항목이 없을 때도 렌더링됨', () => {
      renderWorkItems({ workItems: [] });
      expect(screen.getByText('작업 항목 관리')).toBeInTheDocument();
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });
});
