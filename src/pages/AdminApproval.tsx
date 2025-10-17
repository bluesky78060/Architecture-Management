import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';

interface ApprovalUser {
  id: string;
  user_id: string;
  email: string;
  provider: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

const AdminApproval: React.FC = () => {
  const [users, setUsers] = useState<ApprovalUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async (): Promise<void> => {
    if (supabase === null) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error !== null) {
        console.error('사용자 목록 조회 실패:', error);
        return;
      }

      if (data !== null) {
        setUsers(data);
      }
    } catch (err: unknown) {
      console.error('사용자 목록 조회 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleApprove = async (userId: string): Promise<void> => {
    if (supabase === null) {
      return;
    }

    setProcessingId(userId);

    try {
      const { error } = await supabase
        .from('user_approvals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error !== null) {
        console.error('승인 실패:', error);
        alert('승인 처리 중 오류가 발생했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchUsers();
      alert('승인되었습니다!');
    } catch (err: unknown) {
      console.error('승인 중 오류:', err);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string): Promise<void> => {
    if (supabase === null) {
      return;
    }

    if (!window.confirm('정말 거부하시겠습니까?')) {
      return;
    }

    setProcessingId(userId);

    try {
      const { error } = await supabase
        .from('user_approvals')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error !== null) {
        console.error('거부 실패:', error);
        alert('거부 처리 중 오류가 발생했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchUsers();
      alert('거부되었습니다.');
    } catch (err: unknown) {
      console.error('거부 중 오류:', err);
      alert('거부 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">사용자 승인 관리</h1>

      {/* Pending Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <ClockIcon className="h-6 w-6 text-yellow-600 mr-2" />
          승인 대기 중 ({pendingUsers.length})
        </h2>
        {pendingUsers.length === 0 ? (
          <p className="text-gray-500">대기 중인 사용자가 없습니다.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    로그인 방식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { void handleApprove(user.user_id); }}
                        disabled={processingId === user.user_id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        승인
                      </button>
                      <button
                        onClick={() => { void handleReject(user.user_id); }}
                        disabled={processingId === user.user_id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        거부
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
          승인 완료 ({approvedUsers.length})
        </h2>
        {approvedUsers.length === 0 ? (
          <p className="text-gray-500">승인된 사용자가 없습니다.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    로그인 방식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    승인일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.approved_at !== null ? new Date(user.approved_at).toLocaleString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
            거부됨 ({rejectedUsers.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    로그인 방식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거부일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rejectedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.rejected_at !== null ? new Date(user.rejected_at).toLocaleString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApproval;
