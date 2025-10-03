# 다음 단계 계획서 (Refactor & Roadmap)

## 개요
- 현재까지: 디자인 개편, 공용 훅(useCalendar/useSelection/useNumberFormat) 도입, JSDoc + `@ts-check` 보강, 출력 템플릿 정비, 빌드 안정화.
- 다음 단계: 남은 리팩터링/타입 전환/테스트/출력 통합/데이터 동기화(옵션)를 순차적으로 수행.

---

## 1) 리팩터링 마무리

- WorkItems
  - [ ] useNumberFormat 적용(수량/단가 입력, 합계 표기)
  - [ ] selection UI 가시성(선택 수 뱃지/상단 스테이트) 점검
  - [ ] 일괄 입력 폼 유효성(필수 필드/날짜/프로젝트) 가드 보강

- Estimates
  - [ ] useNumberFormat 적용(수량/단가 입력, 합계)
  - [ ] 수량/단가 비어있을 때 제출 유효성 재확인(required와 충돌 여부)
  - [ ] 유효기한 미사용 체크 시 UI 톤 및 안내 텍스트

- Invoices
  - [ ] selection 훅 기반 UI 문구 정리(선택 수 표기 위치 일관화)
  - [ ] (옵션) “Excel 상세 생성” 버튼 비활성/가드 or 메뉴 제거

- Clients
  - [ ] selection 전환 후 삭제 확인 모달 문구/개수 일치 재검증
  - [ ] 업체/개인 구분 시 입력 필드 토글 UX 개선(후순위)

---

## 2) 타입 전환/정비

- AppContext TS 전환(2단계)
  - [ ] 파일: `src/contexts/AppContext.ts`로 전환
  - [ ] Context value 타입 정의(export), `useApp` 반환 타입 적용
  - [ ] 저장/로드 유틸(storage) 타입 서명 추가

- 공용 타입 확장
  - [ ] `EstimateItem` 수량/단가 `number | ''` 패턴을 입력 영역과 동기화
  - [ ] Selection 타입(`Id = number | string`) 공용화

- ESLint/TSConfig
  - [ ] `allowJs` 유지 + `@ts-check` 원칙 문서화
  - [ ] js/ts 별 rule overrides 점검

---

## 3) 테스트 보강(Jest)

- 유닛 테스트
  - [x] `tests/utils/numberToKorean.test.js`
  - [ ] `tests/hooks/useNumberFormat.test.ts`
  - [ ] `tests/hooks/useSelection.test.ts`
  - [ ] `tests/hooks/useCalendar.test.ts`

- 스냅샷/출력 검증
  - [ ] 한글 금액 표기 함수 스냅샷(청구서/견적서)
  - [ ] 견적서 출력 발주처 필드 세트 여부 테스트(도메인 데이터 기준)

- 실행
  - [ ] `CI=true npm test` (향후 CI 연동)

---

## 4) 출력 템플릿 통합/개선

- 견적서(`public/quotation-output.html`)
  - [x] 발주처 정보 이메일/연락처 제거, 작업장 주소 추가
  - [x] 푸터 회사명 동적 반영(companyInfo.name) + 연도
  - [x] 여백 축소(8mm, top 4mm)

- 청구서(`public/invoice-output.html`)
  - [x] 총 청구금액 하단 한글 금액 표기(원정)
  - [ ] 표/폰트/줄간격 미세조정(필요 시)

---

## 5) 데이터 동기화(Supabase) 파일럿(옵션)

- 스키마/정책
  - [ ] clients, workplaces, work_items, invoices, estimates (+items)
  - [ ] RLS: `owner_user_id = auth.uid()` 정책

- 연동 단계
  - [ ] 읽기 전용 도입 → 쓰기(+오프라인 큐잉) → realtime
  - [ ] stampImage는 Storage, URL만 보관

- 하이브리드 동기화
  - [ ] `updated_at`/`local_updated_at`/`deleted_at` 버전 처리
  - [ ] `last_sync` 이후 변경분 페치, 충돌 규칙 정의

---

## 6) 퍼포먼스/UX

- 폼 입력 성능
  - [ ] 숫자 입력 포맷팅 re-render 최소화(`useDeferredValue` 등 검토)

- 리스트 렌더
  - [ ] WorkItems/Invoices key/분기 최소화, memoization 검토

---

## 7) 문서/운영

- 가이드/규칙
  - [x] `AGENTS.md`에 Codex 작업 규칙 추가(승인 워크플로우, 투명성 원칙)
  - [ ] `types/README.md`: 도메인 타입 사용법과 예시
  - [ ] `hooks/README.md`: 공용 훅 API 문서

- 롤백 체크포인트(자동화 옵션)
  - [ ] 체크포인트 마크다운 자동 생성 스크립트 확장
  - [ ] 최근 3개 회전 정책 점검 및 요약 보관 규칙 반영

---

## 8) 일정(제안)

- W1: useNumberFormat(WorkItems/Estimates), selection UI 마감, 테스트 2건 추가
- W2: AppContext.ts 전환 + 타입 보강, hooks 테스트 보강
- W3: 출력 템플릿 미세조정, Supabase 파일럿(읽기 전용)
- W4: Supabase 쓰기/오프라인 큐잉/충돌 처리 PoC

---

## 9) 리스크/완화

- 입력값 타입 변경(수량/단가 `''` 허용)
  - 제출 시 required 상호작용 테스트 필요 → 폼 유효성 보강
- 공용 훅 확장에 따른 의존성
  - 기존 로직 주석/가드 유지, 점진 적용
- Supabase 도입 리스크
  - RLS/권한/충돌 처리 명확화로 운영 리스크 경감

---

## 10) 승인 필요 포인트

- AppContext.ts 전환 여부/시점
- Supabase 파일럿 진행 여부/스코프(테이블 범위/권한 정책)
- 테스트 보강 범위(훅 3개 + 출력 변환 함수까지 포함할지)

