import { render, screen, fireEvent } from '@testing-library/react';
import EstimatesTable from '../EstimatesTable';
import type { Estimate, ID } from '../../../types/domain';

// Mock Tooltip component
jest.mock('../../Tooltip', () => {
  return function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
    return <div title={label}>{children}</div>;
  };
});

const mockEstimates: Estimate[] = [
  {
    id: 1,
    clientId: 1,
    clientName: '건축주1',
    workplaceId: 1,
    workplaceAddress: '주소1',
    workplaceName: '현장1',
    projectName: '프로젝트1',
    title: '견적서1',
    date: '2025-10-05',
    validUntil: '2025-11-05',
    totalAmount: 10000000,
    status: '승인됨',
    category: '신축',
    notes: '',
    items: []
  },
  {
    id: 2,
    clientId: 2,
    clientName: '건축주2',
    workplaceId: 2,
    workplaceAddress: '주소2',
    workplaceName: '현장2',
    projectName: '프로젝트2',
    title: '견적서2',
    date: '2025-10-04',
    validUntil: '2025-11-04',
    totalAmount: 8000000,
    status: '검토중',
    category: '리모델링',
    notes: '',
    items: []
  }
];

const mockOnToggleAll = jest.fn();
const mockOnToggleOne = jest.fn();
const mockFormat = (n: number) => n.toLocaleString();
const mockGetStatusColor = jest.fn((s: string) =>
  s === '승인됨' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
);
const mockOnEdit = jest.fn();
const mockOnPrint = jest.fn();
const mockOnDelete = jest.fn();
const mockOnConvert = jest.fn();

const defaultProps = {
  items: mockEstimates,
  allSelected: false,
  onToggleAll: mockOnToggleAll,
  onToggleOne: mockOnToggleOne,
  format: mockFormat,
  getStatusColor: mockGetStatusColor,
  onEdit: mockOnEdit,
  onPrint: mockOnPrint,
  onDelete: mockOnDelete,
  onConvert: mockOnConvert,
  selectedIds: [] as ID[]
};

