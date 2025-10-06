import { render, screen, fireEvent } from '@testing-library/react';
import WorkItemsTable from '../WorkItemsTable';
import type { WorkItem } from '../../../types/domain';
import type { Id } from '../../../hooks/useSelection';

// Mock Tooltip component
jest.mock('../../Tooltip', () => {
  return function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
    return <div title={label}>{children}</div>;
  };
});

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

const mockSelection = {
  selected: [] as Id[],
  toggleAll: jest.fn(),
  toggleOne: jest.fn()
};

const mockFormat = (n: number) => n.toLocaleString();
const mockGetLaborCost = jest.fn(() => 0);
const mockGetCategoryColor = jest.fn((category?: string) => 'bg-gray-100 text-gray-800');
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnCreateInvoice = jest.fn();

const defaultProps = {
  items: mockWorkItems,
  selection: mockSelection,
  format: mockFormat,
  getLaborCost: mockGetLaborCost,
  getCategoryColor: mockGetCategoryColor,
  onEdit: mockOnEdit,
  onDelete: mockOnDelete,
  onCreateInvoice: mockOnCreateInvoice
};

describe('WorkItemsTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('테이블이 렌더링됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('테이블 헤더가 올바르게 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const headers = screen.getAllByText(/건\s*축\s*주/);
      expect(headers.length).toBeGreaterThan(0);
      expect(screen.getByText(/내\s*용/)).toBeInTheDocument();
      expect(screen.getByText(/작\s*업\s*장/)).toBeInTheDocument();
      expect(screen.getByText('프로젝트')).toBeInTheDocument();
      expect(screen.getByText('카테고리')).toBeInTheDocument();
    });

    it('작업 항목 데이터가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(screen.getByText('작업1')).toBeInTheDocument();
      expect(screen.getByText('작업2')).toBeInTheDocument();
      const clientNames = screen.getAllByText('건축주1');
      expect(clientNames.length).toBeGreaterThan(0);
    });
  });

  describe('전체 선택', () => {
    it('전체 선택 체크박스가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);

      const selectAllCheckbox = Array.from(checkboxes).find(
        cb => (cb as HTMLInputElement).title === '전체 선택'
      );
      expect(selectAllCheckbox).toBeInTheDocument();
    });

    it('전체 선택 클릭 시 toggleAll 호출', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      const selectAllCheckbox = Array.from(checkboxes).find(
        cb => (cb as HTMLInputElement).title === '전체 선택'
      ) as HTMLInputElement;

      fireEvent.click(selectAllCheckbox);
      expect(mockSelection.toggleAll).toHaveBeenCalled();
    });
  });

  describe('개별 선택', () => {
    it('개별 선택 체크박스가 각 행에 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      // 전체 선택 + 2개 항목 = 3개
      expect(checkboxes.length).toBe(3);
    });

    it('개별 선택 클릭 시 toggleOne 호출', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      const itemCheckbox = checkboxes[1] as HTMLInputElement; // 첫 번째 항목

      fireEvent.click(itemCheckbox);
      expect(mockSelection.toggleOne).toHaveBeenCalledWith(1, true);
    });
  });

  describe('카테고리 표시', () => {
    it('카테고리 배지가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(screen.getByText('토목공사')).toBeInTheDocument();
      expect(screen.getByText('마감공사')).toBeInTheDocument();
    });

    it('getCategoryColor가 호출됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(mockGetCategoryColor).toHaveBeenCalledWith('토목공사');
      expect(mockGetCategoryColor).toHaveBeenCalledWith('마감공사');
    });
  });

  describe('가격 표시', () => {
    it('단가가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const prices = screen.getAllByText(/1,000,000원/);
      expect(prices.length).toBeGreaterThan(0);
    });

    it('수량과 단위가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(screen.getByText('× 2 식')).toBeInTheDocument();
      expect(screen.getByText('× 1 식')).toBeInTheDocument();
    });

    it('format 함수가 호출됨', () => {
      const mockFormatSpy = jest.fn((n: number) => n.toLocaleString());
      render(<WorkItemsTable {...defaultProps} format={mockFormatSpy} />);
      expect(mockFormatSpy).toHaveBeenCalled();
    });
  });

  describe('상태 표시', () => {
    it('상태 배지가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(screen.getByText('진행중')).toBeInTheDocument();
      expect(screen.getByText('완료')).toBeInTheDocument();
    });

    it('완료 상태는 초록색 배지', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const completedBadge = screen.getByText('완료');
      expect(completedBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('진행중 상태는 파란색 배지', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const inProgressBadge = screen.getByText('진행중');
      expect(inProgressBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('날짜 표시', () => {
    it('작업 날짜가 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(screen.getByText('2025-10-05')).toBeInTheDocument();
      expect(screen.getByText('2025-10-04')).toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('편집 버튼이 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const editButtons = screen.getAllByTitle('작업 항목 편집');
      expect(editButtons.length).toBe(2);
    });

    it('삭제 버튼이 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('작업 항목 삭제');
      expect(deleteButtons.length).toBe(2);
    });

    it('완료 항목에만 청구서 생성 버튼이 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const invoiceButtons = screen.getAllByTitle('청구서 생성');
      // 완료 상태 1개만 청구서 생성 버튼이 있어야 함
      expect(invoiceButtons.length).toBeGreaterThan(0);
    });

    it('편집 버튼 클릭 시 onEdit 호출', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const editButtons = screen.getAllByTitle('작업 항목 편집');
      fireEvent.click(editButtons[0]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockWorkItems[0]);
    });

    it('삭제 버튼 클릭 시 onDelete 호출', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('작업 항목 삭제');
      fireEvent.click(deleteButtons[0]);
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    it('청구서 생성 버튼 클릭 시 onCreateInvoice 호출', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const invoiceButtons = screen.queryAllByTitle('청구서 생성');
      // 완료 항목의 청구서 생성 버튼이 있는지 확인
      expect(invoiceButtons.length).toBeGreaterThan(0);
    });
  });

  describe('빈 상태', () => {
    it('항목이 없을 때도 테이블이 렌더링됨', () => {
      render(<WorkItemsTable {...defaultProps} items={[]} />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('항목이 없을 때 tbody가 비어있음', () => {
      render(<WorkItemsTable {...defaultProps} items={[]} />);
      const tbody = document.querySelector('tbody');
      expect(tbody?.children.length).toBe(0);
    });
  });

  describe('인부임 계산', () => {
    it('getLaborCost가 각 항목에 대해 호출됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(mockGetLaborCost).toHaveBeenCalledWith(mockWorkItems[0]);
      expect(mockGetLaborCost).toHaveBeenCalledWith(mockWorkItems[1]);
    });

    it('인부임이 총액에 포함됨', () => {
      const mockGetLaborCostWithValue = jest.fn(() => 100000);
      render(<WorkItemsTable {...defaultProps} getLaborCost={mockGetLaborCostWithValue} />);

      // 작업1: 1,000,000 * 2 + 100,000 = 2,100,000
      const amounts = screen.getAllByText(/2,100,000원/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  describe('프로젝트 정보', () => {
    it('프로젝트명이 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const projects = screen.getAllByText('프로젝트1');
      expect(projects.length).toBeGreaterThan(0);
    });

    it('작업장명이 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      const workplaces = screen.getAllByText('현장1');
      expect(workplaces.length).toBeGreaterThan(0);
    });
  });

  describe('설명 표시', () => {
    it('작업 설명이 표시됨', () => {
      render(<WorkItemsTable {...defaultProps} />);
      expect(screen.getByText('설명1')).toBeInTheDocument();
      expect(screen.getByText('설명2')).toBeInTheDocument();
    });
  });
});
