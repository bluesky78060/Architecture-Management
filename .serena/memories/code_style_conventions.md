# 코드 스타일 및 컨벤션

## 언어별 파일 구조
- **TypeScript**: `.tsx`, `.ts` (React 컴포넌트 및 타입)
- **JavaScript**: `.js` (유틸리티, 서비스, 컨텍스트)
- **Mixed**: TypeScript strict mode 비활성화로 점진적 마이그레이션

## 네이밍 컨벤션
- **컴포넌트**: PascalCase (예: `Layout.tsx`, `Dashboard.tsx`)
- **함수/변수**: camelCase (예: `isLoggedIn`, `showUserMenu`)
- **상수**: UPPER_SNAKE_CASE (예: `LOGIN_DISABLED`)
- **파일명**: kebab-case (페이지), PascalCase (컴포넌트)

## 디렉토리 구조
```
src/
├── components/     # 재사용 가능한 UI 컴포넌트
├── pages/         # 페이지 레벨 컴포넌트
├── contexts/      # React Context providers
├── services/      # API 및 비즈니스 로직
├── utils/         # 유틸리티 함수
└── types/         # TypeScript 타입 정의
```

## React 컴포넌트 패턴
- **Functional Components**: 모든 컴포넌트는 함수형으로 작성
- **Hooks**: useState, useEffect, useContext 등 React Hooks 사용
- **Props Interface**: TypeScript 인터페이스로 props 타입 정의
- **Default Export**: 컴포넌트는 default export 사용

## 스타일링 컨벤션
- **Tailwind CSS**: 유틸리티 클래스 기반 스타일링
- **Class 조합**: 조건부 클래스는 템플릿 리터럴 사용
- **반응형**: 모바일 퍼스트 접근법
- **테마**: 커스텀 그라데이션 및 glassmorphism 효과

## Import 순서
1. React 및 React 관련
2. 서드파티 라이브러리
3. 내부 컴포넌트/페이지
4. 유틸리티 및 서비스
5. 타입 정의
6. CSS/스타일

## TypeScript 설정
- **Strict Mode**: 비활성화 (점진적 마이그레이션)
- **JSX**: react-jsx 변환
- **Module**: ESNext
- **Target**: ES2019