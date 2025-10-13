/**
 * Supabase 연결 테스트 스크립트
 *
 * 이 스크립트는 Supabase 데이터베이스 연결을 테스트합니다.
 *
 * 사용법:
 * 1. .env.supabase 파일을 생성하고 Supabase 자격 증명을 설정
 * 2. node scripts/test-supabase.js 실행
 */

require('dotenv').config({ path: '.env.supabase' });

const { createClient } = require('@supabase/supabase-js');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

async function testSupabaseConnection() {
  log('\n📊 Supabase 연결 테스트 시작...\n', colors.cyan);

  // 1. 환경 변수 확인
  log('1️⃣ 환경 변수 확인', colors.blue);
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    log('❌ 환경 변수가 설정되지 않았습니다!', colors.red);
    log('   .env.supabase 파일을 생성하고 다음 변수를 설정하세요:', colors.yellow);
    log('   - SUPABASE_URL=https://your-project-id.supabase.co', colors.yellow);
    log('   - SUPABASE_ANON_KEY=your-anon-key-here', colors.yellow);
    log('   - DATABASE_BACKEND=supabase', colors.yellow);
    process.exit(1);
  }

  log(`✅ SUPABASE_URL: ${url}`, colors.green);
  log(`✅ SUPABASE_ANON_KEY: ${anonKey.substring(0, 20)}...`, colors.green);
  log(`${serviceRoleKey ? '✅' : '⚠️'} SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '설정됨' : '설정되지 않음 (선택사항)'}`, serviceRoleKey ? colors.green : colors.yellow);

  // 2. Supabase 클라이언트 생성
  log('\n2️⃣ Supabase 클라이언트 생성', colors.blue);
  let supabase;
  try {
    supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    });
    log('✅ Supabase 클라이언트 생성 성공', colors.green);
  } catch (error) {
    log(`❌ Supabase 클라이언트 생성 실패: ${error.message}`, colors.red);
    process.exit(1);
  }

  // 3. 기본 연결 테스트
  log('\n3️⃣ 데이터베이스 연결 테스트', colors.blue);
  try {
    const { error } = await supabase
      .from('clients')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116') {
        log('⚠️ clients 테이블이 존재하지 않습니다', colors.yellow);
        log('   supabase/schema.sql을 Supabase SQL Editor에서 실행하세요', colors.yellow);
      } else {
        throw error;
      }
    } else {
      log('✅ 데이터베이스 연결 성공', colors.green);
    }
  } catch (error) {
    log(`❌ 데이터베이스 연결 실패: ${error.message}`, colors.red);
    log(`   코드: ${error.code}`, colors.red);
    process.exit(1);
  }

  // 4. 테이블 존재 확인
  log('\n4️⃣ 테이블 존재 확인', colors.blue);
  const tables = ['clients', 'estimates', 'estimate_items', 'invoices', 'invoice_items', 'work_items', 'company_info'];
  const tableStatus = {};

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST116') {
          tableStatus[table] = false;
          log(`❌ ${table}: 존재하지 않음`, colors.red);
        } else {
          throw error;
        }
      } else {
        tableStatus[table] = true;
        log(`✅ ${table}: 존재함`, colors.green);
      }
    } catch (error) {
      tableStatus[table] = false;
      log(`❌ ${table}: 오류 (${error.message})`, colors.red);
    }
  }

  const missingTables = Object.entries(tableStatus).filter(([_, exists]) => !exists).map(([name]) => name);

  if (missingTables.length > 0) {
    log(`\n⚠️ ${missingTables.length}개의 테이블이 존재하지 않습니다:`, colors.yellow);
    missingTables.forEach(table => log(`   - ${table}`, colors.yellow));
    log('\n📝 다음 단계를 수행하세요:', colors.yellow);
    log('   1. Supabase Dashboard 접속 (https://app.supabase.com)', colors.yellow);
    log('   2. SQL Editor 메뉴로 이동', colors.yellow);
    log('   3. supabase/schema.sql 파일의 내용을 복사하여 실행', colors.yellow);
    log('   4. 이 스크립트를 다시 실행', colors.yellow);
  }

  // 5. 샘플 데이터 삽입/조회/삭제 테스트
  if (tableStatus['clients']) {
    log('\n5️⃣ CRUD 작업 테스트 (clients 테이블)', colors.blue);

    // 삽입
    log('   📝 샘플 데이터 삽입...', colors.cyan);
    const testClient = {
      company_name: 'Supabase 테스트 건축주',
      representative: '테스트 대표',
      business_number: '123-45-67890',
      address: '서울시 테스트구 테스트동',
      email: 'test@example.com',
      phone: '010-1234-5678',
      type: 'BUSINESS',
      notes: 'Supabase 연결 테스트용 데이터',
    };

    let insertedId;
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([testClient])
        .select('client_id')
        .single();

      if (error) throw error;
      insertedId = data.client_id;
      log(`   ✅ 데이터 삽입 성공 (ID: ${insertedId})`, colors.green);
    } catch (error) {
      log(`   ❌ 데이터 삽입 실패: ${error.message}`, colors.red);
    }

    // 조회
    if (insertedId) {
      log('   🔍 데이터 조회...', colors.cyan);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_id', insertedId)
          .single();

        if (error) throw error;
        log('   ✅ 데이터 조회 성공', colors.green);
        log(`      회사명: ${data.company_name}`, colors.green);
        log(`      대표자: ${data.representative}`, colors.green);
      } catch (error) {
        log(`   ❌ 데이터 조회 실패: ${error.message}`, colors.red);
      }

      // 업데이트
      log('   ✏️ 데이터 업데이트...', colors.cyan);
      try {
        const { error } = await supabase
          .from('clients')
          .update({ notes: 'Supabase 연결 테스트 완료!' })
          .eq('client_id', insertedId);

        if (error) throw error;
        log('   ✅ 데이터 업데이트 성공', colors.green);
      } catch (error) {
        log(`   ❌ 데이터 업데이트 실패: ${error.message}`, colors.red);
      }

      // 삭제
      log('   🗑️ 테스트 데이터 삭제...', colors.cyan);
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('client_id', insertedId);

        if (error) throw error;
        log('   ✅ 데이터 삭제 성공', colors.green);
      } catch (error) {
        log(`   ❌ 데이터 삭제 실패: ${error.message}`, colors.red);
      }
    }
  }

  // 6. 프로젝트 정보 표시
  log('\n6️⃣ Supabase 프로젝트 정보', colors.blue);
  const projectId = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectId) {
    log(`   프로젝트 ID: ${projectId}`, colors.cyan);
    log(`   대시보드: https://app.supabase.com/project/${projectId}`, colors.cyan);
    log(`   SQL Editor: https://app.supabase.com/project/${projectId}/editor`, colors.cyan);
    log(`   Table Editor: https://app.supabase.com/project/${projectId}/editor`, colors.cyan);
  }

  // 최종 결과
  log('\n' + '='.repeat(50), colors.cyan);
  const allTablesExist = Object.values(tableStatus).every(exists => exists);
  if (allTablesExist) {
    log('✅ Supabase 연결 테스트 완료!', colors.green);
    log('   모든 테이블이 정상적으로 설정되었습니다.', colors.green);
  } else {
    log('⚠️ Supabase 연결은 성공했지만 일부 테이블이 누락되었습니다.', colors.yellow);
    log('   schema.sql을 실행하여 테이블을 생성하세요.', colors.yellow);
  }
  log('='.repeat(50) + '\n', colors.cyan);
}

// 스크립트 실행
testSupabaseConnection()
  .catch(error => {
    log(`\n❌ 예상치 못한 오류: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  });
