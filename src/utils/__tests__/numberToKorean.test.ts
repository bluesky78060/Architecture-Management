/* eslint-disable */
import { numberToKorean } from '../numberToKorean';

describe('numberToKorean', () => {
  it('returns 영 for 0', () => {
    expect(numberToKorean(0)).toBe('영');
  });

  it('handles single digits', () => {
    expect(numberToKorean(7)).toBe('칠');
  });

  it('omits the leading 일 in tens place', () => {
    expect(numberToKorean(10)).toBe('십');
    expect(numberToKorean(17)).toBe('십칠');
  });

  it('formats numbers across multiple groups', () => {
    expect(numberToKorean(123456789)).toBe('일억이천삼백사십오만육천칠백팔십구');
  });

  it('omits empty groups when building result', () => {
    expect(numberToKorean(1002003)).toBe('일백만이천삼');
  });

  it('preserves minus sign for negative numbers', () => {
    expect(numberToKorean(-305)).toBe('마이너스 삼백오');
  });
});
