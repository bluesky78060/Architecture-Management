import React, { useState } from 'react';

interface Material {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  status: string;
}

const Materials: React.FC = () => {
  const [materials] = useState<Material[]>([
    {
      id: 1,
      name: '시멘트',
      category: '건설자재',
      quantity: 150,
      unit: '포',
      unitPrice: 8000,
      supplier: '한국시멘트',
      status: '재고있음'
    },
    {
      id: 2,
      name: '철근 (16mm)',
      category: '철강자재',
      quantity: 50,
      unit: '톤',
      unitPrice: 850000,
      supplier: '포스코',
      status: '재고있음'
    },
    {
      id: 3,
      name: '모래',
      category: '골재',
      quantity: 200,
      unit: 'm³',
      unitPrice: 15000,
      supplier: '성남골재',
      status: '재고부족'
    },
    {
      id: 4,
      name: '벽돌',
      category: '건설자재',
      quantity: 5000,
      unit: '개',
      unitPrice: 300,
      supplier: '대한벽돌',
      status: '재고있음'
    }
  ]);

  const getTotalValue = (quantity: number, unitPrice: number): string => {
    return (quantity * unitPrice).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">자재 관리</h1>
          <p className="text-gray-600">건설 자재의 재고와 공급 현황을 관리하세요</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            재고 조정
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded">
            + 새 자재
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 자재 종류</p>
              <p className="text-3xl font-bold text-gray-900">{materials.length}건</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-2xl">
              📦
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">재고 부족 품목</p>
              <p className="text-3xl font-bold text-red-600">
                {materials.filter(m => m.status === '재고부족').length}건
              </p>
            </div>
            <div className="bg-red-500 rounded-full p-3 text-white text-2xl">
              ⚠️
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">총 재고 가치</p>
              <p className="text-3xl font-bold text-green-600">
                {materials.reduce((total, material) => 
                  total + (material.quantity * material.unitPrice), 0
                ).toLocaleString()}원
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white text-2xl">
              💰
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                자재명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                재고량
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                단가
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 가치
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                공급업체
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.map((material) => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{material.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{material.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {material.quantity.toLocaleString()} {material.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">
                    {material.unitPrice.toLocaleString()}원/{material.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {getTotalValue(material.quantity, material.unitPrice)}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{material.supplier}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    material.status === '재고있음' ? 'bg-green-100 text-green-800' :
                    material.status === '재고부족' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {material.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-2">편집</button>
                  <button className="text-green-600 hover:text-green-900 mr-2">주문</button>
                  <button className="text-red-600 hover:text-red-900">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Materials;