import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { supabase } from '../services/supabase';
import { useUser } from '../contexts/UserContext';

type AuthMode = 'login' | 'signup';

interface SocialProvider {
  name: string;
  action: () => Promise<void>;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useUser();

  // 로그인 상태가 되면 자동으로 대시보드로 이동
  /* eslint-disable no-console */
  useEffect(() => {
    console.log('🟢 [Login] isLoggedIn changed:', isLoggedIn);
    if (isLoggedIn) {
      console.log('🟢 [Login] Redirecting to dashboard');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);
  /* eslint-enable no-console */

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

  const loginWithGoogle = async (): Promise<void> => {
    if (supabase === null) {
      setError('Supabase가 초기화되지 않았습니다.');
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (signInError !== null) {
        setError('Google 로그인 중 오류가 발생했습니다.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google 로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    }
  };

  const loginWithKakao = async (): Promise<void> => {
    /* eslint-disable no-console */
    console.log('🟡 [Kakao] Login button clicked');
    /* eslint-enable no-console */

    if (supabase === null) {
      setError('Supabase가 초기화되지 않았습니다.');
      return;
    }

    try {
      /* eslint-disable no-console */
      console.log('🟡 [Kakao] Calling signInWithOAuth...');
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      console.log('🟡 [Kakao] signInWithOAuth response:', { data, error: signInError });
      /* eslint-enable no-console */

      if (signInError !== null) {
        /* eslint-disable no-console */
        console.error('❌ [Kakao] signInError:', signInError);
        /* eslint-enable no-console */
        setError(`Kakao 로그인 중 오류가 발생했습니다: ${signInError.message}`);
      }
    } catch (err: unknown) {
      /* eslint-disable no-console */
      console.error('❌ [Kakao] Exception:', err);
      /* eslint-enable no-console */
      const errorMessage = err instanceof Error ? err.message : 'Kakao 로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    }
  };

  // Naver 로그인 - Supabase 미지원으로 주석 처리 (추후 구현 시 활성화)
  // const loginWithNaver = async (): Promise<void> => {
  //   const naverClientId = process.env.REACT_APP_NAVER_CLIENT_ID;
  //
  //   if (typeof naverClientId !== 'string' || naverClientId.trim() === '') {
  //     setError('Naver 로그인 설정이 필요합니다. 환경 변수 REACT_APP_NAVER_CLIENT_ID를 설정해주세요.');
  //     return;
  //   }
  //
  //   // Naver OAuth 2.0 플로우
  //   const callbackUrl = `${window.location.origin}/auth/naver/callback`;
  //   // eslint-disable-next-line no-magic-numbers
  //   const RANDOM_BASE = 36;
  //   // eslint-disable-next-line no-magic-numbers
  //   const RANDOM_START = 2;
  //   // eslint-disable-next-line no-magic-numbers
  //   const RANDOM_END = 15;
  //   const state = Math.random().toString(RANDOM_BASE).substring(RANDOM_START, RANDOM_END);
  //
  //   // state를 localStorage에 저장하여 콜백에서 검증
  //   localStorage.setItem('naver_oauth_state', state);
  //
  //   const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;
  //
  //   // 팝업 또는 리다이렉트로 Naver 로그인
  //   // eslint-disable-next-line no-magic-numbers
  //   const POPUP_WIDTH = 500;
  //   // eslint-disable-next-line no-magic-numbers
  //   const POPUP_HEIGHT = 600;
  //   // eslint-disable-next-line no-magic-numbers
  //   const HALF_DIVISOR = 2;
  //   const left = window.screen.width / HALF_DIVISOR - POPUP_WIDTH / HALF_DIVISOR;
  //   const top = window.screen.height / HALF_DIVISOR - POPUP_HEIGHT / HALF_DIVISOR;
  //
  //   window.open(
  //     naverAuthUrl,
  //     'naverLogin',
  //     `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
  //   );
  //
  //   setError('Naver 로그인 팝업을 확인해주세요. 콜백 처리를 위한 백엔드 설정이 필요합니다.');
  // };

  const socialProviders: SocialProvider[] = [
    {
      name: 'Google',
      action: loginWithGoogle,
      bgColor: 'bg-white',
      hoverColor: 'hover:bg-red-500',
      textColor: 'text-red-500 hover:text-white',
      borderColor: 'border-red-500',
      icon: (
        <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      name: 'Kakao',
      action: loginWithKakao,
      bgColor: 'bg-yellow-400',
      hoverColor: 'hover:bg-yellow-500',
      textColor: 'text-gray-800',
      borderColor: 'border-yellow-400',
      icon: (
        <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 3C6.48 3 2 6.48 2 11c0 2.76 1.66 5.23 4.24 6.63l-.91 3.35c-.08.3.26.54.52.37l4.07-2.68c.69.09 1.4.14 2.08.14 5.52 0 10-3.48 10-8S17.52 3 12 3z"/>
        </svg>
      ),
    },
    // Naver 로그인 - Supabase 미지원으로 주석 처리 (추후 구현 시 활성화)
    // {
    //   name: 'Naver',
    //   action: loginWithNaver,
    //   bgColor: 'bg-green-500',
    //   hoverColor: 'hover:bg-green-600',
    //   textColor: 'text-white',
    //   borderColor: 'border-green-500',
    //   icon: (
    //     <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24">
    //       <path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
    //     </svg>
    //   ),
    // },
  ];

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
            className="absolute inset-0 bg-center bg-cover bg-no-repeat bg-fixed blur-[2px]"
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
        <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-7">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg mb-2">
              <LockClosedIcon className="w-6 h-6" />
            </div>
            <h1 className="font-sans font-bold text-2xl text-gray-900 mb-1 tracking-wide">건축 관리 시스템</h1>
            <p className="text-gray-600 text-sm">{mode === 'login' ? '로그인하여 시작하세요' : '새 계정을 만드세요'}</p>
          </div>

          {/* 소셜 로그인 (로그인 모드일 때만 표시) */}
          {mode === 'login' && (
            <div className="mb-5">
              <p className="text-center text-gray-600 text-sm font-medium mb-3">
                간편 로그인
              </p>
              <div className="flex flex-col gap-2.5 mb-4">
                {socialProviders.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={provider.action}
                    className={`
                      flex items-center justify-center px-4 py-2.5 border-2
                      ${provider.bgColor} ${provider.borderColor} ${provider.textColor}
                      ${provider.hoverColor} rounded-lg font-medium text-sm
                      transition-all duration-300 ease-in-out
                      hover:-translate-y-0.5 hover:shadow-lg
                      relative overflow-hidden group
                    `}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500" />
                    {provider.icon}
                    {provider.name}
                  </button>
                ))}
              </div>

              {/* 구분선 */}
              <div className="relative flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-xs text-gray-500 font-medium">또는</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className="
                      w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                      bg-gray-50 transition-all duration-300 ease-in-out
                      focus:outline-none focus:border-blue-500 focus:bg-white
                      focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:-translate-y-0.5
                      placeholder-gray-400
                    "
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>
            )}

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="
                    w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                    bg-gray-50 transition-all duration-300 ease-in-out
                    focus:outline-none focus:border-blue-500 focus:bg-white
                    focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:-translate-y-0.5
                    placeholder-gray-400
                  "
                  placeholder={mode === 'signup' ? '비밀번호 (최소 6자)' : '비밀번호를 입력하세요'}
                />
              </div>
            </div>

            {/* Remember Me와 비밀번호 찾기 (로그인 모드일 때만 표시) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  비밀번호 찾기
                </button>
              </div>
            )}

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
              {loading ? (mode === 'login' ? '로그인 중...' : '가입 중...') : (mode === 'login' ? '로그인' : '회원가입')}
            </button>
          </form>

          {/* 회원가입/로그인 전환 링크 */}
          <div className="text-center text-sm text-gray-600 mt-5">
            {mode === 'login' ? (
              <>
                아직 계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors underline"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors underline"
                >
                  로그인
                </button>
              </>
            )}
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

export default Login;
