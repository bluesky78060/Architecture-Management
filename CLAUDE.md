# Claude Code 프로젝트 기록

## 🤖 자동 세션 관리 규칙 (중요!)

### Context 자동 저장 규칙
**CRITICAL**: Claude는 다음 상황에서 **반드시** 자동으로 `/sc:save`를 실행해야 합니다:
- ✅ **Context left until auto-compact ≤ 1%** 일 때
- ✅ 중요한 작업 완료 후 (기능 구현, 버그 수정)
- ✅ 사용자가 명시적으로 요청할 때
- ✅ 복잡한 변경사항 완료 후

### 세션 자동 로드 규칙
**CRITICAL**: Claude는 다음 상황에서 **반드시** `/sc:load`를 실행해야 합니다:
- ✅ **새 세션 시작 시** (Context가 리셋된 후)
- ✅ 사용자가 "이전 작업 내용 로드" 또는 "계속" 요청 시
- ✅ 프로젝트 상태를 모를 때

### 실행 패턴
```
세션 시작 → /sc:load → 작업 진행 → Context < 1% → /sc:save (자동) → 세션 종료
새 세션 → /sc:load → 이전 작업 이어서 계속
```

## 체크포인트 시스템

### 자동 체크포인트 생성 규칙
- **트리거**: "체크포인트" 프롬프트 입력 시
- **동작**: 현재 시점의 전체 프로젝트 백업 자동 생성
- **이중 백업**: 개별 체크포인트 + checkpoint_back 폴더 자동 업데이트

### 백업 위치 및 구조
```
/Users/leechanhee/backup_checkpoints/
├── checkpoint_YYYYMMDD_HHMMSS_[설명]/    # 개별 체크포인트
├── checkpoint_back/                      # 전체 프로젝트 최신 백업 (자동 갱신)
├── RESTORE_INSTRUCTIONS.md
└── [기타 체크포인트 폴더들...]
```

### 향상된 체크포인트 시스템 (2025.09.30 업데이트)
- **이중 백업 구조**: 
  - 개별 체크포인트: 특정 시점의 변경사항만 백업
  - checkpoint_back: 항상 최신 전체 프로젝트 상태 유지
- **자동 동기화**: 체크포인트 생성 시 수정된 파일을 checkpoint_back에 자동 복사
- **자동 문서화**: 체크포인트 생성 시 CLAUDE.md 자동 업데이트
- **회전 정책**: 최신 3개 기록만 유지, 이전 기록은 자동 삭제
- **롤백 편의성**: 전체 프로젝트 복원이나 개별 파일 복원 모두 지원

### CLAUDE.md 자동 관리 규칙
- **체크포인트 트리거**: "체크포인트" 명령 시 자동 기록
- **기록 형식**: 새 작업은 상세 기록, 이전 작업은 축약 형태
- **보관 주기**: 최신 3개 작업 기록만 유지
- **자동 정리**: 3회차 이전 내용은 자동 삭제하여 파일 크기 관리

### 현재 생성된 체크포인트
1. **checkpoint_20251006_203522_tier2_table_tests_complete** ✨ 최신
   - 생성일시: 2025년 10월 6일 20:35:22
   - 설명: Tier 2 테이블 컴포넌트 테스트 완료
   - 내용: WorkItemsTable, EstimatesTable, InvoiceDetailTable 테스트 63개 추가
   - 테스트 커버리지: 20 test suites, 265 tests (264 passing, 99.6%)

2. **checkpoint_20251006_195009_tier1_component_tests_complete**
   - 생성일시: 2025년 10월 6일 19:50:09
   - 설명: 모든 Tier 1 컴포넌트 테스트 완료
   - 내용: Clients, WorkItems 테스트 42개 추가 (총 180개 테스트 통과)

3. **checkpoint_20250930_205041_stamp_optimization_complete**
   - 생성일시: 2025년 9월 30일 20:50:41
   - 설명: 청구서 도장 시스템 최적화 완료

## 복원 방법

### 전체 프로젝트 복원
```bash
cd /Users/leechanhee
rm -rf ConstructionManagement-Installer
cp -r backup_checkpoints/[체크포인트명] ConstructionManagement-Installer
```

