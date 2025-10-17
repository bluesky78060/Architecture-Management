# 건축 관리 시스템 릴리즈 노트

## v2.0.0 - 사용자 승인 시스템 (2025.10.17)

### 🎯 주요 기능
- **사용자 승인 시스템**: 모든 신규 가입자에 대한 관리자 승인 프로세스
- **이메일 알림**: 신규 가입 시 관리자에게 자동 이메일 발송
- **승인 관리 페이지**: 대기/승인/거부 사용자 관리 인터페이스
- **승인 기록 삭제**: 승인/거부된 사용자 기록 삭제 기능

### 🔐 보안 강화
- **데이터 격리**: 모든 쿼리에 user_id 필터 적용
- **RLS 정책**: Row Level Security로 사용자 데이터 보호
- **관리자 전용 페이지**: 승인 관리는 관리자만 접근 가능

### 🎨 UI/UX 개선
- **로그인 타입별 Settings 페이지**: 이메일/SNS 로그인에 따라 다른 UI 표시
- **현재 로그인 정보 표시**: 로그인 방식, 이름, 이메일 확인 가능
- **SNS 사용자 안내**: SNS 로그인 사용자는 해당 플랫폼에서 정보 관리 안내

### 📧 이메일 시스템
- **Supabase pg_net + Resend API**: PostgreSQL trigger 기반 자동 이메일 발송
- **실시간 알림**: 신규 가입 시 즉시 관리자에게 알림
- **상세 정보 포함**: 이메일, 로그인 방식, 등록일시 포함

### 🐛 버그 수정
- ChunkLoadError 해결 (homepage 경로 수정)
- ESLint strict-boolean-expressions 오류 수정
- nullable string 처리 개선

### 🔧 기술 스택
- React 18 + TypeScript
- Supabase Authentication (Email, Google OAuth, Kakao OAuth)
- PostgreSQL Triggers + pg_net
- Resend API for emails
- Vercel 자동 배포

---

## v1.9.0 - 건축주 사업자 정보 확장 (2025.10.16)

### 📊 데이터베이스 확장
- **사업자 정보 필드 추가**:
  - `business_type` (업태)
  - `business_item` (업종)
  - `tax_email` (계산서/세금계산서 발행 이메일)
  - `business_address` (사업장 주소)

### 🔧 기능 개선
- **엑셀 가져오기**: Supabase 저장 로직 구현
- **사업장 주소 체크박스**: 주소와 사업장 주소 동기화 기능
- **건축주 수정**: 모든 사업자 정보 필드 저장

### 🐛 버그 수정
- 엑셀 가져오기 시 Supabase 저장 안 되던 문제 해결
- 사업장 주소 체크박스 로직 수정

---

## v1.8.0 - UI 개선 및 데이터 보안 강화 (2025.10.15)

### 🎨 작업 항목 UI 개선
- 수량/단가 입력란 포커스 시 자동 선택
- 수량/단가 기본값 제거 (1, 0 → 빈 값)
- 비고(notes) 입력란 추가
- 취소/추가 버튼을 모달 헤더로 이동
- 헤더-콘텐츠 간격 조정

### 🔒 데이터 격리 보안
- **모든 테이블에 user_id 필터 적용**:
  - clients (건축주)
  - work_items (작업 항목)
  - estimates (견적서)
  - invoices (청구서)
  - company_info (회사 정보)
- 각 사용자는 자신의 데이터만 조회 가능

### 🔧 Supabase 쿼리 최적화
- company_info .single() → .maybeSingle()
- upsert() → 명시적 INSERT/UPDATE 분기
- 406/400 오류 해결

### 🚀 배포 개선
- SuperClaude_Framework submodule 제거
- Vercel 배포 경고 해결
- .gitignore 업데이트

---

## v1.7.0 - 클라이언트 필드 완성 (2025.10.15)

### 📊 데이터베이스 확장
- `mobile` (휴대전화) 컬럼 추가
- `workplaces` (작업장 배열) JSONB 컬럼
- `projects` (프로젝트 배열) JSONB 컬럼
- 인덱스 추가 (성능 최적화)

### 🔧 코드 수정
- AppContext.impl.tsx: 클라이언트 로딩/저장 로직 완성
- contact_person 매핑 수정 (PERSON/BUSINESS 구분)
- ESLint magic number 제거 (상수화)

