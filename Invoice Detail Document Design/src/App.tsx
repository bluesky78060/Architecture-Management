import React from 'react';

// 샘플 데이터
const invoiceData = {
  invoice_id: "INV-2025-001",
  client: "김철수",
  project: "단독 주택 신축",
  address: "서울시 강남구 역삼동 123-45",
  issued_at: "2025-05-21",
  items: [
    {
      title: "내부 칸막이",
      desc: "내부 칸막이벽 설치",
      category: "내부공사",
      qty: 3,
      unit: "개",
      unit_price: 200000,
      total: 600000,
      note: "소방 규정 준수 확인 필요"
    },
    {
      title: "전기공사",
      desc: "전기 배선 및 조명 설치",
      category: "내부공사",
      qty: 4,
      unit: "개",
      unit_price: 120000,
      total: 480000,
      note: "소방 규정 준수 확인 필요"
    },
    {
      title: "마감재 설치",
      desc: "천장 및 벽면 마감재 설치",
      category: "내부공사",
      qty: 3,
      unit: "개",
      unit_price: 200000,
      total: 600000,
      note: "소방 규정 준수 확인 필요"
    }
  ],
  grand_total: 1680000
};

// 숫자를 천 단위 콤마로 형식화하는 함수
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* 상단 제목 영역 */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold">
            청구서 상세 - {invoiceData.invoice_id}
          </h1>
        </div>

        {/* 기본 정보 블록 */}
        <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-200">
          <div className="space-y-4">
            <div>
              <span className="font-bold text-gray-700">건축주:</span>
              <span className="ml-2 text-gray-900">{invoiceData.client}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">프로젝트:</span>
              <span className="ml-2 text-gray-900">{invoiceData.project}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="font-bold text-gray-700">발행일:</span>
              <span className="ml-2 text-gray-900">{invoiceData.issued_at}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">작업장 주소:</span>
              <span className="ml-2 text-gray-900">{invoiceData.address}</span>
            </div>
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* 테이블 헤더 */}
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">
                  내용
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  카테고리
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  수량
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  단위
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">
                  단가
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800">
                  합계
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  비고
                </th>
              </tr>
            </thead>
            {/* 테이블 본문 */}
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.desc}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                    {item.category}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                    {formatNumber(item.qty)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                    {item.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                    {formatNumber(item.unit_price)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                    {formatNumber(item.total)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-600">
                    {item.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 합계 영역 */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-xl font-bold text-gray-800">총 합계 : </span>
              <span className="text-xl font-bold text-blue-600">
                {formatNumber(invoiceData.grand_total)}원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}