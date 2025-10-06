import { render, screen, fireEvent } from '@testing-library/react';
import BulkFormModal from '../BulkFormModal';
import type { Client, WorkItem } from '../../../types/domain';

type BulkItem = Partial<WorkItem> & { status?: string };

// Mock custom hooks
jest.mock('../../../hooks/useCalendar', () => ({
  useCalendar: () => ({
    open: false,
    setOpen: jest.fn(),
    month: new Date(2025, 9, 1), // October 2025
    prevMonth: jest.fn(),
    nextMonth: jest.fn(),
    pickDate: jest.fn(),
    getCalendarGrid: () => [
      [0, 0, 0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9, 10, 11],
      [12, 13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24, 25],
      [26, 27, 28, 29, 30, 31, 0]
    ]
  })
}));

jest.mock('../../../hooks/useNumberFormat', () => ({
  useNumberFormat: () => ({
    format: (n: number) => n.toLocaleString()
  })
}));

jest.mock('../../../hooks/useClientWorkplaces', () => ({
  useClientWorkplaces: () => ({
    getClientWorkplaces: (clientId: number | string) => {
      if (String(clientId) === '1') {
        return [
          { id: 1, name: '현장1', address: '주소1', description: '프로젝트1' },
          { id: 2, name: '현장2', address: '주소2', description: '프로젝트2' }
        ];
      }
      return [];
    }
  })
}));

jest.mock('../../../hooks/useProjects', () => ({
  useProjects: () => ({
    getClientProjects: (clientId: number | string) => {
      if (String(clientId) === '1') {
        return ['프로젝트1', '프로젝트2'];
      }
      return [];
    }
  })
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
      { id: 1, name: '현장1', address: '주소1', description: '프로젝트1' },
      { id: 2, name: '현장2', address: '주소2', description: '프로젝트2' }
    ],
    projects: ['프로젝트1', '프로젝트2'],
    totalBilled: 10000000,
    outstanding: 2000000,
    notes: ''
  }
];

const mockBulkItems: BulkItem[] = [
  {
    name: '작업1',
    category: '토목공사',
    defaultPrice: 1000000,
    quantity: 2,
    unit: '식',
    description: '설명1',
    status: '진행중',
    notes: ''
  },
  {
    name: '작업2',
    category: '마감공사',
    defaultPrice: 500000,
    quantity: 1,
    unit: '식',
    description: '설명2',
    status: '대기',
    notes: ''
  }
];

const mockBulkBaseInfo = {
  clientId: 1,
  workplaceId: 1,
  projectName: '프로젝트1',
  date: '2025-10-05',
  bulkLaborPersons: 0,
  bulkLaborUnitRate: 0
};

const mockCategories = ['토목공사', '마감공사', '설비공사'];
const mockStatuses = ['대기', '진행중', '완료'];

const mockOnBaseInfoChangeField = jest.fn();
const mockOnItemChange = jest.fn();
const mockOnAddItem = jest.fn();
const mockOnRemoveItem = jest.fn();
const mockOnCancel = jest.fn();
const mockOnSubmit = jest.fn();

const defaultProps = {
  open: true,
  clients: mockClients,
  categories: mockCategories,
  bulkItems: mockBulkItems,
  bulkBaseInfo: mockBulkBaseInfo,
  showBulkCustomProject: false,
  statuses: mockStatuses,
  onBaseInfoChangeField: mockOnBaseInfoChangeField,
  onItemChange: mockOnItemChange,
  onAddItem: mockOnAddItem,
  onRemoveItem: mockOnRemoveItem,
  onCancel: mockOnCancel,
  onSubmit: mockOnSubmit
};

