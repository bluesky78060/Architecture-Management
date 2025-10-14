import { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import migrationService from '../services/migration';

interface MigrationStats {
  indexeddb: {
    clients: number;
    estimates: number;
    invoices: number;
    workItems: number;
  };
  sqlite: {
    clients: number;
    estimates: number;
    invoices: number;
    workItems: number;
  };
}

interface MigrationResult {
  success: boolean;
  clientsCount: number;
  estimatesCount: number;
  invoicesCount: number;
  workItemsCount: number;
  companyInfoMigrated: boolean;
  errors: string[];
  duration: number;
}

export default function Migration() {
  const [isElectron, setIsElectron] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'validating' | 'migrating' | 'completed' | 'error'>('idle');
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [backupCreated, setBackupCreated] = useState(false);

  useEffect(() => {
    // Electron 환경 확인
    const electron = window.cms !== undefined && window.cms !== null;
    setIsElectron(electron);

    // 통계 로드
    if (electron) {
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    try {
      const migrationStats = await migrationService.getMigrationStats();
      setStats(migrationStats);
    } catch (error) {
      console.error('Failed to load migration stats:', error);
    }
  };

  const handleValidation = async () => {
    setMigrationStatus('validating');
    try {
      const result = await migrationService.validateData();
      setValidationIssues(result.issues);

      if (result.valid) {
        setMigrationStatus('idle');
        alert('✅ 데이터 검증 완료! 마이그레이션을 진행할 수 있습니다.');
      } else {
        setMigrationStatus('error');
        alert('⚠️ 데이터 검증에서 문제가 발견되었습니다. 문제를 해결한 후 다시 시도해주세요.');
      }
    } catch (error: any) {
      setMigrationStatus('error');
      alert(`❌ 검증 중 오류 발생: ${error.message}`);
    }
  };

  const handleBackup = async () => {
    try {
      const backupFileName = await migrationService.createIndexedDBBackup();
      setBackupCreated(true);
      alert(`✅ 백업 생성 완료: ${backupFileName}\n백업은 localStorage에 저장되었습니다.`);
    } catch (error: any) {
      alert(`❌ 백업 생성 실패: ${error.message}`);
    }
  };

  const handleMigration = async () => {
    if (!backupCreated) {
      const confirmed = window.confirm(
        '⚠️ 백업을 생성하지 않았습니다.\n백업 없이 마이그레이션을 진행하시겠습니까?'
      );
      if (!confirmed) return;
    }

    const confirmed = window.confirm(
      '🔄 데이터 마이그레이션을 시작합니다.\n\n' +
      '- IndexedDB의 모든 데이터가 SQLite로 복사됩니다\n' +
      '- 기존 IndexedDB 데이터는 유지됩니다\n' +
      '- 마이그레이션 중에는 앱을 종료하지 마세요\n\n' +
      '계속 진행하시겠습니까?'
    );

    if (!confirmed) return;

    setMigrationStatus('migrating');

    try {
      const result = await migrationService.migrateToSQLite();
      setMigrationResult(result);

      if (result.success) {
        setMigrationStatus('completed');
        await loadStats(); // 통계 갱신
      } else {
        setMigrationStatus('error');
      }
    } catch (error: any) {
      setMigrationStatus('error');
      setMigrationResult({
        success: false,
        clientsCount: 0,
        estimatesCount: 0,
        invoicesCount: 0,
        workItemsCount: 0,
        companyInfoMigrated: false,
        errors: [error.message],
        duration: 0
      });
    }
  };

  if (!isElectron) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                데이터 마이그레이션은 Electron 앱에서만 사용 가능합니다
              </h3>
              <p className="text-yellow-800">
                웹 버전에서는 SQLite 마이그레이션을 사용할 수 없습니다.
                데스크톱 앱을 사용해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">데이터 마이그레이션</h1>
        <p className="mt-2 text-sm text-gray-600">
          IndexedDB에서 SQLite로 데이터를 마이그레이션합니다
        </p>
      </div>

      {/* 현재 상태 */}
      {stats && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 데이터 현황</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* IndexedDB */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">IndexedDB (현재)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">건축주</span>
                  <span className="font-semibold">{stats.indexeddb.clients}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">견적서</span>
                  <span className="font-semibold">{stats.indexeddb.estimates}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">청구서</span>
                  <span className="font-semibold">{stats.indexeddb.invoices}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">작업항목</span>
                  <span className="font-semibold">{stats.indexeddb.workItems}개</span>
                </div>
              </div>
            </div>

            {/* SQLite */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">SQLite (새 데이터베이스)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">건축주</span>
                  <span className="font-semibold">{stats.sqlite.clients}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">견적서</span>
                  <span className="font-semibold">{stats.sqlite.estimates}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">청구서</span>
                  <span className="font-semibold">{stats.sqlite.invoices}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">작업항목</span>
                  <span className="font-semibold">{stats.sqlite.workItems}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 마이그레이션 단계 */}
      {migrationStatus === 'idle' && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">마이그레이션 절차</h3>

          {/* 1단계: 데이터 검증 */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">데이터 검증</h4>
              <p className="text-sm text-gray-600 mb-3">
                마이그레이션 전 데이터 무결성을 확인합니다
              </p>
              <button
                onClick={handleValidation}
                className="btn-secondary flex items-center gap-2"
                disabled={migrationStatus !== 'idle' && migrationStatus !== 'error'}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                데이터 검증
              </button>
              {validationIssues.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 mb-2">발견된 문제:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validationIssues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 2단계: 백업 생성 */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">백업 생성 (선택사항)</h4>
              <p className="text-sm text-gray-600 mb-3">
                안전을 위해 현재 데이터를 백업합니다
              </p>
              <button
                onClick={handleBackup}
                className="btn-secondary flex items-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4" />
                백업 생성
              </button>
              {backupCreated && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>백업이 생성되었습니다</span>
                </div>
              )}
            </div>
          </div>

          {/* 3단계: 마이그레이션 실행 */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">마이그레이션 실행</h4>
              <p className="text-sm text-gray-600 mb-3">
                IndexedDB 데이터를 SQLite로 복사합니다
              </p>
              <button
                onClick={handleMigration}
                className="btn-primary flex items-center gap-2"
                disabled={validationIssues.length > 0}
              >
                <ArrowPathIcon className="w-4 h-4" />
                마이그레이션 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 마이그레이션 진행 중 */}
      {migrationStatus === 'migrating' && (
        <div className="card">
          <div className="flex items-center gap-4">
            <ClockIcon className="w-8 h-8 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">마이그레이션 진행 중...</h3>
              <p className="text-sm text-gray-600 mt-1">
                잠시만 기다려주세요. 데이터를 이전하는 중입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 마이그레이션 완료 */}
      {migrationStatus === 'completed' && migrationResult && (
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-start gap-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                마이그레이션 완료!
              </h3>
              <div className="space-y-2 text-sm text-green-800">
                <p>✅ 건축주: {migrationResult.clientsCount}개</p>
                <p>✅ 견적서: {migrationResult.estimatesCount}개</p>
                <p>✅ 청구서: {migrationResult.invoicesCount}개</p>
                <p>✅ 작업항목: {migrationResult.workItemsCount}개</p>
                <p>✅ 회사정보: {migrationResult.companyInfoMigrated ? '완료' : '없음'}</p>
                <p className="mt-3 text-xs">
                  소요 시간: {(migrationResult.duration / 1000).toFixed(2)}초
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn-primary"
              >
                앱 새로고침
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 마이그레이션 오류 */}
      {migrationStatus === 'error' && migrationResult && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                마이그레이션 중 오류 발생
              </h3>
              <div className="space-y-2 text-sm text-red-800 mb-4">
                {migrationResult.clientsCount > 0 && (
                  <p>✅ 건축주: {migrationResult.clientsCount}개 (부분 완료)</p>
                )}
                {migrationResult.estimatesCount > 0 && (
                  <p>✅ 견적서: {migrationResult.estimatesCount}개 (부분 완료)</p>
                )}
                {migrationResult.invoicesCount > 0 && (
                  <p>✅ 청구서: {migrationResult.invoicesCount}개 (부분 완료)</p>
                )}
                {migrationResult.workItemsCount > 0 && (
                  <p>✅ 작업항목: {migrationResult.workItemsCount}개 (부분 완료)</p>
                )}
              </div>
              {migrationResult.errors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-red-900 mb-2">오류 목록:</p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {migrationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => {
                  setMigrationStatus('idle');
                  setMigrationResult(null);
                }}
                className="btn-secondary"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주의사항 */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">⚠️ 주의사항</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 마이그레이션은 한 번만 실행하면 됩니다</li>
          <li>• 기존 IndexedDB 데이터는 삭제되지 않습니다</li>
          <li>• SQLite에 이미 데이터가 있으면 중복될 수 있습니다</li>
          <li>• 마이그레이션 중에는 앱을 종료하지 마세요</li>
        </ul>
      </div>
    </div>
  );
}
