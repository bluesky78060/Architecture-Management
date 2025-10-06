import { render, screen, fireEvent, within } from '@testing-library/react';
import ItemFormModal from '../ItemFormModal';
import type { Client, WorkItem } from '../../../types/domain';

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

const mockNewItem: WorkItem = {
  id: 0,
  clientId: 1,
  clientName: '건축주1',
  workplaceId: 1,
  workplaceName: '현장1',
  projectName: '프로젝트1',
  name: '작업1',
  category: '토목공사',
  defaultPrice: 1000000 as number,
  quantity: 2 as number,
  unit: '식',
  description: '설명1',
  status: '진행중',
  notes: '',
  date: '2025-10-05',
  laborPersons: 0 as number,
  laborUnitRate: 0 as number,
  laborPersonsGeneral: 0 as number,
  laborUnitRateGeneral: 0 as number
};

const mockUnits = ['식', 'm²', 'm³', '대', '개'];
const mockCategories = ['토목공사', '마감공사', '설비공사'];
const mockStatuses = ['대기', '진행중', '완료'];

const mockOnChangeField = jest.fn();
const mockOnCancel = jest.fn();
const mockOnSubmit = jest.fn();
const mockGetLaborCost = jest.fn(() => 0);

const defaultProps = {
  open: true,
  editingItem: null,
  newItem: mockNewItem,
  clients: mockClients,
  units: mockUnits,
  categories: mockCategories,
  statuses: mockStatuses,
  onChangeField: mockOnChangeField,
  onCancel: mockOnCancel,
  onSubmit: mockOnSubmit,
  getLaborCost: mockGetLaborCost
};

