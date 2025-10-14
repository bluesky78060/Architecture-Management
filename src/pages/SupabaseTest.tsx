import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface TableCount {
  table: string;
  count: number;
  error?: string;
}

const SupabaseTest: React.FC = () => {
  const [counts, setCounts] = useState<TableCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleData, setSampleData] = useState<any>(null);

  useEffect(() => {
    const checkData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const tables = ['clients', 'estimates', 'invoices', 'work_items', 'company_info'];
      const results: TableCount[] = [];

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            results.push({ table, count: 0, error: error.message });
          } else {
            results.push({ table, count: count ?? 0 });
          }
        } catch (err: any) {
          results.push({ table, count: 0, error: err.message });
        }
      }

      setCounts(results);

      // clients 테이블의 샘플 데이터 조회
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .limit(5);

        if (!error && data) {
          setSampleData(data);
        }
      } catch (err) {
        // 샘플 데이터 조회 실패
      }

      setLoading(false);
    };

    checkData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Supabase 데이터 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-900 mb-2">⚠️ Supabase 연결 안됨</h2>
          <p className="text-red-700">Supabase가 초기화되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Supabase 데이터 확인</h1>

      {/* 테이블별 데이터 카운트 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">테이블별 데이터 개수</h2>
        <div className="space-y-3">
          {counts.map((item) => (
            <div key={item.table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-medium text-gray-700 capitalize">{item.table}</span>
                {item.error && (
                  <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                    오류: {item.error}
                  </span>
                )}
              </div>
              <span className={`text-xl font-bold ${item.count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {item.count} 건
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 샘플 데이터 표시 */}
      {sampleData && sampleData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">샘플 데이터 (Clients)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대표자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleData.map((client: any) => (
                  <tr key={client.client_id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{client.client_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{client.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.representative || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!sampleData || sampleData.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-yellow-900 mb-2">📭 데이터 없음</h2>
          <p className="text-yellow-700">아직 Supabase에 저장된 데이터가 없습니다.</p>
          <p className="text-sm text-yellow-600 mt-2">
            현재 앱은 localStorage를 사용하고 있어 Supabase에 데이터가 저장되지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;
