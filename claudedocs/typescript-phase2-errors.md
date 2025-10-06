# TypeScript Phase 2: tsconfig.json 강화 - 오류 분석 보고서

생성일: 2025-10-06
Phase: 2 - tsconfig.json Strict Options 활성화

## 적용된 설정 변경

```json
{
  "noUnusedLocals": true,      // false → true
  "noUnusedParameters": true,  // false → true
  "noImplicitReturns": true,   // 이미 활성화됨
  "noFallthroughCasesInSwitch": true  // 이미 활성화됨
}
```

## 전체 오류 현황

- **초기 오류**: 251개
- **@types/jest 설치 후**: 16개
- **감소율**: 93.6%

## 오류 유형 분류

### 1. TS6133: Unused Variables/Parameters (6개) ⭐ 우선순위: 높음

| 파일 | 라인 | 변수명 | 타입 |
|------|------|--------|------|
| src/contexts/__tests__/AppContext.impl.test.tsx | 2 | React | import |
| src/hooks/__tests__/useFilters.test.tsx | 2 | React | import |
| src/hooks/__tests__/useModalState.test.tsx | 2 | React | import |
| src/hooks/__tests__/useSelection.test.tsx | 2 | React | import |
| src/utils/excelUtils-backup.ts | 2 | ExcelJS | import |
| src/utils/securityMigration.ts | 69 | masterPassword | parameter |

**해결 방법**:
- 테스트 파일: React import 제거 (new JSX transform 사용 중)
- excelUtils-backup.ts: 백업 파일이므로 ExcelJS import 제거 또는 파일 삭제
- securityMigration.ts: 미사용 파라미터 제거 또는 `_masterPassword`로 prefix 추가

### 2. TS2339: Property Error (1개) ⭐ 우선순위: 높음

| 파일 | 라인 | 문제 |
|------|------|------|
| src/contexts/__tests__/AppContext.impl.test.tsx | 63 | Property 'total' does not exist on type 'void' |

**해결 방법**:
- getStatsData() 함수의 반환 타입 명시 필요

### 3. TS2307: Module Not Found (1개) ⭐ 우선순위: 높음

| 파일 | 라인 | 문제 |
|------|------|------|
| src/utils/__tests__/imageStorage.test.ts | 2 | Cannot find module '../secureStorage' |

**해결 방법**:
- import 경로 수정: `'../secureStorage'` → `'../../services/secureStorage'`

### 4. TS2352/TS2540/TS2684: Test Mock Type Errors (8개) ⭐ 우선순위: 중간

모두 `src/services/__tests__/browserFs.test.ts` 파일:
- 라인 30, 34, 40, 46, 47, 54, 58: Mock 객체 타입 불일치

**문제**:
- IndexedDB, FileSystem API Mock 객체의 타입 정의가 불완전
- Partial 타입 사용으로 인한 'this' context 타입 불일치

**해결 방법**:
- Mock 객체에 `as unknown as [TargetType]` 타입 캐스팅 사용
- 또는 완전한 타입 구현

## 우선순위별 수정 계획

### Priority 1 (즉시 수정 - 5분 소요)
1. ✅ @types/jest 설치 완료
2. 테스트 파일 React import 제거 (4개 파일)
3. imageStorage.test.ts import 경로 수정
4. excelUtils-backup.ts 처리 (백업 파일 삭제 권장)

### Priority 2 (단기 - 30분 소요)
1. AppContext.impl.test.tsx getStatsData 타입 수정
2. securityMigration.ts 미사용 파라미터 처리

### Priority 3 (중기 - 1시간 소요)
1. browserFs.test.ts Mock 타입 오류 수정 (8개)

## 파일별 작업 리스트

### src/contexts/__tests__/AppContext.impl.test.tsx
- [ ] React import 제거 (line 2)
- [ ] getStatsData 반환 타입 수정 (line 63)

### src/hooks/__tests__/ (3개 파일)
- [ ] useFilters.test.tsx: React import 제거
- [ ] useModalState.test.tsx: React import 제거
- [ ] useSelection.test.tsx: React import 제거

### src/services/__tests__/browserFs.test.ts
- [ ] IndexedDB Mock 타입 수정 (8개 위치)

### src/utils/
- [ ] excelUtils-backup.ts: 파일 삭제 또는 import 제거
- [ ] securityMigration.ts: masterPassword 파라미터 처리
- [ ] __tests__/imageStorage.test.ts: import 경로 수정

## 예상 작업 시간

- **Priority 1**: 5분
- **Priority 2**: 30분
- **Priority 3**: 1시간
- **총 예상 시간**: 1시간 35분

## 다음 단계

1. Priority 1 작업 완료 후 빌드 검증
2. Priority 2 작업 진행
3. Priority 3 작업 진행
4. 전체 테스트 실행 및 검증
5. IMPROVEMENT_CHECKLIST.md Phase 2 체크박스 업데이트
