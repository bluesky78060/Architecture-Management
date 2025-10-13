/**
 * 데이터베이스 설정 관리
 *
 * 환경 변수를 기반으로 데이터베이스 설정을 관리합니다.
 * SQLite (로컬), Cloud SQL (클라우드), Supabase (클라우드) 백엔드를 선택할 수 있습니다.
 */

import { SupabaseConfig } from '../services/supabase';

export type DatabaseBackend = 'sqlite' | 'supabase';

export interface DatabaseConfig {
  backend: DatabaseBackend;
  sqlite?: {
    path?: string;
  };
  supabase?: SupabaseConfig;
}

/**
 * 환경 변수에서 데이터베이스 설정 로드
 */
export function loadDatabaseConfig(): DatabaseConfig {
  // 백엔드 타입 결정 (React 앱 환경 변수 또는 Node.js 환경 변수)
  const backend = (
    process.env.REACT_APP_DATABASE_BACKEND ||
    process.env.DATABASE_BACKEND ||
    'sqlite'
  ) as DatabaseBackend;

  const config: DatabaseConfig = {
    backend,
  };

  if (backend === 'sqlite') {
    // SQLite 설정 (기본값)
    config.sqlite = {
      path: process.env.SQLITE_PATH,
    };
  } else if (backend === 'supabase') {
    // Supabase 설정 (React 앱 환경 변수 우선)
    const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      throw new Error(
        'Supabase configuration incomplete. Required: SUPABASE_URL, SUPABASE_ANON_KEY'
      );
    }

    config.supabase = {
      url,
      anonKey,
      serviceRoleKey,
    };
  }

  return config;
}

/**
 * 설정 검증
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (config.backend === 'supabase') {
    if (!config.supabase) {
      throw new Error('Supabase configuration is missing');
    }

    const { url, anonKey } = config.supabase;

    // URL 형식 확인
    if (!url.startsWith('https://')) {
      throw new Error('Invalid Supabase URL format. Expected: https://xxx.supabase.co');
    }

    console.log('✅ Supabase configuration validated');
    console.log(`   URL: ${url}`);
    console.log(`   Anon Key: ${anonKey.substring(0, 20)}...`);
  } else {
    console.log('✅ SQLite configuration validated');
  }
}

/**
 * 현재 데이터베이스 백엔드 확인
 */
export function getCurrentBackend(): DatabaseBackend {
  return (
    process.env.REACT_APP_DATABASE_BACKEND ||
    process.env.DATABASE_BACKEND ||
    'sqlite'
  ) as DatabaseBackend;
}

/**
 * Supabase 사용 여부 확인
 */
export function isSupabaseEnabled(): boolean {
  return getCurrentBackend() === 'supabase';
}

/**
 * SQLite 사용 여부 확인
 */
export function isSqliteEnabled(): boolean {
  return getCurrentBackend() === 'sqlite';
}

/**
 * 데이터베이스 설정 출력 (민감한 정보 제외)
 */
export function printDatabaseConfig(config: DatabaseConfig): void {
  console.log('\n📊 Database Configuration:');
  console.log('  Backend:', config.backend);

  if (config.backend === 'sqlite') {
    console.log('  Path:', config.sqlite?.path || 'default (userData/cms.db)');
  } else if (config.backend === 'supabase' && config.supabase) {
    console.log('  URL:', config.supabase.url);
    console.log('  Anon Key:', config.supabase.anonKey.substring(0, 20) + '...');
    console.log('  Service Role Key:', config.supabase.serviceRoleKey ? '********' : 'not set');
  }
  console.log('');
}

// 기본 내보내기
export default {
  loadDatabaseConfig,
  validateDatabaseConfig,
  getCurrentBackend,
  isSupabaseEnabled,
  isSqliteEnabled,
  printDatabaseConfig,
};
