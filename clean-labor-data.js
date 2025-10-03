// 브라우저 개발자 도구에서 실행할 스크립트
// localStorage에서 인부임 별도 항목을 제거하는 스크립트

console.log('청구서 데이터 정리 시작...');

// 인부임 별도 항목을 필터링하는 함수
const filterLaborItems = (workItems) => {
  if (!Array.isArray(workItems)) return workItems;
  return workItems.filter(item => {
    const name = item.name || '';
    const isLaborItem = name.includes('일반: 일반') || 
                       name.includes('숙련: 숙련') || 
                       name.includes('인부임:') ||
                       name.includes('일반 인부') ||
                       name.includes('숙련 인부');
    
    if (isLaborItem) {
      console.log('제거할 인부임 항목:', name);
    }
    
    return !isLaborItem;
  });
};

// 청구서 데이터 정리 함수
const cleanInvoiceData = (invoices) => {
  if (!Array.isArray(invoices)) return invoices;
  return invoices.map(invoice => ({
    ...invoice,
    workItems: filterLaborItems(invoice.workItems || [])
  }));
};

// 현재 사용자의 청구서 데이터 가져오기
const currentUser = localStorage.getItem('CURRENT_USER');
let invoicesKey = 'INVOICES'; // 기본값

if (currentUser) {
  invoicesKey = `USER_${currentUser}_INVOICES`;
}

console.log('사용 중인 키:', invoicesKey);

// 기존 청구서 데이터 가져오기
const existingInvoices = localStorage.getItem(invoicesKey);
if (!existingInvoices) {
  console.log('청구서 데이터가 없습니다.');
} else {
  try {
    const invoices = JSON.parse(existingInvoices);
    console.log('기존 청구서 개수:', invoices.length);
    
    let totalRemovedItems = 0;
    const cleanedInvoices = invoices.map(invoice => {
      const originalCount = invoice.workItems ? invoice.workItems.length : 0;
      const cleanedWorkItems = filterLaborItems(invoice.workItems || []);
      const removedCount = originalCount - cleanedWorkItems.length;
      totalRemovedItems += removedCount;
      
      if (removedCount > 0) {
        console.log(`청구서 ${invoice.id}: ${removedCount}개 인부임 항목 제거`);
      }
      
      return {
        ...invoice,
        workItems: cleanedWorkItems
      };
    });
    
    // 정리된 데이터를 localStorage에 저장
    localStorage.setItem(invoicesKey, JSON.stringify(cleanedInvoices));
    
    console.log(`총 ${totalRemovedItems}개의 인부임 별도 항목이 제거되었습니다.`);
    console.log('청구서 데이터 정리 완료! 페이지를 새로고침하세요.');
    
  } catch (error) {
    console.error('데이터 정리 중 오류 발생:', error);
  }
}