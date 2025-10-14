/**
 * Google Cloud SQL 연결 테스트 스크립트
 *
 * Cloud SQL 연결을 테스트하고 기본 CRUD 작업을 검증합니다.
 *
 * 사용법:
 *   node scripts/test-cloud-sql.js
 *
 * 환경 변수 (.env.cloud 파일 또는 직접 설정):
 *   CLOUD_SQL_INSTANCE_CONNECTION_NAME=project:region:instance
 *   CLOUD_SQL_DATABASE=construction_management
 *   CLOUD_SQL_USER=app_user
 *   CLOUD_SQL_PASSWORD=password
 */

require('dotenv').config({ path: '.env.cloud' });

const { Connector, IpAddressTypes } = require('@google-cloud/cloud-sql-connector');
const mysql = require('mysql2/promise');

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function success(message) {
  log('✅ ' + message, 'green');
}

function error(message) {
  log('❌ ' + message, 'red');
}

function info(message) {
  log('ℹ️  ' + message, 'cyan');
}

function section(message) {
  log('\n' + '='.repeat(60), 'blue');
  log(message, 'blue');
  log('='.repeat(60) + '\n', 'blue');
}

class CloudSqlTester {
  constructor() {
    this.connector = null;
    this.pool = null;
    this.config = {
      instanceConnectionName: process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME,
      database: process.env.CLOUD_SQL_DATABASE,
      user: process.env.CLOUD_SQL_USER,
      password: process.env.CLOUD_SQL_PASSWORD,
      authType: process.env.CLOUD_SQL_AUTH_TYPE || 'PASSWORD',
      ipType: process.env.CLOUD_SQL_IP_TYPE || 'PUBLIC',
    };
  }

  /**
   * 설정 검증
   */
  validateConfig() {
    section('Configuration Validation');

    const required = ['instanceConnectionName', 'database', 'user'];
    const missing = required.filter(key => !this.config[key]);

    if (missing.length > 0) {
      error(`Missing required configuration: ${missing.join(', ')}`);
      error('Please set the following environment variables:');
      missing.forEach(key => {
        console.log(`  - CLOUD_SQL_${key.toUpperCase()}`);
      });
      return false;
    }

    if (this.config.authType === 'PASSWORD' && !this.config.password) {
      error('Password is required for PASSWORD authentication');
      return false;
    }

    info('Instance: ' + this.config.instanceConnectionName);
    info('Database: ' + this.config.database);
    info('User: ' + this.config.user);
    info('Auth Type: ' + this.config.authType);
    info('IP Type: ' + this.config.ipType);
    info('Password: ' + (this.config.password ? '********' : 'not set'));

    success('Configuration validated');
    return true;
  }

  /**
   * 연결 테스트
   */
  async testConnection() {
    section('Connection Test');

    try {
      info('Creating connector...');
      this.connector = new Connector();

      info('Getting connection options...');
      const clientOpts = await this.connector.getOptions({
        instanceConnectionName: this.config.instanceConnectionName,
        ipType: this.config.ipType === 'PRIVATE' ? IpAddressTypes.PRIVATE : IpAddressTypes.PUBLIC,
        authType: this.config.authType,
      });

      info('Creating connection pool...');
      const poolConfig = {
        ...clientOpts,
        user: this.config.user,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 5,
      };

      if (this.config.authType === 'PASSWORD') {
        poolConfig.password = this.config.password;
      }

      this.pool = await mysql.createPool(poolConfig);

      info('Testing connection...');
      const conn = await this.pool.getConnection();
      const [result] = await conn.query('SELECT NOW() as now, DATABASE() as db, USER() as user');

      success('Connected successfully!');
      console.log('  Server Time:', result[0].now);
      console.log('  Database:', result[0].db);
      console.log('  User:', result[0].user);

      conn.release();
      return true;
    } catch (err) {
      error('Connection failed: ' + err.message);
      console.error(err);
      return false;
    }
  }

  /**
   * 테이블 확인
   */
  async checkTables() {
    section('Table Verification');

    try {
      const [tables] = await this.pool.query(`
        SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);

      if (tables.length === 0) {
        info('No tables found in database');
        return false;
      }

      success(`Found ${tables.length} tables:`);
      console.table(tables.map(t => ({
        Table: t.TABLE_NAME,
        Rows: t.TABLE_ROWS,
        'Data Size': `${(t.DATA_LENGTH / 1024).toFixed(2)} KB`,
        'Index Size': `${(t.INDEX_LENGTH / 1024).toFixed(2)} KB`,
      })));

      return true;
    } catch (err) {
      error('Table verification failed: ' + err.message);
      return false;
    }
  }

  /**
   * 스키마 생성 테스트
   */
  async testSchemaCreation() {
    section('Schema Creation Test');

    try {
      info('Creating test table...');
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      success('Test table created');

      info('Inserting test data...');
      const [insertResult] = await this.pool.query(
        'INSERT INTO test_table (name) VALUES (?)',
        ['Test Entry']
      );

      success(`Test data inserted (ID: ${insertResult.insertId})`);

      info('Querying test data...');
      const [rows] = await this.pool.query('SELECT * FROM test_table WHERE id = ?', [insertResult.insertId]);

      if (rows.length > 0) {
        success('Test data retrieved successfully');
        console.log('  Data:', rows[0]);
      }

      info('Cleaning up test table...');
      await this.pool.query('DROP TABLE IF EXISTS test_table');
      success('Test table dropped');

      return true;
    } catch (err) {
      error('Schema creation test failed: ' + err.message);
      return false;
    }
  }

  /**
   * 성능 테스트
   */
  async testPerformance() {
    section('Performance Test');

    try {
      const queries = [
        'SELECT 1',
        'SELECT NOW()',
        'SELECT DATABASE()',
        'SHOW TABLES',
      ];

      for (const query of queries) {
        const start = Date.now();
        await this.pool.query(query);
        const duration = Date.now() - start;

        if (duration < 100) {
          success(`"${query}" - ${duration}ms`);
        } else if (duration < 500) {
          info(`"${query}" - ${duration}ms`);
        } else {
          error(`"${query}" - ${duration}ms (slow!)`);
        }
      }

      return true;
    } catch (err) {
      error('Performance test failed: ' + err.message);
      return false;
    }
  }

  /**
   * 연결 종료
   */
  async cleanup() {
    section('Cleanup');

    try {
      if (this.pool) {
        await this.pool.end();
        success('Connection pool closed');
      }

      if (this.connector) {
        this.connector.close();
        success('Connector closed');
      }

      return true;
    } catch (err) {
      error('Cleanup failed: ' + err.message);
      return false;
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runAll() {
    log('\n🧪 Cloud SQL Connection Test\n', 'blue');

    let success = true;

    // 1. 설정 검증
    if (!this.validateConfig()) {
      return false;
    }

    // 2. 연결 테스트
    if (!await this.testConnection()) {
      return false;
    }

    // 3. 테이블 확인
    await this.checkTables();

    // 4. 스키마 생성 테스트
    if (!await this.testSchemaCreation()) {
      success = false;
    }

    // 5. 성능 테스트
    if (!await this.testPerformance()) {
      success = false;
    }

    // 6. 정리
    await this.cleanup();

    // 결과 요약
    section('Test Summary');
    if (success) {
      log('✅ All tests passed!', 'green');
    } else {
      log('⚠️  Some tests failed', 'yellow');
    }

    return success;
  }
}

// 실행
const tester = new CloudSqlTester();
tester.runAll()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
