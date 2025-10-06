/* eslint-disable */
import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { useFilters } from '../useFilters';

function Harness({ onReady }: PropsWithChildren<{ onReady: (api: ReturnType<typeof useFilters>) => void }>) {
  const api = useFilters();
  onReady(api);
  return (
    <div>
      <span data-testid="active">{String(api.isActive)}</span>
      <span data-testid="count">{api.countLabel(10, 3)}</span>
    </div>
  );
}

describe('useFilters', () => {
  let container: HTMLDivElement;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('tracks active state, reset, and countLabel', () => {
    let ref!: ReturnType<typeof useFilters>;
    act(() => {
      ReactDOM.render(<Harness onReady={(api) => (ref = api)} />, container);
    });

    const get = (id: string) => container.querySelector(`[data-testid="${id}"]`) as HTMLElement;
    expect(get('active').textContent).toBe('false');
    expect(get('count').textContent).toBe('총 10개');

    act(() => {
      ref.setSelectedClient('client-1');
    });

    expect(get('active').textContent).toBe('true');
    expect(get('count').textContent).toBe('3개');

    act(() => {
      ref.reset();
    });

    expect(ref.selectedClient).toBe('');
    expect(ref.selectedStatus).toBe('');
    expect(get('active').textContent).toBe('false');
    expect(get('count').textContent).toBe('총 10개');
  });
});