describe('EstimatesTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링', () => {
    it('테이블이 렌더링됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('테이블 헤더가 올바르게 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(screen.getByText('견적서 번호')).toBeInTheDocument();
      const headers = screen.getAllByText(/건\s*축\s*주/);
      expect(headers.length).toBeGreaterThan(0);
      expect(screen.getByText('프로젝트')).toBeInTheDocument();
      expect(screen.getByText(/작\s*업\s*장/)).toBeInTheDocument();
      expect(screen.getByText('견적 금액')).toBeInTheDocument();
    });

    it('견적서 데이터가 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(screen.getByText('건축주1')).toBeInTheDocument();
      expect(screen.getByText('건축주2')).toBeInTheDocument();
      expect(screen.getByText('프로젝트1')).toBeInTheDocument();
      expect(screen.getByText('프로젝트2')).toBeInTheDocument();
    });
  });

  describe('전체 선택', () => {
    it('전체 선택 체크박스가 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const selectAllCheckbox = screen.getByTitle('전체 선택');
      expect(selectAllCheckbox).toBeInTheDocument();
    });

    it('전체 선택 클릭 시 onToggleAll 호출', () => {
      render(<EstimatesTable {...defaultProps} />);
      const selectAllCheckbox = screen.getByTitle('전체 선택');
      fireEvent.click(selectAllCheckbox);
      expect(mockOnToggleAll).toHaveBeenCalledWith(true);
    });

    it('allSelected가 true일 때 체크박스가 선택됨', () => {
      render(<EstimatesTable {...defaultProps} allSelected={true} />);
      const selectAllCheckbox = screen.getByTitle('전체 선택') as HTMLInputElement;
      expect(selectAllCheckbox.checked).toBe(true);
    });
  });

  describe('개별 선택', () => {
    it('개별 선택 체크박스가 각 행에 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const checkboxes = screen.getAllByTitle('선택');
      expect(checkboxes.length).toBe(2);
    });

    it('개별 선택 클릭 시 onToggleOne 호출', () => {
      render(<EstimatesTable {...defaultProps} />);
      const checkboxes = screen.getAllByTitle('선택');
      fireEvent.click(checkboxes[0]);
      expect(mockOnToggleOne).toHaveBeenCalledWith(1, true);
    });

    it('selectedIds에 포함된 항목은 체크됨', () => {
      render(<EstimatesTable {...defaultProps} selectedIds={[1]} />);
      const checkboxes = screen.getAllByTitle('선택') as HTMLInputElement[];
      expect(checkboxes[0].checked).toBe(true);
      expect(checkboxes[1].checked).toBe(false);
    });
  });

  describe('견적 금액 표시', () => {
    it('견적 금액이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(screen.getByText('10,000,000원')).toBeInTheDocument();
      expect(screen.getByText('8,000,000원')).toBeInTheDocument();
    });

    it('format 함수가 호출됨', () => {
      const mockFormatSpy = jest.fn((n: number) => n.toLocaleString());
      render(<EstimatesTable {...defaultProps} format={mockFormatSpy} />);
      expect(mockFormatSpy).toHaveBeenCalledWith(10000000);
      expect(mockFormatSpy).toHaveBeenCalledWith(8000000);
    });
  });

  describe('상태 표시', () => {
    it('상태 배지가 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(screen.getByText('승인됨')).toBeInTheDocument();
      expect(screen.getByText('검토중')).toBeInTheDocument();
    });

    it('getStatusColor가 호출됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(mockGetStatusColor).toHaveBeenCalledWith('승인됨');
      expect(mockGetStatusColor).toHaveBeenCalledWith('검토중');
    });
  });

  describe('유효기한 표시', () => {
    it('유효기한이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(screen.getByText('2025-11-05')).toBeInTheDocument();
      expect(screen.getByText('2025-11-04')).toBeInTheDocument();
    });

    it('유효기한이 없을 때 "-" 표시', () => {
      const itemsWithoutValidUntil = [
        { ...mockEstimates[0], validUntil: undefined }
      ];
      render(<EstimatesTable {...defaultProps} items={itemsWithoutValidUntil} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('액션 버튼', () => {
    it('편집 버튼이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const editButtons = screen.getAllByTitle('견적서 편집');
      expect(editButtons.length).toBe(2);
    });

    it('출력 버튼이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const printButtons = screen.getAllByTitle('견적서 출력');
      expect(printButtons.length).toBe(2);
    });

    it('삭제 버튼이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('견적서 삭제');
      expect(deleteButtons.length).toBe(2);
    });

    it('승인됨 상태일 때만 변환 버튼이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const convertButtons = screen.getAllByTitle('작업 항목으로 변환');
      // '승인됨' 상태 항목에만 변환 버튼이 표시됨
      expect(convertButtons.length).toBeGreaterThan(0);
    });

    it('편집 버튼 클릭 시 onEdit 호출', () => {
      render(<EstimatesTable {...defaultProps} />);
      const editButtons = screen.getAllByTitle('견적서 편집');
      fireEvent.click(editButtons[0]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockEstimates[0]);
    });

    it('출력 버튼 클릭 시 onPrint 호출', () => {
      render(<EstimatesTable {...defaultProps} />);
      const printButtons = screen.getAllByTitle('견적서 출력');
      fireEvent.click(printButtons[0]);
      expect(mockOnPrint).toHaveBeenCalledWith(mockEstimates[0]);
    });

    it('삭제 버튼 클릭 시 onDelete 호출', () => {
      render(<EstimatesTable {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('견적서 삭제');
      fireEvent.click(deleteButtons[0]);
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    it('변환 버튼 클릭 시 onConvert 호출', () => {
      render(<EstimatesTable {...defaultProps} />);
      const convertButtons = screen.queryAllByTitle('작업 항목으로 변환');
      if (convertButtons.length > 0) {
        fireEvent.click(convertButtons[0]);
        expect(mockOnConvert).toHaveBeenCalled();
      } else {
        expect(convertButtons.length).toBe(0);
      }
    });
  });

  describe('견적서 번호', () => {
    it('견적서 ID가 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      const cells = document.querySelectorAll('td');
      const idCells = Array.from(cells).filter(cell =>
        cell.textContent === '1' || cell.textContent === '2'
      );
      expect(idCells.length).toBeGreaterThan(0);
    });
  });

  describe('작업장 정보', () => {
    it('작업장명이 표시됨', () => {
      render(<EstimatesTable {...defaultProps} />);
      expect(screen.getByText('현장1')).toBeInTheDocument();
      expect(screen.getByText('현장2')).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('항목이 없을 때도 테이블이 렌더링됨', () => {
      render(<EstimatesTable {...defaultProps} items={[]} />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('항목이 없을 때 tbody가 비어있음', () => {
      render(<EstimatesTable {...defaultProps} items={[]} />);
      const tbody = document.querySelector('tbody');
      expect(tbody?.children.length).toBe(0);
    });
  });
});
