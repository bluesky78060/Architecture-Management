# Supabase 데이터베이스 설정 가이드

## 현재 문제
- 400 에러: `user_id` 필터링 시 오류 발생
- 원인: Supabase RLS(Row Level Security) 정책이 설정되지 않음

## 해결 방법

### 1단계: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (`rmruecimrcdtmixweqsx`)

### 2단계: SQL Editor 열기
1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### 3단계: RLS 정책 설정 SQL 실행
아래 SQL을 복사하여 실행하거나, 프로젝트의 `supabase/enable-dev-access.sql` 파일 내용을 붙여넣기:

```sql
-- ============================================
-- 개발 환경용 RLS 정책
-- 모든 사용자에게 전체 접근 권한 부여
-- ============================================

-- RLS 활성화
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Enable all access for all users" ON clients;
DROP POLICY IF EXISTS "Enable all access for all users" ON estimates;
DROP POLICY IF EXISTS "Enable all access for all users" ON estimate_items;
DROP POLICY IF EXISTS "Enable all access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable all access for all users" ON invoice_items;
DROP POLICY IF EXISTS "Enable all access for all users" ON work_items;
DROP POLICY IF EXISTS "Enable all access for all users" ON company_info;

-- 개발 환경: 모든 사용자 읽기/쓰기 가능
CREATE POLICY "Enable all access for all users" ON clients FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON estimates FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON estimate_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON invoices FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON work_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON company_info FOR ALL USING (true);
```

### 4단계: SQL 실행
1. **Run** 버튼 클릭 (또는 `Ctrl + Enter` / `Cmd + Enter`)
2. 성공 메시지 확인

### 5단계: 앱 새로고침
1. 브라우저에서 애플리케이션 페이지로 이동
2. **F5** 또는 새로고침 버튼 클릭
3. 정상 작동 확인

## 확인 방법

### 성공적으로 설정된 경우:
- ✅ Supabase initialized successfully
- ✅ 데이터 로딩 성공
- ✅ 건축주, 작업 항목, 견적서, 청구서 데이터 표시

### 여전히 에러가 발생하는 경우:
1. 브라우저 콘솔 확인 (`F12`)
2. 에러 메시지 복사
3. Supabase Table Editor에서 테이블 구조 확인
   - `clients`, `work_items`, `estimates`, `invoices` 테이블에 `user_id` 컬럼이 있는지 확인

## 프로덕션 환경 주의사항

⚠️ **현재 설정은 개발 환경용입니다!**

프로덕션 배포 시에는 다음과 같이 사용자 인증 기반 RLS 정책으로 변경해야 합니다:

```sql
-- 프로덕션용: 자신의 데이터만 접근 가능
CREATE POLICY "Users can access their own data"
  ON clients
  FOR ALL
  USING (auth.uid()::text = user_id);

-- 다른 테이블들도 동일하게 적용
```

## 문제 해결

### Q: "relation does not exist" 에러
- A: `supabase/schema.sql` 파일을 먼저 실행하여 테이블 생성

### Q: "duplicate key value violates unique constraint" 에러
- A: 기존 정책이 있는 경우 - 위 SQL의 DROP POLICY 부분이 이미 포함되어 있음

### Q: 여전히 400 에러 발생
- A: 테이블에 `user_id` 컬럼이 없을 수 있음 - `supabase/add-user-id-migration.sql` 실행

## 참고 자료
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Policies 가이드](https://supabase.com/docs/guides/auth/row-level-security#policies)
