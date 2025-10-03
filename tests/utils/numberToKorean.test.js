const { numberToKorean } = require('../../src/utils/numberToKorean');

describe('numberToKorean', () => {
  test('0 -> 영', () => {
    expect(numberToKorean(0)).toBe('영');
  });

  test('1 -> 일', () => {
    expect(numberToKorean(1)).toBe('일');
  });

  test('10 -> 십', () => {
    expect(numberToKorean(10)).toBe('십');
  });

  test('11 -> 십일', () => {
    expect(numberToKorean(11)).toBe('십일');
  });

  test('105 -> 일백오십', () => {
    expect(numberToKorean(105)).toBe('일백오십');
  });

  test('10000 -> 일만', () => {
    expect(numberToKorean(10000)).toBe('일만');
  });

  test('123456789 -> 일억이천삼백사십오만육천칠백팔십구', () => {
    expect(numberToKorean(123456789)).toBe('일억이천삼백사십오만육천칠백팔십구');
  });

  test('-1234 -> 마이너스 일천이백삼십사', () => {
    expect(numberToKorean(-1234)).toBe('마이너스 일천이백삼십사');
  });
});

