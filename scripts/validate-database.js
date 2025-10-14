/**
 * 데이터베이스 검증 스크립트
 * SQLite 데이터베이스의 무결성과 성능을 검증합니다
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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

function warning(message) {
  log('⚠️  ' + message, 'yellow');
}

function info(message) {
  log('ℹ️  ' + message, 'cyan');
}

class DatabaseValidator {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 검증 시작
   */
  async validate() {
    log('\n🔍 데이터베이스 검증 시작...\n', 'blue');

    try {
      this.checkFileExists();
      this.openDatabase();
      this.checkIntegrity();
      this.checkSchema();
      this.checkIndexes();
      this.checkForeignKeys();
      this.checkDataConsistency();
      this.checkPerformance();
      this.printSummary();
    } catch (err) {
      error('검증 중 치명적 오류 발생: ' + err.message);
      process.exit(1);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }

  /**
   * 1. 파일 존재 확인
   */
  checkFileExists() {
    info('1. 데이터베이스 파일 확인...');
    if (!fs.existsSync(this.dbPath)) {
      throw new Error('데이터베이스 파일이 존재하지 않습니다: ' + this.dbPath);
    }
    const stats = fs.statSync(this.dbPath);
    success(`데이터베이스 파일 존재 확인 (크기: ${(stats.size / 1024).toFixed(2)} KB)`);
  }

  /**
   * 2. 데이터베이스 열기
   */
  openDatabase() {
    info('2. 데이터베이스 연결...');
    try {
      this.db = new Database(this.dbPath, { readonly: true });
      success('데이터베이스 연결 성공');
    } catch (err) {
      throw new Error('데이터베이스 연결 실패: ' + err.message);
    }
  }

  /**
   * 3. 무결성 검사
   */
  checkIntegrity() {
    info('3. 무결성 검사...');
    const result = this.db.prepare('PRAGMA integrity_check').get();
    if (result.integrity_check === 'ok') {
      success('무결성 검사 통과');
    } else {
      this.errors.push('무결성 검사 실패: ' + result.integrity_check);
      error('무결성 검사 실패');
    }
  }

  /**
   * 4. 스키마 검증
   */
  checkSchema() {
    info('4. 스키마 검증...');

    const requiredTables = [
      'clients',
      'estimates',
      'estimate_items',
      'invoices',
      'invoice_items',
      'work_items',
      'company_info'
    ];

    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all().map(row => row.name);

    let allFound = true;
    for (const table of requiredTables) {
      if (!tables.includes(table)) {
        this.errors.push(`필수 테이블 누락: ${table}`);
        error(`테이블 누락: ${table}`);
        allFound = false;
      }
    }

    if (allFound) {
      success(`모든 필수 테이블 존재 확인 (${requiredTables.length}개)`);
    }
  }

  /**
   * 5. 인덱스 검증
   */
  checkIndexes() {
    info('5. 인덱스 검증...');

    const indexes = this.db.prepare(`
      SELECT name, tbl_name FROM sqlite_master WHERE type='index'
    `).all();

    const requiredIndexes = [
      'idx_clients_company_name',
      'idx_estimates_client_id',
      'idx_estimates_client_date',
      'idx_estimates_client_status',
      'idx_invoices_client_status',
      'idx_work_items_client_status'
    ];

    const indexNames = indexes.map(idx => idx.name);
    let allFound = true;

    for (const index of requiredIndexes) {
      if (!indexNames.includes(index)) {
        this.warnings.push(`권장 인덱스 누락: ${index}`);
        warning(`인덱스 누락: ${index}`);
        allFound = false;
      }
    }

    if (allFound) {
      success(`모든 권장 인덱스 존재 확인 (${requiredIndexes.length}개)`);
    } else {
      warning('일부 인덱스 누락 - 성능에 영향 가능');
    }
  }

  /**
   * 6. 외래 키 제약조건 확인
   */
  checkForeignKeys() {
    info('6. 외래 키 제약조건 확인...');

    const fkCheck = this.db.prepare('PRAGMA foreign_key_check').all();

    if (fkCheck.length === 0) {
      success('외래 키 제약조건 위반 없음');
    } else {
      this.errors.push(`외래 키 제약조건 위반: ${fkCheck.length}건`);
      error(`외래 키 제약조건 위반 발견: ${fkCheck.length}건`);
      fkCheck.slice(0, 5).forEach(violation => {
        console.log('  -', violation);
      });
    }
  }

  /**
   * 7. 데이터 일관성 검증
   */
  checkDataConsistency() {
    info('7. 데이터 일관성 검증...');

    // 건축주 없는 견적서 확인
    const orphanedEstimates = this.db.prepare(`
      SELECT COUNT(*) as count FROM estimates
      WHERE client_id NOT IN (SELECT client_id FROM clients)
    `).get();

    if (orphanedEstimates.count > 0) {
      this.errors.push(`건축주 없는 견적서: ${orphanedEstimates.count}건`);
      error(`건축주 없는 견적서 발견: ${orphanedEstimates.count}건`);
    }

    // 건축주 없는 청구서 확인
    const orphanedInvoices = this.db.prepare(`
      SELECT COUNT(*) as count FROM invoices
      WHERE client_id NOT IN (SELECT client_id FROM clients)
    `).get();

    if (orphanedInvoices.count > 0) {
      this.errors.push(`건축주 없는 청구서: ${orphanedInvoices.count}건`);
      error(`건축주 없는 청구서 발견: ${orphanedInvoices.count}건`);
    }

    if (orphanedEstimates.count === 0 && orphanedInvoices.count === 0) {
      success('데이터 일관성 검증 통과');
    }
  }

  /**
   * 8. 성능 검증
   */
  checkPerformance() {
    info('8. 성능 검증...');

    // 테이블 크기 확인
    const clientCount = this.db.prepare('SELECT COUNT(*) as count FROM clients').get();
    const estimateCount = this.db.prepare('SELECT COUNT(*) as count FROM estimates').get();
    const invoiceCount = this.db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    const workItemCount = this.db.prepare('SELECT COUNT(*) as count FROM work_items').get();

    info(`  건축주: ${clientCount.count}개`);
    info(`  견적서: ${estimateCount.count}개`);
    info(`  청구서: ${invoiceCount.count}개`);
    info(`  작업항목: ${workItemCount.count}개`);

    // 쿼리 성능 테스트
    const start = Date.now();
    this.db.prepare(`
      SELECT i.*, c.company_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.client_id
      LIMIT 100
    `).all();
    const duration = Date.now() - start;

    if (duration < 100) {
      success(`쿼리 성능 양호 (${duration}ms)`);
    } else if (duration < 500) {
      warning(`쿼리 성능 보통 (${duration}ms)`);
    } else {
      this.warnings.push(`쿼리 성능 느림: ${duration}ms`);
      warning(`쿼리 성능 느림 (${duration}ms) - 인덱스 확인 필요`);
    }
  }

  /**
   * 결과 요약 출력
   */
  printSummary() {
    log('\n' + '='.repeat(60), 'blue');
    log('검증 결과 요약', 'blue');
    log('='.repeat(60) + '\n', 'blue');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      success('모든 검증 통과! 데이터베이스가 정상 상태입니다.');
    } else {
      if (this.errors.length > 0) {
        error(`오류 ${this.errors.length}건 발견:`);
        this.errors.forEach((err, idx) => {
          console.log(`  ${idx + 1}. ${err}`);
        });
      }

      if (this.warnings.length > 0) {
        warning(`경고 ${this.warnings.length}건 발견:`);
        this.warnings.forEach((warn, idx) => {
          console.log(`  ${idx + 1}. ${warn}`);
        });
      }
    }

    log('\n' + '='.repeat(60) + '\n', 'blue');

    // 종료 코드 설정
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// 실행
const dbPath = process.argv[2] || path.join(
  process.env.HOME,
  'Library/Application Support/construction-management-installer/cms.db'
);

info(`데이터베이스 경로: ${dbPath}\n`);

const validator = new DatabaseValidator(dbPath);
validator.validate();
