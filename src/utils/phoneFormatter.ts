/* eslint-disable */
/**
 * 한국 전화번호 자동 포맷팅 유틸리티
 */

/**
 * 전화번호를 한국 형식으로 자동 포맷팅
 * @param value - 입력된 전화번호
 * @returns 포맷팅된 전화번호
 */
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');
  
  if (numbers.length === 0) return '';
  
  // 길이에 따른 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    // 010-1234 형태
    if (numbers.startsWith('02')) {
      // 서울 지역번호 (02)
      return numbers.length <= 2 ? numbers : `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.startsWith('0')) {
      // 휴대폰 (010, 011 등) 또는 기타 지역번호
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      // 일반 번호
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
  } else if (numbers.length <= 11) {
    if (numbers.startsWith('02')) {
      // 서울 지역번호: 02-1234-5678 또는 02-123-4567
      if (numbers.length <= 9) {
        return `02-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
      } else {
        return `02-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      }
    } else if (numbers.startsWith('01')) {
      // 휴대폰: 010-1234-5678
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else if (numbers.startsWith('0')) {
      // 기타 지역번호: 031-123-4567
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else {
      // 일반 번호
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
  } else {
    // 11자리 초과시 11자리까지만 사용
    const truncated = numbers.slice(0, 11);
    if (truncated.startsWith('02')) {
      return `02-${truncated.slice(2, 6)}-${truncated.slice(6)}`;
    } else if (truncated.startsWith('01')) {
      return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7)}`;
    } else {
      return `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`;
    }
  }
};

/**
 * 전화번호 유효성 검사
 * @param phoneNumber - 검사할 전화번호
 * @returns 유효한 전화번호인지 여부
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const numbers = phoneNumber.replace(/[^\d]/g, '');
  
  // 한국 전화번호 패턴
  const patterns = [
    /^02\d{7,8}$/, // 서울 지역번호 (02-1234-5678 또는 02-123-4567)
    /^0[3-6]\d{8}$/, // 기타 지역번호 (031-123-4567)
    /^01[0-9]\d{7,8}$/, // 휴대폰 (010-1234-5678)
    /^070\d{7,8}$/, // 인터넷 전화 (070-1234-5678)
    /^1[5-9]\d{2}\d{4}$/, // 특수번호 (1588-1234)
  ];
  
  return patterns.some(pattern => pattern.test(numbers));
};