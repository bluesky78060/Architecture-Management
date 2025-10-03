import { formatPhoneNumber, isValidPhoneNumber } from '../phoneFormatter';

describe('formatPhoneNumber', () => {
  it('returns empty string when no digits present', () => {
    expect(formatPhoneNumber('abc')).toBe('');
  });

  it('preserves short mobile inputs without trailing hyphen', () => {
    expect(formatPhoneNumber('010123')).toBe('010-123');
  });

  it('formats Seoul area numbers correctly', () => {
    expect(formatPhoneNumber('0212345678')).toBe('02-1234-5678');
  });

  it('formats non-Seoul area numbers with middle block of 3 digits', () => {
    expect(formatPhoneNumber('0311234567')).toBe('031-123-4567');
  });

  it('normalizes long input by truncating to 11 digits', () => {
    expect(formatPhoneNumber('010123456789')).toBe('010-1234-5678');
  });
});

describe('isValidPhoneNumber', () => {
  it('accepts mobile numbers', () => {
    expect(isValidPhoneNumber('010-1234-5678')).toBe(true);
  });

  it('accepts seoul area numbers with 9 digits', () => {
    expect(isValidPhoneNumber('021234567')).toBe(true);
  });

  it('accepts special service numbers', () => {
    expect(isValidPhoneNumber('1588-5678')).toBe(true);
  });

  it('rejects numbers that are too short', () => {
    expect(isValidPhoneNumber('0101234')).toBe(false);
  });
});
