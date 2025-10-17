import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';

const POLL_INTERVAL_MS = 30000; // 30 seconds

interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected';
  email: string;
  provider: string;
  created_at: string;
}

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkApprovalStatus = async (): Promise<void> => {
      if (supabase === null) {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user === null) {
          navigate('/login');
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

          // If approved, redirect to dashboard
          if (approval.status === 'approved') {
            navigate('/');
          }
        }
      } catch (err: unknown) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    void checkApprovalStatus();

    // Poll every 30 seconds to check if user has been approved
    const interval = setInterval(() => {
      void checkApprovalStatus();
    }, POLL_INTERVAL_MS);

    return () => { clearInterval(interval); };
  }, [navigate]);

  const handleLogout = async (): Promise<void> => {
    if (supabase === null) {
      return;
    }

    await supabase.auth.signOut();
    navigate('/login');
  };

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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white">로딩 중...</p>
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
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center font-['Pacifico']">
              건축 관리 시스템
            </h1>
          </div>

          {/* Status Content */}
          <div className="px-8 py-10">
            {approvalStatus?.status === 'pending' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-yellow-100 rounded-full p-4">
                    <ClockIcon className="h-16 w-16 text-yellow-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
                  승인 대기 중
                </h2>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>{approvalStatus.email}</strong> 계정이 등록되었습니다.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    관리자의 승인을 기다리고 있습니다. 승인이 완료되면 자동으로 로그인됩니다.
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    로그인 방식: {approvalStatus.provider === 'google' ? 'Google' : approvalStatus.provider === 'kakao' ? 'Kakao' : approvalStatus.provider}
                  </p>
                  <p className="text-xs text-gray-500">
                    등록일: {new Date(approvalStatus.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </>
            )}

            {approvalStatus?.status === 'rejected' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-red-100 rounded-full p-4">
                    <ExclamationCircleIcon className="h-16 w-16 text-red-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
                  접근 거부됨
                </h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>{approvalStatus.email}</strong> 계정의 접근 요청이 거부되었습니다.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    자세한 내용은 시스템 관리자에게 문의하세요.
                  </p>
                </div>
              </>
            )}

            {approvalStatus === null && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-full p-4">
                    <ExclamationCircleIcon className="h-16 w-16 text-gray-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
                  승인 정보 없음
                </h2>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    승인 정보를 찾을 수 없습니다. 다시 로그인해주세요.
                  </p>
                </div>
              </>
            )}

            {/* Logout Button */}
            <button
              onClick={() => { void handleLogout(); }}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-md"
            >
              로그아웃
            </button>

            {/* Auto-refresh info */}
            {approvalStatus?.status === 'pending' && (
              <p className="text-xs text-gray-500 text-center mt-4">
                30초마다 자동으로 승인 상태를 확인합니다.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-sm mt-6 drop-shadow-lg">
          © 2024 건축 관리 시스템. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
