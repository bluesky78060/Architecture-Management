/* eslint-disable */
import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  authenticateGoogleCalendar,
  signOutGoogleCalendar,
  isGoogleCalendarAuthenticated,
  syncWithGoogleCalendar,
} from '../../services/googleCalendarService';

interface Props {
  onClose: () => void;
}

export default function GoogleCalendarSync({ onClose }: Props) {
  const { schedules, saveSchedule } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(isGoogleCalendarAuthenticated());
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    imported: number;
    exported: number;
    failed: number;
  } | null>(null);

  const [options, setOptions] = useState({
    importFromGoogle: true,
    exportToGoogle: true,
    startDate: '',
    endDate: '',
  });

  const handleAuthenticate = async () => {
    try {
      const success = await authenticateGoogleCalendar();
      if (success) {
        setIsAuthenticated(true);
        alert('Google 계정 연결 완료!');
      } else {
        alert('Google 계정 연결 실패');
      }
    } catch (error) {
      console.error('인증 실패:', error);
      alert('인증 중 오류가 발생했습니다.');
    }
  };

  const handleSignOut = () => {
    signOutGoogleCalendar();
    setIsAuthenticated(false);
    alert('Google Calendar 연결이 해제되었습니다.');
  };

  const handleSync = async () => {
    if (!isAuthenticated) {
      alert('먼저 Google 계정을 연결해주세요.');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncWithGoogleCalendar(schedules, options);

      // 가져온 일정들을 로컬에 저장
      if (result.imported.length > 0) {
        for (const schedule of result.imported) {
          await saveSchedule(schedule);
        }
      }

      setSyncResult({
        imported: result.imported.length,
        exported: result.exported.success,
        failed: result.exported.failed,
      });

      alert(`동기화 완료!\n가져오기: ${result.imported.length}개\n내보내기: ${result.exported.success}개\n실패: ${result.exported.failed}개`);
    } catch (error: any) {
      console.error('동기화 실패:', error);
      alert(`동기화 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📅 Google Calendar 동기화
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 인증 상태 */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  연결 상태
                </p>
                <p className={`text-sm ${isAuthenticated ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {isAuthenticated ? '✅ 연결됨' : '❌ 연결 안됨'}
                </p>
              </div>
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  연결 해제
                </button>
              ) : (
                <button
                  onClick={handleAuthenticate}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Google 연결
                </button>
              )}
            </div>
          </div>

          {/* 동기화 옵션 */}
          {isAuthenticated && (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  동기화 옵션
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.importFromGoogle}
                    onChange={(e) => setOptions({ ...options, importFromGoogle: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Google Calendar → 이 앱으로 가져오기
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.exportToGoogle}
                    onChange={(e) => setOptions({ ...options, exportToGoogle: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    이 앱 → Google Calendar로 내보내기
                  </span>
                </label>
              </div>

              {/* 날짜 범위 (가져오기용) */}
              {options.importFromGoogle && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    가져올 날짜 범위 (선택사항)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        시작일
                      </label>
                      <input
                        type="date"
                        value={options.startDate}
                        onChange={(e) => setOptions({ ...options, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        종료일
                      </label>
                      <input
                        type="date"
                        value={options.endDate}
                        onChange={(e) => setOptions({ ...options, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    * 날짜를 지정하지 않으면 오늘부터 최대 100개의 일정을 가져옵니다.
                  </p>
                </div>
              )}

              {/* 동기화 결과 */}
              {syncResult && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                    ✅ 동기화 완료
                  </p>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• 가져온 일정: {syncResult.imported}개</li>
                    <li>• 내보낸 일정: {syncResult.exported}개</li>
                    {syncResult.failed > 0 && (
                      <li className="text-red-600 dark:text-red-400">• 실패: {syncResult.failed}개</li>
                    )}
                  </ul>
                </div>
              )}

              {/* 주의사항 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                  ⚠️ 주의사항
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• 중복 일정이 생성될 수 있습니다.</li>
                  <li>• 내보내기는 모든 일정을 Google Calendar에 새로 생성합니다.</li>
                  <li>• 가져오기는 지정된 날짜 범위의 일정만 가져옵니다.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            닫기
          </button>
          {isAuthenticated && (
            <button
              onClick={handleSync}
              disabled={syncing || (!options.importFromGoogle && !options.exportToGoogle)}
              className={`px-4 py-2 rounded-lg ${
                syncing || (!options.importFromGoogle && !options.exportToGoogle)
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {syncing ? '동기화 중...' : '동기화 시작'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
