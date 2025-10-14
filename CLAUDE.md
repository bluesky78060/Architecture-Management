# Claude Code 프로젝트 기록

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

## 오류 처리 원칙

### Claude Code 작업 규칙
- **오류 발견 시**: 즉시 수정하지 말고 먼저 오류 내용을 사용자에게 보고
- **수정 승인**: 사용자가 명시적으로 수정을 요청할 때만 코드 변경
- **자율 수정 금지**: 오류나 문제점을 발견해도 사용자 승인 없이 임의 수정 불가
- **투명성 원칙**: 모든 오류와 문제점은 숨기지 말고 명확히 보고
