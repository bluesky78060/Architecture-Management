import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { supabase } from '../services/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (email.trim() === '') {
      setError('이메일을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (supabase === null) {
      setError('Supabase가 초기화되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError !== null) {
        setError('비밀번호 재설정 이메일 발송에 실패했습니다.');
      } else {
        setSuccess('비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해주세요.');
        setEmail('');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background image */}
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
            aria-hidden
            className="absolute inset-0 bg-center bg-cover bg-no-repeat bg-fixed blur-[2px]"
            style={{ backgroundImage: `url(${bgUrl})` }}
          />
        );
      })()}

      {/* Color overlay and vignette */}
      <div aria-hidden className="absolute inset-0 bg-[#0b2a53]/70 mix-blend-multiply" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-blue-900/40" />
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-7">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg mb-2">
              <LockClosedIcon className="w-6 h-6" />
            </div>
            <h1 className="font-sans font-bold text-2xl text-gray-900 mb-1 tracking-wide">비밀번호 찾기</h1>
            <p className="text-gray-600 text-sm">가입한 이메일 주소를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                이메일
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <EnvelopeIcon className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                    bg-gray-50 transition-all duration-300 ease-in-out
                    focus:outline-none focus:border-blue-500 focus:bg-white
                    focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:-translate-y-0.5
                    placeholder-gray-400
                  "
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            {error !== '' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success !== '' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold
                transition-all duration-300 ease-in-out relative overflow-hidden
                hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(59,130,246,0.3)]
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                group
              "
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600" />
              {loading ? '발송 중...' : '재설정 링크 발송'}
            </button>
          </form>

          {/* 로그인으로 돌아가기 */}
          <div className="text-center text-sm text-gray-600 mt-5">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              로그인으로 돌아가기
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>건축 관리 시스템 v2.0</p>
            <p>© 2025 Architecture Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