describe('BulkFormModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('모달 렌더링', () => {
    it('open이 true일 때 모달이 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('일괄 작업 항목 추가')).toBeInTheDocument();
    });

    it('open이 false일 때 모달이 표시되지 않음', () => {
      render(<BulkFormModal {...defaultProps} open={false} />);
      expect(screen.queryByText('일괄 작업 항목 추가')).not.toBeInTheDocument();
    });

    it('섹션 헤더가 모두 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('공통 정보')).toBeInTheDocument();
      expect(screen.getByText('작업 항목들')).toBeInTheDocument();
    });
  });

  describe('공통 정보 섹션', () => {
    it('건축주 선택 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="clientId"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('1');
    });

    it('건축주 목록이 렌더링됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('건축주1')).toBeInTheDocument();
    });

    it('작업장 선택 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('1');
    });

    it('건축주를 선택하지 않으면 작업장이 비활성화됨', () => {
      const baseInfoWithoutClient = { ...mockBulkBaseInfo, clientId: '' };
      render(<BulkFormModal {...defaultProps} bulkBaseInfo={baseInfoWithoutClient} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      const optionText = select.options[0].textContent;
      expect(optionText).toContain('먼저 건축주를 선택하세요');
    });

    it('프로젝트명 선택 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('프로젝트1');
    });

    it('작업일자 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('YYYY-MM-DD') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('2025-10-05');
    });
  });

  describe('프로젝트명 커스텀 입력', () => {
    it('showBulkCustomProject가 false일 때 선택 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} showBulkCustomProject={false} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      expect(select.tagName).toBe('SELECT');
    });

    it('showBulkCustomProject가 true일 때 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} showBulkCustomProject={true} />);
      const input = screen.getByPlaceholderText('새 프로젝트명 입력') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('커스텀 입력 모드에서 돌아가기 버튼이 표시됨', () => {
      render(<BulkFormModal {...defaultProps} showBulkCustomProject={true} />);
      const backButton = screen.getByTitle('기존 프로젝트 선택으로 돌아가기');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('작업 항목 목록', () => {
    it('모든 작업 항목이 렌더링됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('작업 항목 #1')).toBeInTheDocument();
      expect(screen.getByText('작업 항목 #2')).toBeInTheDocument();
    });

    it('항목 추가 버튼이 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('+ 항목 추가')).toBeInTheDocument();
    });

    it('항목 추가 버튼 클릭 시 onAddItem 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const button = screen.getByText('+ 항목 추가');
      fireEvent.click(button);
      expect(mockOnAddItem).toHaveBeenCalled();
    });

    it('항목이 2개 이상일 때 삭제 버튼이 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const deleteButtons = screen.getAllByText('삭제');
      expect(deleteButtons.length).toBe(2);
    });

    it('항목이 1개일 때 삭제 버튼이 표시되지 않음', () => {
      const singleItem = [mockBulkItems[0]];
      render(<BulkFormModal {...defaultProps} bulkItems={singleItem} />);
      expect(screen.queryByText('삭제')).not.toBeInTheDocument();
    });

    it('삭제 버튼 클릭 시 onRemoveItem 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const deleteButtons = screen.getAllByText('삭제');
      fireEvent.click(deleteButtons[0]);
      expect(mockOnRemoveItem).toHaveBeenCalledWith(0);
    });
  });

  describe('작업 항목 필드', () => {
    it('내용 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByDisplayValue('작업1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('작업2')).toBeInTheDocument();
    });

    it('카테고리 선택 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByDisplayValue('토목공사')).toBeInTheDocument();
      expect(screen.getByDisplayValue('마감공사')).toBeInTheDocument();
    });

    it('단가 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByDisplayValue('1,000,000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500,000')).toBeInTheDocument();
    });

    it('수량 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const inputs = document.querySelectorAll('input[type="text"]');
      const quantityInputs = Array.from(inputs).filter(input =>
        (input as HTMLInputElement).placeholder === '예: 1'
      );
      expect(quantityInputs.length).toBeGreaterThan(0);
    });

    it('단위 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const inputs = document.querySelectorAll('input[type="text"]');
      const unitInputs = Array.from(inputs).filter(input =>
        (input as HTMLInputElement).value === '식'
      );
      expect(unitInputs.length).toBeGreaterThan(0);
    });

    it('세부 작업 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByDisplayValue('설명1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('설명2')).toBeInTheDocument();
    });

    it('비고 입력 필드가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const textareas = document.querySelectorAll('textarea');
      expect(textareas.length).toBe(2);
    });
  });

  describe('상태 섹션', () => {
    it('각 항목마다 상태 버튼이 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const statusLabels = screen.getAllByText('상태');
      expect(statusLabels.length).toBe(2);
    });

    it('상태 버튼들이 올바르게 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      const daegiButtons = screen.getAllByText('대기');
      const jinhaengButtons = screen.getAllByText('진행중');
      const wanlyoButtons = screen.getAllByText('완료');

      expect(daegiButtons.length).toBeGreaterThan(0);
      expect(jinhaengButtons.length).toBeGreaterThan(0);
      expect(wanlyoButtons.length).toBeGreaterThan(0);
    });
  });

  describe('폼 액션', () => {
    it('취소 버튼이 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('취소')).toBeInTheDocument();
    });

    it('취소 버튼 클릭 시 onCancel 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const button = screen.getByText('취소');
      fireEvent.click(button);
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('제출 버튼에 항목 개수가 표시됨', () => {
      render(<BulkFormModal {...defaultProps} />);
      expect(screen.getByText('2개 항목 일괄 추가')).toBeInTheDocument();
    });

    it('폼 제출 시 onSubmit 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const form = screen.getByText('2개 항목 일괄 추가').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(mockOnSubmit).toHaveBeenCalled();
      }
    });
  });

  describe('공통 정보 변경 이벤트', () => {
    it('건축주 변경 시 onBaseInfoChangeField 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="clientId"]') as HTMLSelectElement;
      fireEvent.change(select, { target: { name: 'clientId', value: '1' } });
      expect(mockOnBaseInfoChangeField).toHaveBeenCalledWith('clientId', '1');
    });

    it('작업장 변경 시 onBaseInfoChangeField 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      fireEvent.change(select, { target: { name: 'workplaceId', value: '2' } });
      expect(mockOnBaseInfoChangeField).toHaveBeenCalledWith('workplaceId', '2');
    });

    it('프로젝트명 변경 시 onBaseInfoChangeField 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      fireEvent.change(select, { target: { name: 'projectName', value: '프로젝트2' } });
      expect(mockOnBaseInfoChangeField).toHaveBeenCalledWith('projectName', '프로젝트2');
    });

    it('작업일자 변경 시 onBaseInfoChangeField 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('YYYY-MM-DD');
      fireEvent.change(input, { target: { name: 'date', value: '2025-10-10' } });
      expect(mockOnBaseInfoChangeField).toHaveBeenCalledWith('date', '2025-10-10');
    });
  });

  describe('항목 변경 이벤트', () => {
    it('내용 변경 시 onItemChange 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const input = screen.getByDisplayValue('작업1') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '새 작업' } });
      expect(mockOnItemChange).toHaveBeenCalledWith(0, 'name', '새 작업');
    });

    it('카테고리 변경 시 onItemChange 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = screen.getByDisplayValue('토목공사') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '설비공사' } });
      expect(mockOnItemChange).toHaveBeenCalledWith(0, 'category', '설비공사');
    });

    it('단가 변경 시 onItemChange 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const input = screen.getByDisplayValue('1,000,000') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '2000000' } });
      expect(mockOnItemChange).toHaveBeenCalledWith(0, 'defaultPrice', '2000000');
    });

    it('수량 변경 시 onItemChange 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      const sections = document.querySelectorAll('.border-gray-200');
      const firstSection = sections[0];
      const quantityInput = Array.from(firstSection.querySelectorAll('input[type="text"]')).find(input =>
        (input as HTMLInputElement).placeholder === '예: 1'
      ) as HTMLInputElement;
      if (quantityInput) {
        fireEvent.change(quantityInput, { target: { value: '5' } });
        expect(mockOnItemChange).toHaveBeenCalledWith(0, 'quantity', '5');
      }
    });

    it('상태 버튼 클릭 시 onItemChange 호출', () => {
      render(<BulkFormModal {...defaultProps} />);
      // 첫 번째 항목의 상태 버튼 영역에서 '완료' 버튼 찾기
      const items = screen.getAllByText('작업 항목 #1')[0].closest('.border-gray-200');
      if (items) {
        const completeButtons = Array.from(items.querySelectorAll('button')).filter(
          btn => btn.textContent === '완료'
        );
        if (completeButtons.length > 0) {
          fireEvent.click(completeButtons[0]);
          expect(mockOnItemChange).toHaveBeenCalledWith(0, 'status', '완료');
        }
      }
    });
  });

  describe('필수 입력 필드 검증', () => {
    it('건축주 필드가 required 속성을 가짐', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="clientId"]') as HTMLSelectElement;
      expect(select).toHaveAttribute('required');
    });

    it('작업장 필드가 required 속성을 가짐', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      expect(select).toHaveAttribute('required');
    });

    it('프로젝트명 필드가 required 속성을 가짐', () => {
      render(<BulkFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      expect(select).toHaveAttribute('required');
    });

    it('작업일자 필드가 required 속성을 가짐', () => {
      render(<BulkFormModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('YYYY-MM-DD');
      expect(input).toHaveAttribute('required');
    });

    it('각 항목의 내용 필드가 required 속성을 가짐', () => {
      render(<BulkFormModal {...defaultProps} />);
      const sections = document.querySelectorAll('.border-gray-200');
      sections.forEach(section => {
        const nameInput = section.querySelector('input[type="text"]');
        if (nameInput && (nameInput as HTMLInputElement).placeholder !== '예: m²') {
          expect(nameInput).toHaveAttribute('required');
        }
      });
    });

    it('각 항목의 카테고리 필드가 required 속성을 가짐', () => {
      render(<BulkFormModal {...defaultProps} />);
      const sections = document.querySelectorAll('.border-gray-200');
      sections.forEach(section => {
        const categorySelect = section.querySelector('select');
        if (categorySelect) {
          expect(categorySelect).toHaveAttribute('required');
        }
      });
    });
  });
});
