# Supabase 배포 가이드

건축 관리 시스템을 Supabase PostgreSQL 클라우드 데이터베이스에 배포하는 방법을 설명합니다.

## 목차

1. [Supabase 소개](#supabase-소개)
2. [프로젝트 생성](#프로젝트-생성)
3. [데이터베이스 스키마 설정](#데이터베이스-스키마-설정)
4. [환경 변수 설정](#환경-변수-설정)
5. [애플리케이션 배포](#애플리케이션-배포)
6. [보안 설정](#보안-설정)
7. [모니터링 및 관리](#모니터링-및-관리)
8. [문제 해결](#문제-해결)

---

## Supabase 소개

### Supabase란?

- **오픈 소스 Firebase 대안**: PostgreSQL 기반의 백엔드 서비스
- **완전 관리형**: 데이터베이스, 인증, 스토리지, 실시간 기능 제공
- **무료 티어**: 500MB 데이터베이스, 1GB 스토리지, 2GB 대역폭/월
- **PostgreSQL**: 강력한 관계형 데이터베이스 엔진

### 무료 티어 제한

| 항목 | 무료 티어 |
|------|-----------|
| 데이터베이스 | 500MB |
| 파일 스토리지 | 1GB |
| 대역폭 | 2GB/월 |
| API 요청 | 무제한 |
| Auth 사용자 | 무제한 |
| 실시간 연결 | 200개 동시 |

**예상 사용량**:
- 건축주 1,000명
- 견적서/청구서 각 5,000개
- 작업 항목 10,000개
- 약 50MB 사용 (500MB의 10%)

---

## 프로젝트 생성

### 1단계: Supabase 계정 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 2단계: 새 프로젝트 생성

1. "New Project" 클릭
2. 프로젝트 정보 입력:
   ```
   Name: construction-management
   Database Password: [강력한 비밀번호 생성]
   Region: Northeast Asia (Seoul) 선택
   Pricing Plan: Free 선택
   ```
3. "Create new project" 클릭 (약 2분 소요)

### 3단계: API 키 확인

프로젝트 생성 후:
1. `Project Settings` > `API` 메뉴로 이동
2. 다음 정보를 복사하여 안전하게 저장:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: 클라이언트에서 사용하는 공개 키
   - **service_role key**: 서버 전용 키 (클라이언트 노출 금지!)

---

## 데이터베이스 스키마 설정

### 1단계: SQL Editor 접속

1. Supabase Dashboard에서 `SQL Editor` 메뉴 클릭
2. "New query" 버튼 클릭

### 2단계: 스키마 실행

1. `supabase/schema.sql` 파일 내용 전체 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭 (Cmd/Ctrl + Enter)

### 3단계: 테이블 확인

1. `Table Editor` 메뉴로 이동
2. 다음 7개 테이블이 생성되었는지 확인:
   - ✅ `clients` (건축주)
   - ✅ `estimates` (견적서)
   - ✅ `estimate_items` (견적서 항목)
   - ✅ `invoices` (청구서)
   - ✅ `invoice_items` (청구서 항목)
   - ✅ `work_items` (작업 항목)
   - ✅ `company_info` (회사 정보)

### 스키마 구조

```
clients (건축주)
├── client_id (PK)
├── company_name, representative, business_number
├── address, email, phone
└── type, notes, created_at, updated_at

estimates (견적서)
├── estimate_id (PK)
├── estimate_number (UNIQUE)
├── client_id (FK → clients)
└── estimate_items (1:N)

invoices (청구서)
├── invoice_id (PK)
├── invoice_number (UNIQUE)
├── client_id (FK → clients)
└── invoice_items (1:N)

work_items (작업 항목)
├── work_item_id (PK)
├── client_id (FK → clients)
└── status, progress, priority

company_info (회사 정보)
└── id = 1 (singleton)
```

---

## 환경 변수 설정

### 1단계: 환경 변수 파일 생성

프로젝트 루트에 `.env.supabase` 파일 생성:

```bash
# Supabase 프로젝트 설정
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # 서버 전용

# 데이터베이스 백엔드 선택
DATABASE_BACKEND=supabase
```

### 2단계: 실제 값으로 교체

1. **SUPABASE_URL**: Project Settings > API에서 복사한 Project URL
2. **SUPABASE_ANON_KEY**: Project Settings > API에서 복사한 anon public key
3. **DATABASE_BACKEND**: `supabase`로 설정 (로컬에서는 `sqlite` 사용)

### 3단계: 연결 테스트

```bash
node scripts/test-supabase.js
```

**예상 출력**:
```
📊 Supabase 연결 테스트 시작...

1️⃣ 환경 변수 확인
✅ SUPABASE_URL: https://xxxxxxxxxxxxx.supabase.co
✅ SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...

2️⃣ Supabase 클라이언트 생성
✅ Supabase 클라이언트 생성 성공

3️⃣ 데이터베이스 연결 테스트
✅ 데이터베이스 연결 성공

4️⃣ 테이블 존재 확인
✅ clients: 존재함
✅ estimates: 존재함
...

✅ Supabase 연결 테스트 완료!
```

---

## 애플리케이션 배포

### Vercel 배포 (권장)

#### 1단계: Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결
vercel
```

#### 2단계: 환경 변수 설정

Vercel Dashboard에서:
1. `Settings` > `Environment Variables` 메뉴
2. 다음 변수 추가:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   DATABASE_BACKEND=supabase
   ```

#### 3단계: 배포

```bash
# 프로덕션 배포
vercel --prod
```

### Netlify 배포

#### 1단계: netlify.toml 생성

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2단계: 환경 변수 설정

Netlify Dashboard에서:
1. `Site settings` > `Environment variables`
2. Supabase 자격 증명 추가

#### 3단계: 배포

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 배포
netlify deploy --prod
```

### GitHub Pages 배포

⚠️ **주의**: GitHub Pages는 정적 사이트만 지원합니다. 클라이언트 측에서 Supabase에 직접 연결해야 합니다.

```bash
# 빌드 및 배포
npm run deploy
```

---

## 보안 설정

### Row Level Security (RLS) 활성화

프로덕션 환경에서는 반드시 RLS를 활성화해야 합니다.

#### 1단계: RLS 활성화

SQL Editor에서 실행:

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
```

#### 2단계: 정책 설정

**개발 환경 (모든 접근 허용)**:
```sql
-- clients 테이블 예시
CREATE POLICY "Enable all access for all users"
ON clients FOR ALL
USING (true);
```

**프로덕션 환경 (인증된 사용자만)**:
```sql
-- 읽기 권한
CREATE POLICY "Enable read for authenticated users"
ON clients FOR SELECT
USING (auth.role() = 'authenticated');

-- 쓰기 권한
CREATE POLICY "Enable insert for authenticated users"
ON clients FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 수정 권한
CREATE POLICY "Enable update for authenticated users"
ON clients FOR UPDATE
USING (auth.role() = 'authenticated');

-- 삭제 권한
CREATE POLICY "Enable delete for authenticated users"
ON clients FOR DELETE
USING (auth.role() = 'authenticated');
```

### API 키 보안

1. **절대 커밋 금지**: `.env.supabase`를 `.gitignore`에 추가
2. **Anon Key**: 클라이언트 노출 가능 (RLS로 보호)
3. **Service Role Key**: 절대 클라이언트에 노출 금지 (서버 전용)
4. **주기적 재생성**: API 키는 3-6개월마다 재생성 권장

---

## 모니터링 및 관리

### Database 사용량 확인

1. Supabase Dashboard > `Settings` > `Usage`
2. 확인 항목:
   - Database size (500MB 제한)
   - Bandwidth (2GB/월 제한)
   - Active connections

### 백업 설정

**자동 백업 (Pro 플랜)**:
- 일일 자동 백업
- 7일 보관

**수동 백업 (무료 플랜)**:
```sql
-- SQL Editor에서 테이블별 데이터 내보내기
SELECT * FROM clients;
SELECT * FROM estimates;
-- ... (CSV로 저장)
```

### 성능 모니터링

1. `SQL Editor` > `Query Performance` 메뉴
2. 느린 쿼리 확인
3. 인덱스 추가 고려:
   ```sql
   CREATE INDEX idx_custom ON table_name(column_name);
   ```

---

## 문제 해결

### 연결 오류

**증상**: "Failed to connect to Supabase"

**해결**:
1. `.env.supabase` 파일 확인
2. URL 형식 검증: `https://xxx.supabase.co`
3. API 키 재확인
4. 테스트 스크립트 실행: `node scripts/test-supabase.js`

### 테이블 없음 오류

**증상**: "relation 'clients' does not exist"

**해결**:
1. SQL Editor에서 `supabase/schema.sql` 실행
2. Table Editor에서 테이블 생성 확인

### RLS 정책 오류

**증상**: "new row violates row-level security policy"

**해결**:
1. RLS 정책 확인
2. 개발 환경에서는 모든 접근 허용 정책 사용
3. 인증 상태 확인

### 성능 문제

**증상**: 쿼리가 느림

**해결**:
1. 쿼리 복잡도 확인
2. 필요한 인덱스 추가
3. 페이지네이션 사용 (LIMIT, OFFSET)
4. 관계 조회 최적화 (JOIN 대신 여러 쿼리 사용)

### 무료 티어 제한 초과

**증상**: "Database size limit exceeded"

**해결**:
1. 불필요한 데이터 삭제
2. 파일 스토리지 정리
3. Pro 플랜 업그레이드 고려 ($25/월)

---

## 추가 리소스

- **Supabase 공식 문서**: https://supabase.com/docs
- **PostgreSQL 문서**: https://www.postgresql.org/docs/
- **Supabase JavaScript SDK**: https://supabase.com/docs/reference/javascript
- **커뮤니티 Discord**: https://discord.supabase.com

---

## 체크리스트

배포 전 확인사항:

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 스키마 실행 완료 (7개 테이블)
- [ ] `.env.supabase` 파일 생성 및 설정
- [ ] 연결 테스트 성공 (`test-supabase.js`)
- [ ] RLS 정책 설정 (프로덕션 환경)
- [ ] API 키 보안 확인 (Service Role Key 노출 금지)
- [ ] 백업 계획 수립
- [ ] 모니터링 설정 완료
- [ ] 배포 플랫폼 선택 (Vercel/Netlify/GitHub Pages)
- [ ] 환경 변수 설정 (배포 플랫폼)
- [ ] 프로덕션 빌드 테스트
- [ ] 실제 배포 및 검증

---

**다음 단계**: [로컬 개발 가이드](./DEVELOPMENT.md) | [API 문서](./API.md)
