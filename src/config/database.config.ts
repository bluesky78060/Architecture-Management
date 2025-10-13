/**
 * 데이터베이스 설정 관리
 *
 * 환경 변수를 기반으로 데이터베이스 설정을 관리합니다.
 * SQLite (로컬) 또는 Cloud SQL (클라우드) 백엔드를 선택할 수 있습니다.
 */

import { CloudSqlConfig } from '../services/cloudSql';

export type DatabaseBackend = 'sqlite' | 'cloud';

export interface DatabaseConfig {
  backend: DatabaseBackend;
  sqlite?: {
    path?: string;
  };
  cloud?: CloudSqlConfig;
}

/**
 * 환경 변수에서 데이터베이스 설정 로드
 */
export function loadDatabaseConfig(): DatabaseConfig {
  // 백엔드 타입 결정
  const backend = (process.env.DATABASE_BACKEND || 'sqlite') as DatabaseBackend;

  const config: DatabaseConfig = {
    backend,
  };

  if (backend === 'sqlite') {
    // SQLite 설정 (기본값)
    config.sqlite = {
      path: process.env.SQLITE_PATH,
    };
  } else if (backend === 'cloud') {
    // Cloud SQL 설정
    const instanceConnectionName = process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME;
    const database = process.env.CLOUD_SQL_DATABASE;
    const user = process.env.CLOUD_SQL_USER;
    const password = process.env.CLOUD_SQL_PASSWORD;

    if (!instanceConnectionName || !database || !user) {
      throw new Error(
        'Cloud SQL configuration incomplete. Required: CLOUD_SQL_INSTANCE_CONNECTION_NAME, CLOUD_SQL_DATABASE, CLOUD_SQL_USER'
      );
    }

    config.cloud = {
      instanceConnectionName,
      database,
      user,
      password,
      authType: process.env.CLOUD_SQL_AUTH_TYPE as any,
      ipType: (process.env.CLOUD_SQL_IP_TYPE as 'PUBLIC' | 'PRIVATE' | 'PSC') || 'PUBLIC',
    };
  }

  return config;
}

/**
 * 설정 검증
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (config.backend === 'cloud') {
    if (!config.cloud) {
      throw new Error('Cloud SQL configuration is missing');
    }

    const { instanceConnectionName, database, user, authType } = config.cloud;

    // 인스턴스 연결 이름 형식 확인
    const connectionNameParts = instanceConnectionName.split(':');
    if (connectionNameParts.length !== 3) {
      throw new Error(
        'Invalid instance connection name format. Expected: project:region:instance'
      );
    }

    // 비밀번호 인증인 경우 비밀번호 확인
    if (authType === 'PASSWORD' && !config.cloud.password) {
      throw new Error('Password is required for PASSWORD authentication');
    }

    console.log('✅ Cloud SQL configuration validated');
    console.log(`   Instance: ${instanceConnectionName}`);
    console.log(`   Database: ${database}`);
    console.log(`   User: ${user}`);
    console.log(`   Auth: ${authType}`);
    console.log(`   IP Type: ${config.cloud.ipType}`);
  } else {
    console.log('✅ SQLite configuration validated');
  }
}

/**
 * 현재 데이터베이스 백엔드 확인
 */
export function getCurrentBackend(): DatabaseBackend {
  return (process.env.DATABASE_BACKEND || 'sqlite') as DatabaseBackend;
}

/**
 * Cloud SQL 사용 여부 확인
 */
export function isCloudSqlEnabled(): boolean {
  return getCurrentBackend() === 'cloud';
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
  } else if (config.backend === 'cloud' && config.cloud) {
    console.log('  Instance:', config.cloud.instanceConnectionName);
    console.log('  Database:', config.cloud.database);
    console.log('  User:', config.cloud.user);
    console.log('  Auth Type:', config.cloud.authType);
    console.log('  IP Type:', config.cloud.ipType);
    console.log('  Password:', config.cloud.password ? '********' : 'not set');
  }
  console.log('');
}

// 기본 내보내기
export default {
  loadDatabaseConfig,
  validateDatabaseConfig,
  getCurrentBackend,
  isCloudSqlEnabled,
  isSqliteEnabled,
  printDatabaseConfig,
};