### 특정 파일만 복원
```bash
cp backup_checkpoints/[체크포인트명]/src/components/[파일명] /Users/leechanhee/ConstructionManagement-Installer/src/components/
```

## 프로젝트 진행 기록

### 2025.10.17 - Settings 페이지 무한 리로드 문제 디버깅 🔧🔍
- **작업 내용**: Settings(계정 설정) 페이지 생성 및 무한 리로드 문제 해결 시도
- **문제 진단**:
  - Settings 페이지 접속 시 `/settings` → `/` 로 리다이렉트
  - 네트워크 탭에서 favicon.ico 계속 요청 (페이지 리로드 반복)
  - Settings 컴포넌트가 렌더링되지 않음
- **시도한 해결 방법**:
  - ❌ useEffect cleanup function 추가 (무한 루프 방지)
  - ❌ UserContext 사용으로 supabase.auth.getUser() 직접 호출 제거
  - ❌ Settings 컴포넌트 완전 단순화 (정적 텍스트만 표시)
  - ✅ 디버그 로그 추가: UserContext, App.tsx, Layout.tsx, Settings.tsx
- **발견된 원인**:
  - `/settings` 접속 시 App.tsx의 로그인 체크 로직에서 리다이렉트 발생
  - UserContext의 `onAuthStateChange` 리스너와 충돌 가능성
  - `isLoggedIn` 상태가 일시적으로 false가 되면서 Login 페이지로 리다이렉트
- **현재 상태**: 🔄 디버깅 진행 중
  - Supabase 로그인은 정상 작동 (SIGNED_IN 이벤트 확인)
  - `/settings` 라우트는 설정되어 있음
  - 라우팅 클릭 이벤트는 정상 감지됨
  - 하지만 Settings 컴포넌트가 렌더링되지 않고 대시보드로 리다이렉트
- **다음 단계**:
  - Preserve log로 전체 로그 캡처 필요
  - isLoggedIn 상태 변화 추적
  - 라우팅 로직 수정 필요

### 2025.10.16 - 건축주 사업자 정보 필드 추가 및 엑셀 가져오기 디버깅 🏢📊
- **작업 내용**: 건축주 사업자 정보 필드 Supabase 저장, 엑셀 가져오기 디버깅, 사업장 주소 체크박스 수정
- **문제 진단**:
  - 건축주 엑셀 가져오기 시 Supabase 저장 안 됨
  - 사업자 선택 시 업태, 업종, 발행 이메일, 사업장 주소 저장 안 됨
  - 사업장 주소 체크박스 동작 반대로 작동
- **DB 스키마 확장**:
  - ✅ `business_type` VARCHAR(100) 컬럼 추가 (업태)
  - ✅ `business_item` VARCHAR(100) 컬럼 추가 (업종)
  - ✅ `tax_email` VARCHAR(100) 컬럼 추가 (계산서/세금계산서 발행 이메일)
  - ✅ `business_address` TEXT 컬럼 추가 (사업장 주소)
  - 📄 마이그레이션 스크립트 생성: `supabase/migrations/add_business_fields_to_clients.sql`
- **코드 수정**:
  - **Clients.tsx (새 건축주 추가)**:
    - 485-509번 라인: INSERT 시 business_type, business_item, business_address, tax_email 추가
  - **Clients.tsx (건축주 수정)**:
    - 424-453번 라인: UPDATE 시 사업자 정보 필드 추가
    - 디버깅 로그 추가 (updateData 출력)
  - **Clients.tsx (엑셀 가져오기)**:
    - 209-265번 라인: 디버깅 로그 추가 (/* eslint-disable no-console */)
  - **Clients.tsx (사업장 주소 체크박스)**:
    - 1040-1054번 라인: 체크박스 로직 수정
    - 체크 해제 시 → 사업장 주소와 동기화
    - 체크 시 → 빈 문자열로 초기화하여 별도 입력 가능
  - **AppContext.impl.tsx (로딩)**:
    - 203-211번 라인: business 객체에 DB에서 로드한 실제 값 매핑
    - 하드코딩된 빈 문자열 제거 → 실제 컬럼 값 사용
