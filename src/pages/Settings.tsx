import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../services/supabase';
import { useUser } from '../contexts/UserContext';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useUser();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [provider, setProvider] = useState<'email' | 'google' | 'kakao' | null>(null);

  // 이름 변경
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // 이메일 변경
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // 비밀번호 변경
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      if (currentUser !== null && currentUser !== undefined) {
        setUserEmail((currentUser.username !== null && currentUser.username !== undefined) ? currentUser.username : '');
        setUserName((currentUser.name !== null && currentUser.name !== undefined) ? currentUser.name : '');
        setNewName((currentUser.name !== null && currentUser.name !== undefined) ? currentUser.name : '');
        setNewEmail((currentUser.username !== null && currentUser.username !== undefined) ? currentUser.username : '');
      }

      // Supabase에서 provider 정보 가져오기
      if (supabase !== null) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user !== null && user !== undefined) {
            const providerValue = user.app_metadata?.provider;
            const userProvider = (providerValue !== null && providerValue !== undefined && providerValue !== '')
              ? providerValue
              : 'email';
            setProvider(userProvider as 'email' | 'google' | 'kakao');
          }
        } catch (err) {
          // 에러 시 기본값 email
          setProvider('email');
        }
      }
    };

    void loadUserInfo();
  }, [currentUser]);

  // 로그인 방식 표시 이름
  const getProviderName = (prov: 'email' | 'google' | 'kakao' | null): string => {
    if (prov === 'google') return 'Google 로그인';
    if (prov === 'kakao') return 'Kakao 로그인';
    if (prov === 'email') return '이메일 로그인';
    return '알 수 없음';
  };

  // SNS 로그인 여부
  const isSocialLogin = provider === 'google' || provider === 'kakao';

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase === null || supabase === undefined) return;

    setNameLoading(true);
    setNameError('');
    setNameSuccess('');

    if (newName.trim() === '') {
      setNameError('이름을 입력해주세요.');
      setNameLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: newName }
      });

      if (error !== null && error !== undefined) {
        setNameError(error.message);
      } else {
        setNameSuccess('이름이 성공적으로 변경되었습니다.');
        setUserName(newName);
      }
    } catch (err) {
      setNameError('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase === null || supabase === undefined) return;

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');

    if (newEmail.trim() === '' || !newEmail.includes('@')) {
      setEmailError('유효한 이메일을 입력해주세요.');
      setEmailLoading(false);
      return;
    }

    if (newEmail === userEmail) {
      setEmailError('현재 이메일과 동일합니다.');
      setEmailLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error !== null && error !== undefined) {
        setEmailError(error.message);
      } else {
        setEmailSuccess('이메일 변경 확인 메일이 발송되었습니다. 새 이메일에서 확인해주세요.');
      }
    } catch (err) {
      setEmailError('이메일 변경 중 오류가 발생했습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase === null || supabase === undefined) return;

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // eslint-disable-next-line no-magic-numbers
    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error !== null && error !== undefined) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) {
      return;
    }
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">설정</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">계정 정보를 관리하세요</p>
      </div>

      {/* 현재 사용자 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
          현재 로그인 정보
        </h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">로그인 방식:</span>
            <span className="text-gray-900 dark:text-gray-100">{getProviderName(provider)}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">이름:</span>
            <span className="text-gray-900 dark:text-gray-100">{(userName !== '' && userName !== null) ? userName : '(없음)'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">이메일:</span>
            <span className="text-gray-900 dark:text-gray-100">{userEmail}</span>
          </div>
          {isSocialLogin && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                SNS 로그인 사용자는 {getProviderName(provider)} 계정에서 정보를 관리합니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* 이름 변경 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            이름 변경
          </h2>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label htmlFor="newName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 이름
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="새 이름을 입력하세요"
              />
            </div>

            {nameError !== '' && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-red-700 dark:text-red-300 text-sm">{nameError}</p>
              </div>
            )}

            {nameSuccess !== '' && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-green-700 dark:text-green-300 text-sm">{nameSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={nameLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {nameLoading ? '변경 중...' : '이름 변경'}
            </button>
          </form>
        </div>

        {/* 이메일 변경 - 이메일 로그인 사용자만 */}
        {!isSocialLogin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <EnvelopeIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              이메일 변경
            </h2>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 이메일
              </label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="새 이메일을 입력하세요"
              />
            </div>

            {emailError !== '' && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-red-700 dark:text-red-300 text-sm">{emailError}</p>
              </div>
            )}

            {emailSuccess !== '' && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-green-700 dark:text-green-300 text-sm">{emailSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {emailLoading ? '변경 중...' : '이메일 변경'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              * 이메일 변경 시 새 이메일로 확인 메일이 발송됩니다.
            </p>
          </form>
        </div>
        )}

        {/* 비밀번호 변경 - 이메일 로그인 사용자만 */}
        {!isSocialLogin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <LockClosedIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              비밀번호 변경
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="새 비밀번호 (최소 6자)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="새 비밀번호 확인"
              />
            </div>

            {passwordError !== '' && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-red-700 dark:text-red-300 text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess !== '' && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-green-700 dark:text-green-300 text-sm">{passwordSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
        )}

        {/* 로그아웃 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <ArrowRightOnRectangleIcon className="w-6 h-6 mr-2 text-red-600 dark:text-red-400" />
            로그아웃
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">모든 기기에서 로그아웃됩니다.</p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
