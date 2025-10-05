// 숫자를 한글로 변환하는 함수
export const numberToKorean = (number: number): string => {
  if (number === 0) return '영';

  const units = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const tens = ['', '십', '백', '천'];
  const bigUnits = ['', '만', '억', '조'];

  const convertGroup = (num: number): string => {
    let result = '';
    const digits = num.toString().split('').map(Number);
    
    for (let i = 0; i < digits.length; i++) {
      const digit = digits[i];
      const position = digits.length - 1 - i;
      
      if (digit === 0) continue;
      
      // 1의 경우 십의 자리에서는 생략
      if (digit === 1 && position === 1 && digits.length > 1) {
        result += tens[position];
      } else {
        result += units[digit] + tens[position];
      }
    }
    
    return result;
  };

  let result = '';
  const groups: number[] = [];
  let tempNumber = Math.abs(number);
  
  // 4자리씩 그룹으로 나누기
  const GROUP_BASE = 10000; // eslint-disable-line no-magic-numbers
  while (tempNumber > 0) {
    groups.unshift(tempNumber % GROUP_BASE);
    tempNumber = Math.floor(tempNumber / GROUP_BASE);
  }
  
  // 각 그룹을 한글로 변환
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group === 0) continue;
    
    const groupText = convertGroup(group);
    const unitIndex = groups.length - 1 - i;
    
    result += groupText + bigUnits[unitIndex];
  }
  
  return (number < 0 ? '마이너스 ' : '') + result;
};