- **Supabase 마이그레이션 필요**:
  - ⚠️ 400 Bad Request 에러: 새 컬럼이 아직 테이블에 없음
  - 📋 Supabase Dashboard → SQL Editor에서 마이그레이션 실행 필요
  - 또는 `supabase migration up` 명령 실행

### Git 커밋 (2025.10.16)
- `db6c5ce` - feat: add Supabase save logic to clients Excel import
- `21c5d4d` - debug: add detailed logging for clients Excel import Supabase save
- `22b7c80` - feat: add business fields (type, item, address, tax_email) to clients
- `3f20199` - debug: add detailed logging for client update errors

### 다음 단계
1. 🔧 Supabase 마이그레이션 실행 (SQL Editor에서 add_business_fields_to_clients.sql 실행)
2. 🔄 브라우저 새로고침 후 건축주 사업자 정보 입력 테스트
3. 💾 Supabase Table Editor에서 데이터 저장 확인

---

### 2025.10.15 - UI 개선 및 데이터 격리 보안 강화 🔒✨
- **작업 내용**: 작업 항목 UI 개선, 데이터 보안 강화, Supabase 쿼리 오류 수정
- **UI/UX 개선**:
  - ✅ 일괄 작업 항목 추가 데이터 Supabase 저장 구현
  - ✅ 수량/단가 입력란 포커스 시 자동 선택 (onFocus select)
  - ✅ 수량/단가 기본값 제거 (1, 0 → 빈 값)
  - ✅ 비고(notes) 입력란 추가 - 작업정보 섹션 내 배치
  - ✅ 취소/추가 버튼을 모달 헤더로 이동
  - ✅ 헤더-콘텐츠 간격 조정 (pt-6→pt-5, pb-6→pb-3)
- **보안 강화** (중요!):
  - ✅ **데이터 격리**: 모든 쿼리에 user_id 필터 추가
    - clients 테이블: .eq('user_id', userId)
    - work_items 테이블: .eq('user_id', userId)
    - estimates 테이블: .eq('user_id', userId)
    - invoices 테이블: .eq('user_id', userId)
    - company_info 테이블: .eq('user_id', userId)
  - 🔒 이전에는 모든 사용자 데이터가 섞여 표시됨
  - 🔒 수정 후: 각 사용자는 자신의 데이터만 조회 가능
- **Supabase 쿼리 오류 수정**:
  - ❌ 406 오류: company_info .single() → .maybeSingle() 변경
  - ❌ 400 오류: upsert() → 명시적 INSERT/UPDATE 로직으로 변경
  - ✅ 존재 여부 확인 후 UPDATE/INSERT 분기 처리
- **Git 문제 해결**:
  - ✅ SuperClaude_Framework submodule 제거
  - ✅ .gitignore에 추가하여 향후 충돌 방지
  - ✅ Vercel 배포 시 submodule 경고 해결

### Git 커밋 (2025.10.15)
- `833cb70` - feat: relocate notes field to work info section under labor fields
- `685d91a` - feat: move action buttons to modal header
- `ff8e515` - style: reduce spacing between header and content section
- `2ad71f0` - fix: add user_id filter to all data queries for data isolation
- `414c097` - fix: resolve company_info query errors (406 and 400)
- `766aafe` - fix: replace upsert with explicit insert/update for company_info
- `8502a80` - fix: remove SuperClaude_Framework submodule and add to gitignore

### 2025.10.15 - 클라이언트 필드 완성 및 Vercel 배포 수정
- **작업 내용**: 클라이언트 데이터 완전 저장 구현 및 빌드 환경 최적화
- **문제 진단**:
  - 콘솔 로그: 데이터가 완전히 준비되었으나 일부 필드만 저장됨
  - DB 확인: mobile, workplaces, projects 필드가 테이블에 없음
