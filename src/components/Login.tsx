import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { supabase } from '../services/supabase';

type AuthMode = 'login' | 'signup';

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (email.trim() === '' || password.trim() === '') {
      setError('이메일과 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (supabase === null) {
      setError('Supabase가 초기화되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError !== null) {
        setError(signInError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : signInError.message);
      } else if (data.user !== null) {
        setSuccess('로그인 성공!');
        // eslint-disable-next-line no-magic-numbers
        setTimeout(() => navigate('/'), 500);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (email.trim() === '' || password.trim() === '' || name.trim() === '') {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    // eslint-disable-next-line no-magic-numbers
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    if (supabase === null) {
      setError('Supabase가 초기화되지 않았습니다.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (signUpError !== null) {
        setError(signUpError.message);
      } else if (data.user !== null) {
        setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        // eslint-disable-next-line no-magic-numbers
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleSubmit = mode === 'login' ? handleEmailSignIn : handleEmailSignUp;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background image from provided blueprint */}
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
            className="absolute inset-0 bg-center bg-cover bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url(${bgUrl})` }}
          />
        );
      })()}

      {/* Color overlay and vignette inspired by the HTML template */}
      <div aria-hidden className="absolute inset-0 bg-[#0b2a53]/70 mix-blend-multiply" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-blue-900/40" />
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-300/30 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
              <LockClosedIcon className="w-7 h-7" />
            </div>
            <h1 className="font-sans font-bold text-3xl text-gray-900 mb-1 tracking-wide">건축 관리 시스템</h1>
            <p className="text-gray-600">{mode === 'login' ? '로그인하여 시작하세요' : '새 계정을 만드세요'}</p>
          </div>

          {/* 탭 전환 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <LockClosedIcon className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={mode === 'signup' ? '비밀번호 (최소 6자)' : '비밀번호를 입력하세요'}
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
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (mode === 'login' ? '로그인 중...' : '가입 중...') : (mode === 'login' ? '로그인' : '회원가입')}
            </button>
          </form>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>건축 관리 시스템 v2.0</p>
            <p>© 2025 Architecture Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
