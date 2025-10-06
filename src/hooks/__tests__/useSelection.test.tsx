/* eslint-disable */
import { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { useSelection, Id } from '../useSelection';

function Harness({ allIds, onReady }: PropsWithChildren<{ allIds: Id[]; onReady: (api: ReturnType<typeof useSelection>) => void }>) {
  const api = useSelection(allIds);
  onReady(api);
  return (
    <div>
      <span data-testid="all">{String(api.allSelected)}</span>
      <span data-testid="sel">{api.selected.join(',')}</span>
    </div>
  );
}

describe('useSelection', () => {
  let container: HTMLDivElement;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('toggles one/all, clears, and reconciles with allIds changes', () => {
    let ref!: ReturnType<typeof useSelection>;
    act(() => {
      ReactDOM.render(<Harness allIds={[1, 2, 3]} onReady={(api) => (ref = api)} />, container);
    });

    const get = (id: string) => container.querySelector(`[data-testid="${id}"]`) as HTMLElement;

    // 초기 상태
    expect(get('all').textContent).toBe('false');
    expect(get('sel').textContent).toBe('');

    // 하나 선택
    act(() => ref.toggleOne(1, true));
    expect(get('sel').textContent).toBe('1');

    // 중복 추가 방지 및 해제
    act(() => ref.toggleOne(1, true));
    expect(get('sel').textContent).toBe('1');
    act(() => ref.toggleOne(1, false));
    expect(get('sel').textContent).toBe('');

    // 전체 선택/해제
    act(() => ref.toggleAll(true));
    expect(get('all').textContent).toBe('true');
    act(() => ref.toggleAll(false));
    expect(get('sel').textContent).toBe('');

    // 교집합 보정: 선택 후 목록 변경
    act(() => ref.setSelected([1, 2]));
    expect(get('sel').textContent).toBe('1,2');
    act(() => {
      ReactDOM.render(<Harness allIds={[2, 3]} onReady={(api) => (ref = api)} />, container);
    });
    // effect 동작으로 1은 제거되고 2만 유지
    expect(get('sel').textContent).toBe('2');

    act(() => ref.clear());
    expect(get('sel').textContent).toBe('');
  });
});