- **DB 스키마 확장**:
  - ✅ `mobile` VARCHAR(20) 컬럼 추가 (휴대전화)
  - ✅ `workplaces` JSONB 컬럼 추가 (작업장 배열)
  - ✅ `projects` JSONB 컬럼 추가 (프로젝트 배열)
  - ✅ 인덱스 추가 (idx_clients_mobile, idx_clients_workplaces)
- **코드 수정**:
  - AppContext.impl.tsx: 클라이언트 로딩 로직에 mobile, workplaces, projects 추가
  - AppContext.impl.tsx: 클라이언트 저장 로직에 모든 필드 매핑
  - contact_person 매핑 수정 (PERSON: name, BUSINESS: representative)
- **Vercel 빌드 수정**:
  - vercel.json에 명시적 빌드 설정 추가 (buildCommand, outputDirectory, framework)
  - ENOENT package.json 오류 해결
- **ESLint 수정**:
  - JSON_INDENT_SPACES 상수 추가 (magic number 2 제거)
  - INITIAL_LOAD_GRACE_PERIOD_MS, DEBOUNCE_DELAY_MS 상수 사용
- **검증 완료**:
  - 이찬희: workplaces, projects 정상 저장
  - 박나라: mobile, workplaces, projects 모두 정상 저장
  - 콘솔 로그와 Supabase Table Editor로 데이터 완전성 확인

### Git 커밋
- `fcee3cf` - feat: add missing client fields (mobile, workplaces, projects)
- `7f4da22` - fix: add explicit build configuration to vercel.json
- `a72c4a7` - fix: replace magic numbers with named constants
- `d3467c4` - fix: replace JSON.stringify magic number with constant
- `aaae9c4` - chore: remove debug logging after successful verification

### 2025.10.14 - Supabase 완전 마이그레이션 🚀
- **작업 내용**: localStorage에서 Supabase PostgreSQL로 데이터 저장소 완전 전환
- **데이터베이스 마이그레이션**:
  - ✅ 모든 테이블에 user_id 컬럼 추가 (UUID, auth.users 참조)
  - ✅ user_id 인덱스 생성 (성능 최적화)
  - ✅ RLS (Row Level Security) 정책 적용
  - ✅ 개발 환경 전체 접근 정책 설정
  - ✅ company_info.user_id UNIQUE constraint 추가

### CRUD 구현 완료
- **Clients (건축주)**:
  - 데이터 로딩: 전체 필드 매핑 (business 객체 포함)
  - 데이터 저장: delete-and-insert 전략, SERIAL ID 자동 생성
- **WorkItems (작업 항목)**:
  - 테이블 스키마 확장 (10개 컬럼 추가: client_name, workplace_name, project_name, default_price, quantity, unit, labor_* 등)
  - 데이터 로딩 및 저장 완전 구현
- **Estimates (견적서)**:
  - 중첩 데이터 처리 (estimates + estimate_items JOIN)
  - 견적서 저장 후 반환된 ID로 항목 저장
- **Invoices (청구서)**:
  - 중첩 데이터 처리 (invoices + invoice_items JOIN)
  - 청구서 저장 후 반환된 ID로 항목 저장
- **CompanyInfo (회사 정보)**:
  - Upsert 전략 (onConflict: user_id)
  - 컬럼명 수정 (name → company_name)

### 해결된 주요 문제
1. **컬럼명 불일치**: name → company_name 수정
2. **SERIAL ID 충돌**: 수동 ID 할당 제거, 데이터베이스 자동 생성 사용
3. **스키마 불일치**: work_items 테이블 10개 컬럼 추가
4. **NULL user_id**: 기존 데이터 삭제, user_id 필수 적용
5. **중첩 데이터 외래키**: 부모 저장 후 반환된 ID로 자식 저장

### Git 커밋
- `0fb420f` - feat: complete Supabase CRUD implementation for all data types
- `f03aed8` - fix: remove manual ID assignments in Supabase CRUD operations

### 현재 상태
- ⚠️ Supabase 스키마 캐시 새로고침 필요
- ⚠️ company_info 406/400 에러 남아있음 (스키마 캐시 문제)
- ✅ 기본 CRUD 로직 완성
- 🔄 테스트 및 검증 진행 중

