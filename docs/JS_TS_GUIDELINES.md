# JavaScript/TypeScript 혼재 환경 가이드라인

## 🎯 기본 원칙

### 1. `allowJs` 유지 + 점진적 마이그레이션
- **현재 상태**: JavaScript와 TypeScript 파일이 공존
- **목표**: 점진적으로 TypeScript로 마이그레이션하면서 기존 JavaScript 코드의 안정성 유지
- **전략**: 새로운 파일은 TypeScript로, 기존 파일은 필요에 따라 순차적으로 변환

### 2. `@ts-check` 활용 원칙

#### JavaScript 파일에서 TypeScript 검사 활성화
```javascript
// @ts-check
/**
 * @typedef {import('../types/domain').Client} Client
 * @typedef {import('../types/domain').Invoice} Invoice
 */

/**
 * 클라이언트 목록을 필터링합니다
 * @param {Client[]} clients - 클라이언트 배열
 * @param {string} searchTerm - 검색어
 * @returns {Client[]} 필터링된 클라이언트 배열
 */
function filterClients(clients, searchTerm) {
  return clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
```

#### 적용 대상
- ✅ **복잡한 비즈니스 로직을 포함한 JavaScript 파일**
- ✅ **다른 파일에서 많이 import되는 유틸리티 함수**
- ✅ **API 호출이나 데이터 변환 로직**
- ❌ 간단한 상수나 설정 파일
- ❌ 임시적인 스크립트나 빌드 도구

## 📋 ESLint 규칙 전략

### JavaScript 파일 (관대한 규칙)
```javascript
// .eslintrc.js overrides for *.js, *.jsx
{
  "rules": {
    "no-unused-vars": "warn",              // 경고로만 표시
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

### TypeScript 파일 (엄격한 규칙)
```javascript
// .eslintrc.js overrides for *.ts, *.tsx
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",     // 에러로 처리
    "no-unused-vars": "off",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error"
  }
}
```

## 🔧 파일별 접근 전략

### 1. 새로운 파일 생성 시
```
새 컴포넌트/페이지 → TypeScript (.tsx)
새 유틸리티 → TypeScript (.ts)
새 타입 정의 → TypeScript (.ts)
빌드/설정 스크립트 → JavaScript (.js)
```

### 2. 기존 JavaScript 파일 개선 시

#### 단계 1: JSDoc 추가
```javascript
/**
 * @typedef {Object} ClientData
 * @property {string} name - 클라이언트 이름
 * @property {string} email - 이메일 주소
 */
```

#### 단계 2: `@ts-check` 활성화
```javascript
// @ts-check
// 기존 코드에서 타입 에러 확인 및 수정
```

#### 단계 3: TypeScript 변환 (선택적)
```typescript
// .js → .ts/.tsx 확장자 변경
// JSDoc → TypeScript 타입으로 변환
// interface/type 정의 추가
```

## 🎯 마이그레이션 우선순위

### High Priority (즉시)
1. **타입 정의 파일** (`src/types/`)
2. **유틸리티 함수** (`src/utils/`)
3. **서비스 레이어** (`src/services/`)

### Medium Priority (1-2개월)
4. **새로운 컴포넌트**
5. **복잡한 비즈니스 로직 컴포넌트**

### Low Priority (장기)
6. **안정적인 기존 컴포넌트**
7. **설정 및 빌드 스크립트**

## 🛠️ 실제 적용 사례

### Case 1: AppContext 모듈
**문제**: TypeScript/JavaScript 혼재로 인한 import 에러
**해결**: 
- `AppContext.impl.tsx` (TypeScript 구현체)
- `AppContext.js` (JavaScript re-export)
- `AppContext.d.ts` (TypeScript 선언)

### Case 2: 컴포넌트 파일
**기존**: `Dashboard.js` (JavaScript)
**개선**: `Dashboard.tsx` (TypeScript)
**이점**: Props 타입 안전성, 자동완성 개선

## 📊 품질 측정 기준

### 코드 품질 KPI
- **TypeScript 비율**: `src/` 내 `.ts/.tsx` 파일 비율
- **타입 커버리지**: `@ts-check` 적용된 `.js` 파일 비율
- **ESLint 경고/에러**: 파일 유형별 lint 이슈 수
- **빌드 에러**: TypeScript 컴파일 에러 수

### 목표 지표 (3개월)
- TypeScript 파일 비율: 60% 이상
- `@ts-check` 적용: 모든 핵심 JavaScript 파일
- ESLint 에러: 0개 유지
- 빌드 경고: 최소화

## 🔍 모니터링 및 유지보수

### 주간 점검 항목
- [ ] 새로운 JavaScript 파일에 `@ts-check` 적용
- [ ] TypeScript 에러 0개 유지
- [ ] ESLint 규칙 위반 사항 검토
- [ ] 마이그레이션 우선순위 파일 진행상황 점검

### 도구 활용
```bash
# TypeScript 에러 확인
npx tsc --noEmit

# ESLint 전체 검사
npx eslint src/ --ext .js,.jsx,.ts,.tsx

# 파일 유형별 통계
find src -name "*.js" | wc -l    # JavaScript 파일 수
find src -name "*.ts*" | wc -l   # TypeScript 파일 수
```

## ⚠️ 주의사항

### 1. 순환 의존성 방지
- TypeScript와 JavaScript 파일 간의 circular import 주의
- 모듈 구조 설계 시 의존성 방향 명확화

### 2. 타입 호환성
- JavaScript에서 TypeScript 모듈 import 시 타입 정보 손실 가능
- re-export 패턴이나 `.d.ts` 파일로 해결

### 3. 빌드 성능
- `allowJs`로 인한 컴파일 시간 증가 가능
- `incremental` 옵션 활용으로 성능 최적화

---

*최종 업데이트: 2025-10-01*  
*다음 리뷰: 2025-11-01*