### 🚀 Vercel 빌드 수정
- vercel.json 명시적 빌드 설정
- ENOENT package.json 오류 해결

---

## v1.6.0 - Supabase 완전 마이그레이션 (2025.10.14)

### 🗄️ 데이터 저장소 전환
- localStorage → Supabase PostgreSQL 완전 마이그레이션
- 모든 테이블에 user_id 컬럼 추가
- RLS (Row Level Security) 정책 적용

### 📦 CRUD 구현 완료
- **Clients (건축주)**: delete-and-insert 전략
- **WorkItems (작업 항목)**: 10개 컬럼 확장
- **Estimates (견적서)**: 중첩 데이터 처리
- **Invoices (청구서)**: 중첩 데이터 처리
- **CompanyInfo (회사 정보)**: Upsert 전략

### 🔧 해결된 문제
- 컬럼명 불일치 (name → company_name)
- SERIAL ID 충돌 해결
- NULL user_id 처리
- 중첩 데이터 외래키 처리

---

## v1.5.0 - 암호화 시스템 업그레이드 (2025.10.05)

### 🔐 보안 강화
- **XOR → AES-256-GCM** 전면 업그레이드
- **PBKDF2 키 파생** (100,000 iterations)
- **자동 마이그레이션 시스템** 구현

### 🔧 기술 개선
- 암호화 강도 대폭 향상
- 기존 데이터 자동 변환
- 보안 표준 준수

---

## v1.4.0 - 프로젝트 정리 및 최적화 (2025.09.30)

### 🧹 코드 정리
- console.log 전면 제거
- 번들 크기 감소
- 아이콘 시스템 통일 (Heroicons outline-style)

### 🖨️ 청구서 도장 시스템 최적화
- Safari 호환성 개선
- localStorage 전환
- 인쇄 성능 최적화

### ✅ 테스트 완료
- Playwright MCP 포괄적 테스트
- 100% 테스트 통과
- E2E 시나리오 검증

---

## v1.3.0 - Tier 2 테이블 컴포넌트 테스트 (2025.10.06)

### ✅ 테스트 커버리지 확장
- WorkItemsTable 테스트 21개 추가
- EstimatesTable 테스트 21개 추가
- InvoiceDetailTable 테스트 21개 추가
- **총 265개 테스트 (264 passing, 99.6%)**

### 📦 체크포인트 생성
- checkpoint_20251006_203522_tier2_table_tests_complete
- 이중 백업 구조 (개별 + checkpoint_back)

---

## v1.2.0 - Tier 1 컴포넌트 테스트 (2025.10.06)

### ✅ 테스트 구현
- Clients 테스트 추가
- WorkItems 테스트 추가
- **총 180개 테스트 통과**

### 📦 체크포인트 생성
- checkpoint_20251006_195009_tier1_component_tests_complete

---

## v1.1.0 - 초기 구조 및 기본 기능

### 🎯 핵심 기능
- 건축주 관리
- 작업 항목 관리
- 견적서 생성 및 관리
- 청구서 생성 및 관리
- 회사 정보 설정
- 대시보드

### 🎨 UI/UX
- Tailwind CSS 디자인 시스템
- Heroicons 아이콘 세트
- 반응형 레이아웃
- 모던 UI 컴포넌트

### 🔧 기술 스택
- React 18
- TypeScript
- React Router v6
- React Query
- Dexie.js (초기 로컬 DB)

---

## 배포 정보

- **프로덕션 URL**: https://architecture-management.vercel.app
- **Repository**: https://github.com/bluesky78060/Architecture-Management
- **자동 배포**: GitHub main 브랜치 푸시 시 Vercel 자동 배포
- **환경**: Node.js 18.x, React 18

---

## 향후 계획

### 🔜 다음 릴리즈
- [ ] Settings 페이지 무한 리로드 문제 해결
- [ ] 관리자 RLS 정책 개선
- [ ] 사용자 역할 관리 시스템
- [ ] 데이터 백업 및 복원 기능

### 💡 향후 아이디어
- [ ] 모바일 앱 버전
- [ ] 실시간 협업 기능
- [ ] 고급 분석 대시보드
- [ ] PDF 자동 생성 개선
- [ ] 엑셀 내보내기 기능 확장
