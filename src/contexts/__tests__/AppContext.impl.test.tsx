import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { AppProvider, useApp } from '../AppContext.impl';

jest.mock('../../services/xlsxMirror', () => ({
  scheduleMirror: jest.fn(),
}));

function Harness({ onReady }: { onReady: (api: ReturnType<typeof useApp>) => void }) {
  const ctx = useApp();
  onReady(ctx);
  return null;
}

describe('AppContext', () => {
  let container: HTMLDivElement;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    window.localStorage.clear();
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('computes invoice item with labor costs', () => {
    let api!: ReturnType<typeof useApp>;
    act(() => {
      ReactDOM.render(
        <AppProvider>
          <Harness onReady={(ctx) => (api = ctx)} />
        </AppProvider>,
        container
      );
    });

    const item = api.addWorkItemToInvoice({
      id: 1,
      clientId: 1,
      clientName: 'C',
      workplaceId: 1,
      workplaceName: 'W',
      projectName: 'P',
      name: '작업',
      category: '기타',
      defaultPrice: 1000,
      quantity: 2,
      unit: '식',
      description: '',
      status: '예정',
      date: '',
      notes: '',
      laborPersons: '2',
      laborUnitRate: '100',
      laborPersonsGeneral: '1',
      laborUnitRateGeneral: '50',
    } as any);

    // total = qty(2) * price(1000) + labor(2*100 + 1*50) = 2000 + 250 = 2250
    expect(item.total).toBe(2250);
  });

  it('converts estimate to work items and marks status', () => {
    let api!: ReturnType<typeof useApp>;
    act(() => {
      ReactDOM.render(
        <AppProvider>
          <Harness onReady={(ctx) => (api = ctx)} />
        </AppProvider>,
        container
      );
    });

    act(() => {
      api.setEstimates([
        {
          id: 'EST-1',
          clientId: 7,
          clientName: 'ACME',
          workplaceId: 9,
          workplaceName: 'Site',
          projectName: 'Proj',
          status: '초안',
          items: [
            { name: 'A', category: '기타', unitPrice: 100, quantity: 3, unit: '식', description: '', notes: '' },
          ],
          total: 300,
          date: '2024-01-01',
        } as any,
      ]);
    });

    let created: any[] = [];
    act(() => {
      created = api.convertEstimateToWorkItems('EST-1');
    });

    expect(created.length).toBe(1);
    expect(created[0].clientId).toBe(7);
    // estimates status updated
    expect(api.estimates.find((e) => e.id === 'EST-1')?.status).toBe('작업 전환됨');
  });

  it('filters completed work items by client', () => {
    let api!: ReturnType<typeof useApp>;
    act(() => {
      ReactDOM.render(
        <AppProvider>
          <Harness onReady={(ctx) => (api = ctx)} />
        </AppProvider>,
        container
      );
    });

    act(() => {
      api.setWorkItems([
        { id: 1, clientId: 1, name: 'x', status: '완료' } as any,
        { id: 2, clientId: 2, name: 'y', status: '예정' } as any,
        { id: 3, clientId: 1, name: 'z', status: '완료' } as any,
      ]);
    });

    expect(api.getCompletedWorkItems().map((i) => i.id)).toEqual([1, 3]);
    expect(api.getCompletedWorkItemsByClient(1).map((i) => i.id)).toEqual([1, 3]);
  });
});