### 2025.10.05 - 암호화 시스템 마이그레이션 완료 🔒
- XOR → AES-256-GCM 전면 업그레이드
- PBKDF2 키 파생 (100,000 iterations)
- 자동 마이그레이션 시스템 구현

### 2025.09.30 - 이전 작업 요약
- 청구서 도장 시스템 최적화 (Safari 호환성, localStorage 전환)
- 프로젝트 전면 정리 (console.log 제거, 번들 크기 감소)
- Playwright MCP 포괄적 테스트 (100% 통과)
- 아이콘 시스템 통일 (outline-style Heroicons)

## 주의사항
- 복원 전 현재 작업 내용 백업 필수
- 복원 후 `npm install` 실행하여 의존성 확인
- 체크포인트는 수동 삭제 필요 (자동 삭제 안됨)

## 배포 프로세스 🚀

### Vercel 자동 배포 워크플로우
이 프로젝트는 GitHub main 브랜치와 Vercel이 연동되어 자동 배포됩니다.

#### 1. 로컬 개발 → 프로덕션 배포 절차
```bash
# 1. 코드 작업 완료 후 Git 커밋
git add .
git commit -m "feat: 기능 설명"

# 2. GitHub main 브랜치로 푸시
git push origin main

# 3. Vercel 자동 배포 (1-2분 소요)
# - GitHub 푸시 감지
# - 자동 빌드 시작
# - 프로덕션 배포 완료
```

#### 2. 배포 확인 방법
- **Vercel Dashboard**: https://vercel.com/dashboard
  - Deployments 탭에서 빌드 상태 확인
  - 빌드 로그 실시간 모니터링
  - 배포 완료 시 자동 알림

- **프로덕션 URL**: https://architecture-management.vercel.app
  - 배포 완료 후 강력 새로고침 (Cmd+Shift+R)
  - 브라우저 캐시 비활성화 권장

#### 3. 로컬 개발 서버
```bash
# 로컬 테스트용 개발 서버 (http://localhost:3000)
BROWSER=none PORT=3000 npm start

# 또는 기본 실행
npm start
```

#### 4. 배포 전 체크리스트
- ✅ 로컬 개발 서버에서 정상 작동 확인
- ✅ ESLint 오류 없음 (warnings 무시 가능)
- ✅ TypeScript 컴파일 오류 없음
- ✅ 콘솔 에러 없음 (Supabase 연결 정상)
- ✅ Git status 깔끔 (커밋 안 된 변경사항 없음)

#### 5. 배포 후 검증
- ✅ Vercel Dashboard에서 배포 성공 확인
- ✅ 프로덕션 URL 접속 확인
- ✅ 주요 기능 동작 테스트 (로그인, CRUD)
- ✅ 브라우저 콘솔 에러 확인

### 배포 환경 설정
- **Repository**: https://github.com/bluesky78060/Architecture-Management
- **Branch**: main (자동 배포 트리거)
- **Framework**: React (Create React App)
- **Build Command**: `npm run build` (자동)
- **Output Directory**: `build/` (자동)
- **Node Version**: 18.x (Vercel 기본값)

### 문제 해결
**배포가 안 될 때:**
1. GitHub에 푸시가 정상적으로 됐는지 확인
2. Vercel Dashboard에서 빌드 로그 확인
3. `vercel.json` 설정 확인
4. 환경 변수 설정 확인 (Supabase URL, Anon Key)

**배포는 됐는데 변경사항이 안 보일 때:**
1. 브라우저 강력 새로고침 (Cmd+Shift+R)
2. 시크릿 모드에서 접속해보기
3. 배포 시간 확인 (1-2분 소요)

## 오류 처리 원칙

### Claude Code 작업 규칙
- **오류 발견 시**: 즉시 수정하지 말고 먼저 오류 내용을 사용자에게 보고
- **수정 승인**: 사용자가 명시적으로 수정을 요청할 때만 코드 변경
- **자율 수정 금지**: 오류나 문제점을 발견해도 사용자 승인 없이 임의 수정 불가
- **투명성 원칙**: 모든 오류와 문제점은 숨기지 말고 명확히 보고
