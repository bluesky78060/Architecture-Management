import React, { useState, useEffect, useCallback } from 'react';
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

interface UserInfo {
  email: string;
  name: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({ email: '', name: '' });
  const [loading, setLoading] = useState(true);

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

  const loadUserInfo = useCallback(async () => {
    if (supabase === null) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error !== null) {
        console.error('사용자 정보 로딩 실패:', error);
        setLoading(false);
        return;
      }

      if (user !== null) {
        setUserInfo({
          email: user.email ?? '',
          name: user.user_metadata?.name ?? ''
        });
        setNewName(user.user_metadata?.name ?? '');
        setNewEmail(user.email ?? '');
      }
    } catch (err) {
      console.error('사용자 정보 로딩 중 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase === null) return;

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

      if (error !== null) {
        setNameError(error.message);
      } else {
        setNameSuccess('이름이 성공적으로 변경되었습니다.');
        setUserInfo(prev => ({ ...prev, name: newName }));
      }
    } catch (err) {
      setNameError('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase === null) return;

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');

    if (newEmail.trim() === '' || !newEmail.includes('@')) {
      setEmailError('유효한 이메일을 입력해주세요.');
      setEmailLoading(false);
      return;
    }

    if (newEmail === userInfo.email) {
      setEmailError('현재 이메일과 동일합니다.');
      setEmailLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error !== null) {
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
    if (supabase === null) return;

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

      if (error !== null) {
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
    if (supabase === null) return;

    if (!window.confirm('로그아웃 하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error !== null) {
        alert('로그아웃 실패: ' + error.message);
      } else {
        navigate('/login');
      }
    } catch (err) {
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="mt-2 text-gray-600">계정 정보를 관리하세요</p>
      </div>

      {/* 현재 사용자 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600" />
          현재 로그인 정보
        </h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-24">이름:</span>
            <span className="text-gray-900">{userInfo.name || '(없음)'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-24">이메일:</span>
            <span className="text-gray-900">{userInfo.email}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 이름 변경 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600" />
            이름 변경
          </h2>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-2">
                새 이름
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="새 이름을 입력하세요"
              />
            </div>

            {nameError !== '' && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{nameError}</p>
              </div>
            )}

            {nameSuccess !== '' && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-700 text-sm">{nameSuccess}</p>
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

        {/* 이메일 변경 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <EnvelopeIcon className="w-6 h-6 mr-2 text-blue-600" />
            이메일 변경
          </h2>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                새 이메일
              </label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="새 이메일을 입력하세요"
              />
            </div>

            {emailError !== '' && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{emailError}</p>
              </div>
            )}

            {emailSuccess !== '' && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-700 text-sm">{emailSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {emailLoading ? '변경 중...' : '이메일 변경'}
            </button>
            <p className="text-xs text-gray-500">
              * 이메일 변경 시 새 이메일로 확인 메일이 발송됩니다.
            </p>
          </form>
        </div>

        {/* 비밀번호 변경 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <LockClosedIcon className="w-6 h-6 mr-2 text-blue-600" />
            비밀번호 변경
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="새 비밀번호 (최소 6자)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="새 비밀번호 확인"
              />
            </div>

            {passwordError !== '' && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess !== '' && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-700 text-sm">{passwordSuccess}</p>
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

        {/* 로그아웃 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ArrowRightOnRectangleIcon className="w-6 h-6 mr-2 text-red-600" />
            로그아웃
          </h2>
          <p className="text-gray-600 mb-4">모든 기기에서 로그아웃됩니다.</p>
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
