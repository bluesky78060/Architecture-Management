/* eslint-disable */
import { useNumberFormat } from '../useNumberFormat';

describe('useNumberFormat', () => {
  it('formats numbers with thousands separators', () => {
    const { format } = useNumberFormat();
    expect(format(0)).toBe('0');
    expect(format(1000)).toBe('1,000');
    expect(format(-1000)).toBe('-1,000');
    expect(format('12,345')).toBe('12,345');
    expect(format(null as unknown as number)).toBe('');
    expect(format('')).toBe('');
  });

  it('parses strings into integers safely', () => {
    const { parse } = useNumberFormat();
    expect(parse('')).toBe(0);
    expect(parse('0')).toBe(0);
    expect(parse('1,234원')).toBe(1234);
    expect(parse('-1,000')).toBe(-1000);
    expect(parse('abc')).toBe(0);
  });
});

