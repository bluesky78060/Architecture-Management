import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
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
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [users, setUsers] = useState<ApprovalUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 관리자가 아니면 접근 거부
  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  const fetchUsers = async (): Promise<void> => {
    if (supabase === null) {
      /* eslint-disable no-console */
      console.error('❌ [AdminApproval] Supabase is null');
      /* eslint-enable no-console */
      return;
    }

    try {
      /* eslint-disable no-console */
      console.log('🔵 [AdminApproval] Fetching user approvals...');
      /* eslint-enable no-console */

      const { data, error } = await supabase
        .from('user_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      /* eslint-disable no-console */
      console.log('🔵 [AdminApproval] Query result:', { data, error });
      /* eslint-enable no-console */

      if (error !== null) {
        /* eslint-disable no-console */
        console.error('❌ [AdminApproval] Error fetching users:', error);
        /* eslint-enable no-console */
        alert(`사용자 목록 로딩 실패: ${error.message}`);
        return;
      }

      if (data !== null) {
        /* eslint-disable no-console */
        console.log('✅ [AdminApproval] Successfully loaded users:', data.length, 'users');
        /* eslint-enable no-console */
        setUsers(data);
      }
    } catch (err: unknown) {
      /* eslint-disable no-console */
      console.error('❌ [AdminApproval] Exception:', err);
      /* eslint-enable no-console */
      alert('사용자 목록 로딩 중 예외 발생');
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
        alert('승인 처리 중 오류가 발생했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchUsers();
      alert('승인되었습니다!');
    } catch (err: unknown) {
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
        alert('거부 처리 중 오류가 발생했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchUsers();
      alert('거부되었습니다.');
    } catch (err: unknown) {
      alert('거부 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (userId: string): Promise<void> => {
    if (supabase === null) {
      return;
    }

    if (!window.confirm('승인 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setProcessingId(userId);

    try {
      const { error } = await supabase
        .from('user_approvals')
        .delete()
        .eq('user_id', userId);

      if (error !== null) {
        alert('삭제 처리 중 오류가 발생했습니다.');
        return;
      }

      // 목록 새로고침
      await fetchUsers();
      alert('삭제되었습니다.');
    } catch (err: unknown) {
      alert('삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  // 관리자가 아니면 렌더링하지 않음
  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">사용자 승인 관리</h1>

      {/* Pending Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
          <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
          승인 대기 중 ({pendingUsers.length})
        </h2>
        {pendingUsers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">대기 중인 사용자가 없습니다.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    로그인 방식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
          승인 완료 ({approvedUsers.length})
        </h2>
        {approvedUsers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">승인된 사용자가 없습니다.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    로그인 방식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    승인일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {approvedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.approved_at !== null ? new Date(user.approved_at).toLocaleString('ko-KR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { void handleDelete(user.user_id); }}
                        disabled={processingId === user.user_id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        삭제
                      </button>
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
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            거부됨 ({rejectedUsers.length})
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    로그인 방식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    거부일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rejectedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.provider === 'google' ? 'Google' : user.provider === 'kakao' ? 'Kakao' : user.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.rejected_at !== null ? new Date(user.rejected_at).toLocaleString('ko-KR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { void handleDelete(user.user_id); }}
                        disabled={processingId === user.user_id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        삭제
                      </button>
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
