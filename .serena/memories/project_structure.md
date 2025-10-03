# 프로젝트 구조 상세

## 루트 디렉토리 구조
```
ConstructionManagement-Installer/
├── src/                    # 소스 코드
├── public/                 # 정적 파일 (Electron 진입점 포함)
├── build/                  # 빌드 출력물
├── dist/                   # Electron 패키징 출력물
├── tests/                  # 테스트 파일
│   ├── e2e/               # Playwright E2E 테스트
│   └── screenshots/       # 테스트 스크린샷
├── docs/                  # 문서
├── scripts/               # 빌드/배포 스크립트
├── api/                   # API 관련 파일
├── node_modules/          # 의존성
└── 설정 파일들
```

## src/ 디렉토리 구조
```
src/
├── components/            # 재사용 가능한 UI 컴포넌트
│   ├── Layout.tsx        # 메인 레이아웃
│   ├── Navbar.js         # 네비게이션
│   ├── Login.js          # 로그인 컴포넌트
│   ├── Dashboard.js      # 대시보드
│   ├── Invoices.js       # 청구서 관리
│   ├── Clients.js        # 건축주 관리
│   ├── WorkItems.js      # 작업 항목 관리
│   ├── Estimates.js      # 견적서 관리
│   └── ...
├── pages/                # 페이지 레벨 컴포넌트 (TypeScript)
│   ├── Dashboard.tsx
│   ├── ClientList.tsx
│   ├── InvoiceList.tsx
│   └── ...
├── contexts/             # React Context
│   ├── UserContext.js    # 사용자 인증 상태
│   └── AppContext.js     # 앱 전역 상태
├── services/             # 비즈니스 로직
│   ├── api.ts           # API 서비스
│   ├── storage.js       # 로컬 스토리지
│   ├── xlsxMirror.js    # Excel 처리
│   └── browserFs.js     # 파일 시스템
├── utils/                # 유틸리티 함수
│   ├── excelUtils.js    # Excel 관련 유틸
│   ├── phoneFormatter.js # 전화번호 포맷팅
│   ├── imageStorage.js  # 이미지 처리
│   └── numberToKorean.js # 숫자 한글 변환
└── types/                # TypeScript 타입 정의
    └── index.ts
```

## 주요 설정 파일
- **package.json**: 의존성 및 스크립트 정의
- **tsconfig.json**: TypeScript 컴파일러 설정
- **tailwind.config.js**: Tailwind CSS 설정
- **craco.config.js**: Create React App 확장 설정
- **playwright.config.js**: E2E 테스트 설정
- **postcss.config.js**: PostCSS 설정

## 테스트 구조
```
tests/
├── e2e/                  # E2E 테스트
│   ├── auth.spec.js     # 인증 테스트
│   ├── dashboard.spec.js # 대시보드 테스트
│   ├── clients.spec.js  # 건축주 관리 테스트
│   ├── invoices.spec.js # 청구서 관리 테스트
│   └── ...
└── screenshots/         # 테스트 스크린샷
```

## 빌드 출력물
- **build/**: 웹 애플리케이션 빌드 결과
- **dist/**: Electron 앱 패키징 결과 (.exe, .dmg)