describe('ItemFormModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('모달 렌더링', () => {
    it('open이 true일 때 모달이 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      expect(screen.getByText('새 작업 항목 추가')).toBeInTheDocument();
    });

    it('open이 false일 때 모달이 표시되지 않음', () => {
      render(<ItemFormModal {...defaultProps} open={false} />);
      expect(screen.queryByText('새 작업 항목 추가')).not.toBeInTheDocument();
    });

    it('편집 모드일 때 제목이 변경됨', () => {
      render(<ItemFormModal {...defaultProps} editingItem={mockNewItem} />);
      expect(screen.getByText('작업 항목 편집')).toBeInTheDocument();
    });

    it('섹션 헤더가 모두 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      expect(screen.getByText('기본 정보')).toBeInTheDocument();
      expect(screen.getByText('작업 정보')).toBeInTheDocument();
      expect(screen.getByText('상태')).toBeInTheDocument();
    });
  });

  describe('기본 정보 섹션', () => {
    it('건축주 선택 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = screen.getByDisplayValue('건축주1') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.name).toBe('clientId');
      expect(select.value).toBe('1');
    });

    it('건축주 목록이 렌더링됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      expect(screen.getByText('건축주1')).toBeInTheDocument();
    });

    it('작업장 선택 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('1');
    });

    it('건축주를 선택하지 않으면 작업장이 비활성화됨', () => {
      const itemWithoutClient = { ...mockNewItem, clientId: '' as unknown as number };
      render(<ItemFormModal {...defaultProps} newItem={itemWithoutClient} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      const optionText = select.options[0].textContent;
      expect(optionText).toContain('먼저 건축주를 선택하세요');
    });

    it('프로젝트 선택/입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
    });

    it('카테고리 선택 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="category"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('토목공사');
    });
  });

  describe('작업 정보 섹션', () => {
    it('작업일자 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('YYYY-MM-DD') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('2025-10-05');
    });

    it('내용 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="name"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('작업1');
    });

    it('세부 작업 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="description"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('설명1');
    });

    it('수량 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('2');
    });

    it('단위 선택 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="unit"]') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('식');
    });

    it('단가 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="defaultPrice"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('1,000,000');
    });

    it('합계가 계산되어 표시됨', () => {
      const testItem = { ...mockNewItem, defaultPrice: 1000000, quantity: 2 };
      render(<ItemFormModal {...defaultProps} newItem={testItem} getLaborCost={() => 0} />);
      expect(screen.getByText('합계')).toBeInTheDocument();
      const totalDiv = document.querySelector('.bg-gray-100');
      expect(totalDiv?.textContent).toContain('2,000,000');
    });
  });

  describe('인부임 필드', () => {
    it('숙련 인부 인원 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="laborPersons"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('숙련 인부 단가 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="laborUnitRate"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('일반 인부 인원 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="laborPersonsGeneral"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('일반 인부 단가 입력 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="laborUnitRateGeneral"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('인부비가 있을 때 소계가 표시됨', () => {
      const mockGetLaborCostWithValue = jest.fn(() => 500000);
      render(<ItemFormModal {...defaultProps} getLaborCost={mockGetLaborCostWithValue} />);
      expect(screen.getByText(/인부비 소계:/)).toBeInTheDocument();
      const text = screen.getByText(/인부비 소계:/).textContent;
      expect(text).toContain('500,000');
    });

    it('인부비가 0일 때 소계가 표시되지 않음', () => {
      render(<ItemFormModal {...defaultProps} getLaborCost={() => 0} />);
      expect(screen.queryByText(/인부비 소계:/)).not.toBeInTheDocument();
    });
  });

  describe('상태 섹션', () => {
    it('상태 버튼들이 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      expect(screen.getByText('대기')).toBeInTheDocument();
      expect(screen.getByText('진행중')).toBeInTheDocument();
      expect(screen.getByText('완료')).toBeInTheDocument();
    });

    it('현재 상태 버튼이 활성화됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const activeButton = screen.getByText('진행중');
      expect(activeButton).toHaveClass('bg-indigo-600', 'text-white');
    });

    it('상태 버튼 클릭 시 onChangeField 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const button = screen.getByText('완료');
      fireEvent.click(button);
      expect(mockOnChangeField).toHaveBeenCalledWith('status', '완료');
    });
  });

  describe('폼 액션', () => {
    it('취소 버튼이 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      expect(screen.getByText('취소')).toBeInTheDocument();
    });

    it('취소 버튼 클릭 시 onCancel 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const button = screen.getByText('취소');
      fireEvent.click(button);
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('추가 모드일 때 추가 버튼이 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      expect(screen.getByText('추가')).toBeInTheDocument();
    });

    it('편집 모드일 때 수정 버튼이 표시됨', () => {
      render(<ItemFormModal {...defaultProps} editingItem={mockNewItem} />);
      expect(screen.getByText('수정')).toBeInTheDocument();
    });

    it('폼 제출 시 onSubmit 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const form = screen.getByText('추가').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(mockOnSubmit).toHaveBeenCalled();
      }
    });
  });

  describe('필드 변경 이벤트', () => {
    it('건축주 변경 시 onChangeField 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="clientId"]') as HTMLSelectElement;
      fireEvent.change(select, { target: { name: 'clientId', value: '1' } });
      expect(mockOnChangeField).toHaveBeenCalledWith('clientId', '1');
    });

    it('작업일자 변경 시 onChangeField 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('YYYY-MM-DD');
      fireEvent.change(input, { target: { name: 'date', value: '2025-10-10' } });
      expect(mockOnChangeField).toHaveBeenCalledWith('date', '2025-10-10');
    });

    it('내용 변경 시 onChangeField 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="name"]') as HTMLInputElement;
      fireEvent.change(input, { target: { name: 'name', value: '새 작업' } });
      expect(mockOnChangeField).toHaveBeenCalledWith('name', '새 작업');
    });

    it('수량 변경 시 onChangeField 호출', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement;
      fireEvent.change(input, { target: { name: 'quantity', value: '5' } });
      expect(mockOnChangeField).toHaveBeenCalledWith('quantity', '5');
    });
  });

  describe('프로젝트명 필드 동작', () => {
    it('프로젝트가 있을 때 선택 필드가 표시됨', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      expect(select.tagName).toBe('SELECT');
    });

    it('프로젝트가 없을 때 입력 필드가 표시됨', () => {
      const clientWithoutProjects = { ...mockClients[0], projects: [] };
      render(<ItemFormModal {...defaultProps} clients={[clientWithoutProjects]} />);
      const input = screen.getByPlaceholderText('프로젝트명 입력') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });
  });

  describe('합계 계산', () => {
    it('단가 × 수량으로 합계가 계산됨', () => {
      const item = { ...mockNewItem, defaultPrice: 100000, quantity: 3 };
      render(<ItemFormModal {...defaultProps} newItem={item} getLaborCost={() => 0} />);
      expect(screen.getByText(/300,000원/)).toBeInTheDocument();
    });

    it('인부비가 포함되어 합계가 계산됨', () => {
      const item = { ...mockNewItem, defaultPrice: 100000, quantity: 3 };
      const mockGetLaborCostWithValue = jest.fn(() => 50000);
      render(<ItemFormModal {...defaultProps} newItem={item} getLaborCost={mockGetLaborCostWithValue} />);
      expect(screen.getByText(/350,000원/)).toBeInTheDocument();
    });

    it('잘못된 숫자는 0으로 처리됨', () => {
      const item = { ...mockNewItem, defaultPrice: NaN, quantity: Infinity };
      render(<ItemFormModal {...defaultProps} newItem={item} getLaborCost={() => 0} />);
      expect(screen.getByText(/0원/)).toBeInTheDocument();
    });
  });

  describe('필수 입력 필드 검증', () => {
    it('건축주 필드가 required 속성을 가짐', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="clientId"]') as HTMLSelectElement;
      expect(select).toHaveAttribute('required');
    });

    it('작업장 필드가 required 속성을 가짐', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="workplaceId"]') as HTMLSelectElement;
      expect(select).toHaveAttribute('required');
    });

    it('프로젝트명 필드가 required 속성을 가짐', () => {
      render(<ItemFormModal {...defaultProps} />);
      const select = document.querySelector('select[name="projectName"]') as HTMLSelectElement;
      expect(select).toHaveAttribute('required');
    });

    it('작업일자 필드가 required 속성을 가짐', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('YYYY-MM-DD');
      expect(input).toHaveAttribute('required');
    });

    it('내용 필드가 required 속성을 가짐', () => {
      render(<ItemFormModal {...defaultProps} />);
      const input = document.querySelector('input[name="name"]') as HTMLInputElement;
      expect(input).toHaveAttribute('required');
    });
  });
});
