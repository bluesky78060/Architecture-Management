# Supabase 마이그레이션 실행 가이드

## 🎯 목표
로컬스토리지에서 Supabase Database로 전환하여 모든 기기에서 데이터 동기화

## ⚠️ 중요: 이 작업은 반드시 순서대로 진행해야 합니다!

---

## 1단계: Supabase Dashboard 접속

1. 브라우저에서 https://supabase.com 접속
2. 로그인 후 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

---

## 2단계: 기본 스키마 확인

### 2-1. 테이블 확인
1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 다음 테이블이 있는지 확인:
   - ✅ clients
   - ✅ estimates
   - ✅ estimate_items
   - ✅ invoices
   - ✅ invoice_items
   - ✅ work_items
   - ✅ company_info

### 2-2. 테이블이 없다면
1. `supabase/schema.sql` 파일 열기
2. 전체 내용 복사
3. **SQL Editor**에 붙여넣기
4. **Run** 버튼 클릭 (또는 Cmd/Ctrl + Enter)

---

## 3단계: 마이그레이션 SQL 실행 (필수!)

### 3-1. 마이그레이션 파일 열기
터미널에서:
```bash
cat supabase/add-user-id-migration.sql
```

또는 파일 직접 열기:
- 경로: `/Users/leechanhee/ConstructionManagement-Installer/supabase/add-user-id-migration.sql`

### 3-2. SQL 실행
1. **SQL Editor**로 돌아가기
2. **New query** 버튼 클릭
3. 마이그레이션 SQL 전체 내용 복사
4. 붙여넣기
5. **Run** 버튼 클릭 (Cmd/Ctrl + Enter)

### 3-3. 성공 확인
하단에 다음 메시지가 표시되어야 합니다:
```
✅ Migration completed successfully!
👤 User ID columns added to all tables
🔒 Row Level Security enabled
🛡️ RLS policies created for user data isolation
```

---

## 4단계: 테이블 구조 확인

### 4-1. user_id 컬럼 확인
1. **Table Editor** 메뉴로 이동
2. `clients` 테이블 클릭
3. 컬럼 목록에 `user_id UUID` 있는지 확인

### 4-2. RLS 활성화 확인
1. 테이블 설정 아이콘 클릭
2. "Row Level Security" 섹션
3. **Enable RLS** 토글이 켜져 있는지 확인

---

## 5단계: 환경 변수 확인

### 5-1. 로컬 개발 환경
`.env` 파일 확인 (없으면 생성):
```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5-2. API 키 가져오기
1. Supabase Dashboard > **Settings** > **API**
2. **Project URL** 복사 → `REACT_APP_SUPABASE_URL`
3. **anon public** 키 복사 → `REACT_APP_SUPABASE_ANON_KEY`

### 5-3. 환경 변수 적용
```bash
# .env 파일 생성/수정 후
source .env  # 또는 터미널 재시작
```

---

## 6단계: 로컬 테스트

### 6-1. 개발 서버 시작
```bash
npm start
```

### 6-2. 로그인 테스트
1. 브라우저에서 `http://localhost:3000` 접속
2. 이메일/비밀번호로 로그인
3. 성공 시 대시보드로 이동

### 6-3. 데이터 테스트
1. **건축주 관리** 메뉴 클릭
2. 새 건축주 추가
3. Supabase Dashboard > **Table Editor** > `clients`
4. 방금 추가한 데이터가 보이는지 확인
5. `user_id` 필드에 값이 있는지 확인

---

## 7단계: Vercel 배포

### 7-1. 환경 변수 설정
Vercel Dashboard에서:
1. 프로젝트 선택 > **Settings** > **Environment Variables**
2. 다음 변수 추가:
   ```
   REACT_APP_SUPABASE_URL = https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = your-anon-key-here
   ```

### 7-2. 배포 실행
```bash
# 배포 (환경 변수 설정 후)
vercel --prod
```

### 7-3. 배포 확인
1. Vercel이 제공한 URL 접속
2. 로그인 테스트
3. 데이터 CRUD 테스트

---

## 8단계: 데이터 마이그레이션 (선택사항)

### 기존 로컬스토리지 데이터가 있다면:

#### 방법 1: 수동 입력 (권장)
- 기존 데이터가 적다면 수동으로 다시 입력

#### 방법 2: 브라우저 콘솔 스크립트
1. 기존 사이트 접속
2. F12 > Console 탭
3. 다음 스크립트 실행:
```javascript
// 로컬스토리지 데이터 추출
const data = {
  clients: JSON.parse(localStorage.getItem('constructionApp_clients') || '[]'),
  estimates: JSON.parse(localStorage.getItem('constructionApp_estimates') || '[]'),
  invoices: JSON.parse(localStorage.getItem('constructionApp_invoices') || '[]'),
  workItems: JSON.parse(localStorage.getItem('constructionApp_workItems') || '[]')
};
console.log(JSON.stringify(data, null, 2));
```
4. 출력된 JSON 복사
5. 새 사이트에서 수동으로 입력

---

## ✅ 완료 체크리스트

### Supabase 설정
- [ ] 기본 스키마 실행 완료 (7개 테이블 생성)
- [ ] 마이그레이션 SQL 실행 완료
- [ ] user_id 컬럼 추가 확인
- [ ] RLS 활성화 확인
- [ ] RLS 정책 생성 확인

### 환경 변수
- [ ] 로컬 .env 파일 생성
- [ ] REACT_APP_SUPABASE_URL 설정
- [ ] REACT_APP_SUPABASE_ANON_KEY 설정
- [ ] Vercel 환경 변수 설정

### 테스트
- [ ] 로컬 개발 서버 정상 작동
- [ ] 로그인 성공
- [ ] 건축주 추가 테스트
- [ ] Supabase에서 데이터 확인
- [ ] Vercel 배포 성공
- [ ] 배포된 사이트 정상 작동

---

## 🆘 문제 해결

### 문제: "Supabase가 초기화되지 않았습니다"
**해결**:
1. `.env` 파일 확인
2. 환경 변수 값이 정확한지 확인
3. `npm start` 재시작

### 문제: "로그인이 필요합니다" 무한 루프
**해결**:
1. Supabase Dashboard > Authentication 확인
2. 사용자가 생성되어 있는지 확인
3. 이메일 인증이 완료되었는지 확인

### 문제: 데이터가 저장되지 않음
**해결**:
1. 브라우저 Console (F12) 확인
2. RLS 정책 오류가 있는지 확인
3. `supabase/add-user-id-migration.sql` 다시 실행

### 문제: "new row violates row-level security policy"
**해결**:
1. RLS 정책이 제대로 생성되었는지 확인
2. 로그인된 사용자의 ID가 올바른지 확인
3. 필요시 개발 환경에서 RLS 비활성화:
```sql
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- (테스트 후 다시 활성화)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

---

## 📞 추가 지원

문제가 계속되면:
1. 브라우저 Console 오류 메시지 확인
2. Supabase Dashboard > Logs 확인
3. 오류 메시지와 함께 Claude Code에 문의

---

**작성일**: 2025년 10월 14일
**버전**: 1.0
**상태**: Supabase 마이그레이션 준비 완료
