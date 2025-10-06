/* eslint-disable */
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { useModalState } from '../useModalState';

function Harness({ onReady }: { onReady: (api: ReturnType<typeof useModalState>) => void }) {
  const api = useModalState();
  onReady(api);
  return null;
}

describe('useModalState', () => {
  let container: HTMLDivElement;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('opens, closes, toggles and resets modal states', () => {
    let ref!: ReturnType<typeof useModalState>;
    act(() => {
      ReactDOM.render(<Harness onReady={(api) => (ref = api)} />, container);
    });

    act(() => ref.open('A'));
    expect(ref.isOpen('A')).toBe(true);

    act(() => ref.toggle('A'));
    expect(ref.isOpen('A')).toBe(false);

    act(() => ref.close('A'));
    expect(ref.isOpen('A')).toBe(false);

    act(() => ref.open('B'));
    expect(ref.isOpen('B')).toBe(true);

    act(() => ref.reset());
    expect(ref.isOpen('A')).toBe(false);
    expect(ref.isOpen('B')).toBe(false);
  });
});

