import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';
import { useUser } from '../contexts/UserContext';

interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected';
  email: string;
  provider: string;
  created_at: string;
}

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUser();
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 로그인되지 않은 상태면 즉시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    // 로그인되지 않았으면 approval 체크 안 함
    if (!isLoggedIn) {
      return;
    }

    const checkApprovalStatus = async (): Promise<void> => {
      if (supabase === null) {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user === null) {
          navigate('/login', { replace: true });
          return;
        }

        const { data: approval, error: approvalError } = await supabase
          .from('user_approvals')
          .select('status, email, provider, created_at')
          .eq('user_id', user.id)
          .single();

        if (approvalError !== null) {
          setLoading(false);
          return;
        }

        if (approval !== null) {
          setApprovalStatus(approval);
        }
      } catch (err: unknown) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    void checkApprovalStatus();
  }, [isLoggedIn, navigate]);

  const handleLogout = async (): Promise<void> => {
    if (supabase === null) {
      return;
    }

    await supabase.auth.signOut();
    navigate('/login');
  };

  // 로그인되지 않았으면 리다이렉트 중이므로 아무것도 렌더링하지 않음
  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {(() => {
          const envVer = process.env.REACT_APP_ASSET_VER;
          const version = (typeof envVer === 'string' && envVer.trim() !== '')
            ? envVer.trim()
            : 'v2';
          const envBg = process.env.REACT_APP_LOGIN_BG;
          const raw = (typeof envBg === 'string' && envBg.trim() !== '')
            ? envBg.trim()
            : `${process.env.PUBLIC_URL}/images/login-blueprint.png`;
          const sep = raw.includes('?') ? '&' : '?';
          const bgUrl = `${raw}${sep}${version}`;
          return (
            <div
              className="absolute inset-0 bg-center bg-cover bg-no-repeat blur-[2px] opacity-10"
              style={{ backgroundImage: `url(${bgUrl})` }}
            />
          );
        })()}
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white dark:border-gray-300"></div>
          <p className="mt-4 text-white dark:text-gray-200">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* Background with blueprint pattern */}
      {(() => {
        const envVer = process.env.REACT_APP_ASSET_VER;
        const version = (typeof envVer === 'string' && envVer.trim() !== '')
          ? envVer.trim()
          : 'v2';
        const envBg = process.env.REACT_APP_LOGIN_BG;
        const raw = (typeof envBg === 'string' && envBg.trim() !== '')
          ? envBg.trim()
          : `${process.env.PUBLIC_URL}/images/login-blueprint.png`;
        const sep = raw.includes('?') ? '&' : '?';
        const bgUrl = `${raw}${sep}${version}`;
        return (
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat blur-[2px] opacity-10"
            style={{ backgroundImage: `url(${bgUrl})` }}
          />
        );
      })()}

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white dark:text-gray-100 text-center font-['Pacifico']">
              건축 관리 시스템
            </h1>
          </div>

          {/* Status Content */}
          <div className="px-8 py-10">
            {approvalStatus?.status === 'approved' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                    <svg className="h-16 w-16 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
                  승인 완료
                </h2>
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 p-4 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>{approvalStatus.email}</strong> 계정이 승인되었습니다.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    이제 로그인하여 시스템을 사용하실 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => { void handleLogout(); }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-md mb-3"
                >
                  로그인하기
                </button>
              </>
            )}

            {approvalStatus?.status === 'pending' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4">
                    <ClockIcon className="h-16 w-16 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
                  승인 대기 중
                </h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>{approvalStatus.email}</strong> 계정이 등록되었습니다.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    관리자의 승인을 기다리고 있습니다.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    로그인 방식: {approvalStatus.provider === 'google' ? 'Google' : approvalStatus.provider === 'kakao' ? 'Kakao' : approvalStatus.provider}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    등록일: {new Date(approvalStatus.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </>
            )}

            {approvalStatus?.status === 'rejected' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
                    <ExclamationCircleIcon className="h-16 w-16 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
                  접근 거부됨
                </h2>
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>{approvalStatus.email}</strong> 계정의 접근 요청이 거부되었습니다.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    자세한 내용은 시스템 관리자에게 문의하세요.
                  </p>
                </div>
              </>
            )}

            {approvalStatus === null && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4">
                    <ExclamationCircleIcon className="h-16 w-16 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
                  승인 정보 없음
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700/50 border-l-4 border-gray-400 dark:border-gray-500 p-4 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    승인 정보를 찾을 수 없습니다. 다시 로그인해주세요.
                  </p>
                </div>
              </>
            )}

            {/* Logout Button - only for pending/rejected/null status */}
            {approvalStatus?.status !== 'approved' && (
              <button
                onClick={() => { void handleLogout(); }}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-md"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white dark:text-gray-200 text-sm mt-6 drop-shadow-lg">
          © 2024 건축 관리 시스템. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
