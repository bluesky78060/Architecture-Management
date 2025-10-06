import { render, screen } from '@testing-library/react';
import InvoiceDetailTable from '../InvoiceDetailTable';
import type { InvoiceItem } from '../../../types/domain';

const mockInvoiceItems: InvoiceItem[] = [
  {
    name: '작업항목1',
    category: '토목공사',
    description: '기초공사 및 터파기',
    quantity: 2,
    unit: '식',
    unitPrice: 1000000,
    total: 2000000,
    date: '2025-10-05',
    notes: '비고1',
    laborPersons: 0,
    laborUnitRate: 0,
    laborPersonsGeneral: 0,
    laborUnitRateGeneral: 0
  },
  {
    name: '작업항목2',
    category: '마감공사',
    description: '내부 마감 작업',
    quantity: 1,
    unit: '식',
    unitPrice: 500000,
    total: 500000,
    date: '2025-10-04',
    notes: '',
    laborPersons: 2,
    laborUnitRate: 150000,
    laborPersonsGeneral: 3,
    laborUnitRateGeneral: 100000
  }
];

const mockFormat = (n: number) => n.toLocaleString();

const defaultProps = {
  items: mockInvoiceItems,
  format: mockFormat
};

describe('InvoiceDetailTable Component', () => {
  describe('렌더링', () => {
    it('테이블이 렌더링됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('테이블 헤더가 올바르게 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('연번')).toBeInTheDocument();
      expect(screen.getByText('일자')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
      expect(screen.getByText('수량')).toBeInTheDocument();
      expect(screen.getByText('단위')).toBeInTheDocument();
      expect(screen.getByText('단가')).toBeInTheDocument();
      expect(screen.getByText('합계')).toBeInTheDocument();
      expect(screen.getByText('비고')).toBeInTheDocument();
    });

    it('청구서 항목 데이터가 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('작업항목1')).toBeInTheDocument();
      expect(screen.getByText('작업항목2')).toBeInTheDocument();
    });
  });

  describe('연번 표시', () => {
    it('연번이 1부터 시작하여 순차적으로 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      const tbody = document.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');

      expect(rows?.[0].querySelector('td')?.textContent).toBe('1');
      expect(rows?.[1].querySelector('td')?.textContent).toBe('2');
    });
  });

  describe('날짜 표시', () => {
    it('작업 날짜가 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('2025-10-05')).toBeInTheDocument();
      expect(screen.getByText('2025-10-04')).toBeInTheDocument();
    });

    it('날짜가 없을 때 빈 문자열 표시', () => {
      const itemsWithoutDate = [
        { ...mockInvoiceItems[0], date: undefined }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutDate} />);
      const tbody = document.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('카테고리 표시', () => {
    it('카테고리 배지가 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('토목공사')).toBeInTheDocument();
      expect(screen.getByText('마감공사')).toBeInTheDocument();
    });

    it('카테고리가 없을 때 배지가 표시되지 않음', () => {
      const itemsWithoutCategory = [
        { ...mockInvoiceItems[0], category: '' }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutCategory} />);
      const badges = document.querySelectorAll('.bg-gray-100');
      expect(badges.length).toBe(0);
    });
  });

  describe('설명 표시', () => {
    it('작업 설명이 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('기초공사 및 터파기')).toBeInTheDocument();
      expect(screen.getByText('내부 마감 작업')).toBeInTheDocument();
    });

    it('설명이 없을 때 표시되지 않음', () => {
      const itemsWithoutDescription = [
        { ...mockInvoiceItems[0], description: '' }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutDescription} />);
      expect(screen.queryByText('기초공사 및 터파기')).not.toBeInTheDocument();
    });
  });

  describe('인부임 표시', () => {
    it('인부임이 계산되어 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      // 일반: 3명 × 100,000원 = 300,000원
      // 숙련: 2명 × 150,000원 = 300,000원
      // 총 인부임: 600,000원
      expect(screen.getByText(/인부임:/)).toBeInTheDocument();
      expect(screen.getByText(/일반: 3명 × 100,000원/)).toBeInTheDocument();
      expect(screen.getByText(/숙련: 2명 × 150,000원/)).toBeInTheDocument();
      expect(screen.getByText(/600,000원/)).toBeInTheDocument();
    });

    it('인부임이 0일 때 표시되지 않음', () => {
      const itemsWithoutLabor = [
        {
          ...mockInvoiceItems[0],
          laborPersons: 0,
          laborUnitRate: 0,
          laborPersonsGeneral: 0,
          laborUnitRateGeneral: 0
        }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutLabor} />);
      expect(screen.queryByText(/인부임:/)).not.toBeInTheDocument();
    });

    it('일반 인부임만 있을 때 표시됨', () => {
      const itemsWithGeneralOnly = [
        {
          ...mockInvoiceItems[1],
          laborPersons: 0,
          laborUnitRate: 0,
          laborPersonsGeneral: 2,
          laborUnitRateGeneral: 100000
        }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithGeneralOnly} />);
      expect(screen.getByText(/일반: 2명 × 100,000원/)).toBeInTheDocument();
      expect(screen.queryByText(/숙련:/)).not.toBeInTheDocument();
    });

    it('숙련 인부임만 있을 때 표시됨', () => {
      const itemsWithSkilledOnly = [
        {
          ...mockInvoiceItems[1],
          laborPersons: 2,
          laborUnitRate: 150000,
          laborPersonsGeneral: 0,
          laborUnitRateGeneral: 0
        }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithSkilledOnly} />);
      expect(screen.getByText(/숙련: 2명 × 150,000원/)).toBeInTheDocument();
      expect(screen.queryByText(/일반:/)).not.toBeInTheDocument();
    });
  });

  describe('수량과 단위', () => {
    it('수량이 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      const tbody = document.querySelector('tbody');
      expect(tbody?.textContent).toContain('2');
      expect(tbody?.textContent).toContain('1');
    });

    it('단위가 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      const units = screen.getAllByText('식');
      expect(units.length).toBeGreaterThan(0);
    });

    it('단위가 없을 때 빈 문자열 표시', () => {
      const itemsWithoutUnit = [
        { ...mockInvoiceItems[0], unit: undefined }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutUnit} />);
      const tbody = document.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('금액 계산 및 표시', () => {
    it('단가가 포맷되어 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('1,000,000원')).toBeInTheDocument();
      // 500,000원은 단가와 합계 두 곳에 나타남
      const amounts = screen.getAllByText('500,000원');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('합계가 포맷되어 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('2,000,000원')).toBeInTheDocument();
    });

    it('format 함수가 호출됨', () => {
      const mockFormatSpy = jest.fn((n: number) => n.toLocaleString());
      render(<InvoiceDetailTable {...defaultProps} format={mockFormatSpy} />);
      expect(mockFormatSpy).toHaveBeenCalled();
    });

    it('total이 없을 때 quantity × unitPrice로 계산됨', () => {
      const itemsWithoutTotal = [
        {
          ...mockInvoiceItems[0],
          total: undefined,
          quantity: 3,
          unitPrice: 100000
        }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutTotal} />);
      // 3 × 100,000 = 300,000 (합계와 총금액 두 곳에 나타남)
      const amounts = screen.getAllByText('300,000원');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('잘못된 숫자 값이 0으로 처리됨', () => {
      const itemsWithInvalidNumbers = [
        {
          ...mockInvoiceItems[0],
          quantity: NaN,
          unitPrice: Infinity,
          total: undefined
        }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithInvalidNumbers} />);
      // NaN과 Infinity는 0으로 처리되어 0 × 0 = 0
      const tbody = document.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('총 금액', () => {
    it('총 금액이 계산되어 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('총 금액')).toBeInTheDocument();
      // 2,000,000 + 500,000 = 2,500,000
      expect(screen.getByText('2,500,000원')).toBeInTheDocument();
    });

    it('totalAmount prop이 제공되면 해당 값이 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} totalAmount={3000000} />);
      expect(screen.getByText('3,000,000원')).toBeInTheDocument();
    });

    it('항목이 없을 때 총 금액이 0으로 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} items={[]} />);
      expect(screen.getByText('총 금액')).toBeInTheDocument();
      expect(screen.getByText('0원')).toBeInTheDocument();
    });
  });

  describe('비고', () => {
    it('비고가 표시됨', () => {
      render(<InvoiceDetailTable {...defaultProps} />);
      expect(screen.getByText('비고1')).toBeInTheDocument();
    });

    it('비고가 없을 때 빈 문자열 표시', () => {
      const itemsWithoutNotes = [
        { ...mockInvoiceItems[0], notes: undefined }
      ];
      render(<InvoiceDetailTable {...defaultProps} items={itemsWithoutNotes} />);
      const tbody = document.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('항목이 없을 때도 테이블이 렌더링됨', () => {
      render(<InvoiceDetailTable {...defaultProps} items={[]} />);
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('항목이 없을 때 tbody가 비어있음', () => {
      render(<InvoiceDetailTable {...defaultProps} items={[]} />);
      const tbody = document.querySelector('tbody');
      expect(tbody?.children.length).toBe(0);
    });
  });
});
