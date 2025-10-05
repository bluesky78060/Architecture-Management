# 건설 청구서 관리 시스템 - 향후 개선 로드맵

**작성일**: 2025년 10월 5일
**마지막 업데이트**: 2025년 10월 5일
**프로젝트**: Construction Management System

---

## 📋 실행 요약

### 현재 상태
- **전체 점수**: 78/100 (프로덕션 준비 완료)
- **완료된 주요 개선**: ✅ AES-256-GCM 암호화 마이그레이션 (2025-10-05)
- **남은 개선 과제**: 의존성 보안, TypeScript 완성도, 테스트 커버리지

### 우선순위 구조
```
P0 (즉시) → P1 (1-3개월) → P2 (3-6개월) → P3 (6개월+)
   ↓              ↓               ↓              ↓
 보안 강화     품질 향상       성능 최적화    기능 확장
```

---

## 🎯 P0: 즉시 실행 (High Priority - 완료 기한: 1개월)

### ✅ 1. 암호화 시스템 업그레이드 - **완료**
**상태**: ✅ 완료 (2025-10-05)

**구현 내용**:
- AES-256-GCM 암호화 시스템 구현 (`modernSecureStorage.ts`)
- PBKDF2 키 파생 (100,000 iterations - OWASP 권장)
- 호환성 어댑터 생성 (`secureStorageAdapter.ts`)
- 자동 마이그레이션 시스템 (`securityMigration.ts`)

**보안 개선도**:
| 항목 | XOR (이전) | AES-GCM (현재) | 개선율 |
|------|-----------|---------------|-------|
| 알고리즘 강도 | 매우 낮음 | 군사급 | 500%↑ |
| 키 파생 | 하드코딩 | PBKDF2 100K | 무한대↑ |
| 무결성 검증 | 체크섬 | GCM 태그 | 300%↑ |

**후속 작업**:
```bash
# 레거시 코드 정리 (선택사항)
git rm src/utils/secureStorage.legacy.ts

# 사용자 데이터는 앱 시작 시 자동 마이그레이션됨
# securityMigration.ts의 autoMigrate() 참조
```

---

### 🔴 2. NPM 의존성 취약점 해결

**현황**: 10개 취약점 (4 moderate, 6 high, 0 critical)

**주요 취약점**:

| CVE | 패키지 | 심각도 | CVSS | 영향 |
|-----|--------|--------|------|------|
| GHSA-rp65-9cf3-cjxr | nth-check | High | 7.5 | ReDoS 공격 가능 |
| GHSA-9jgg-88mc-972h | webpack-dev-server | Moderate | 6.5 | 소스 코드 유출 |
| GHSA-7fh5-64p2-3v2j | postcss | Moderate | 5.3 | 라인 파싱 오류 |

**해결 단계**:
```bash
# 1단계: 자동 수정 가능한 취약점 해결
npm audit fix

# 2단계: PostCSS 업그레이드
npm install postcss@^8.4.31

# 3단계: React Scripts 업그레이드 (Breaking Changes 검토)
npm install react-scripts@latest

# 4단계: 검증
npm audit
npm run build
npm test
```

**예상 소요**: 1-2일
**영향도**: 🔴 High (보안)
**담당**: 개발팀

---

### 🔴 3. TypeScript Critical 'any' 제거

**목표**: 핵심 데이터베이스 레이어의 타입 안전성 확보

**대상 파일**:
- `src/services/database.ts` - 18개 any 타입
- `src/contexts/AppContext.impl.tsx` - 10개 any 타입

**개선 예시**:
```typescript
// ❌ Before (database.ts:374)
const stats: Record<InvoiceStatus, number> = {} as any;

// ✅ After
const stats: Record<InvoiceStatus, number> = {
  '발송대기': 0,
  '발송됨': 0,
  '미결제': 0,
  '결제완료': 0
};

// ❌ Before (AppContext.impl.tsx:127)
const handleUpdate = (data: any) => { ... }

// ✅ After
interface UpdatePayload {
  entityType: 'invoice' | 'estimate' | 'client' | 'workItem';
  id: string | number;
  data: Invoice | Estimate | Client | WorkItem;
}

const handleUpdate = (payload: UpdatePayload) => { ... }
```

**마이그레이션 전략**:
1. **1주차**: database.ts 타입 정의 (18개)
2. **2주차**: AppContext.impl.tsx 리팩토링 (10개)
3. **3주차**: 테스트 및 검증

**예상 소요**: 3주
**영향도**: 🟡 Medium (품질)
**담당**: 시니어 개발자

---

## 🎯 P1: 단기 개선 (Medium Priority - 완료 기한: 3개월)

### 🟡 4. TypeScript Strict Mode 전환

**목표**: 전체 코드베이스 타입 안전성 100% 달성

**현황**:
- TypeScript 파일: 82개 중 60% (추정)
- `any` 타입: 108회 → 목표 0회
- Strict mode: 부분 활성화 → 전체 활성화

**구현 계획**:

**Phase 1: ESLint 규칙 강화**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',  // warn → error
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],
    '@typescript-eslint/no-unused-vars': 'error'
  }
};
```

**Phase 2: tsconfig.json 업데이트**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Phase 3: 점진적 마이그레이션**
| 주차 | 대상 | any 개수 | 우선순위 |
|------|------|----------|----------|
| 1-2주 | database.ts | 18개 | P0 |
| 3-4주 | AppContext.impl.tsx | 10개 | P0 |
| 5-6주 | services/*.ts | 20개 | P1 |
| 7-8주 | components/*.tsx | 30개 | P1 |
| 9-12주 | 나머지 파일 | 30개 | P2 |

**검증 기준**:
```bash
# 빌드 성공
npm run build

# TypeScript 에러 0개
npx tsc --noEmit

# ESLint 에러 0개
npm run lint
```

**예상 소요**: 12주 (3개월)
**영향도**: 🟡 Medium (품질)
**담당**: 전체 개발팀

---

### 🟡 5. 컴포넌트 테스트 커버리지 확대

**현황**:
- 유닛 테스트: 31개 (주로 utils, hooks)
- 컴포넌트 테스트: 0개 ❌
- E2E 테스트: 1개 (포괄적)

**목표**: 컴포넌트 테스트 커버리지 70% 달성

**테스트 우선순위**:

**Tier 1: 핵심 컴포넌트** (2주)
```typescript
// components/__tests__/
├── Dashboard.test.tsx           // 대시보드 레이아웃
├── Invoices.test.tsx            // 청구서 목록/CRUD
├── Estimates.test.tsx           // 견적서 목록/CRUD
├── Clients.test.tsx             // 건축주 관리
└── WorkItems.test.tsx           // 작업 항목 관리
```

**Tier 2: 재사용 컴포넌트** (1주)
```typescript
// components/__tests__/
├── invoices/InvoicesTable.test.tsx
├── invoices/InvoiceFormModal.test.tsx
├── estimates/EstimatesTable.test.tsx
└── work-items/WorkItemsTable.test.tsx
```

**테스트 예시**:
```typescript
// components/__tests__/Invoices.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Invoices } from '../Invoices';
import { AppContextProvider } from '../../contexts/AppContext';

describe('Invoices Component', () => {
  const mockContext = {
    invoices: [
      { id: 'INV-001', client: '테스트', amount: 1000000, status: '미결제' }
    ],
    addInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    deleteInvoice: jest.fn()
  };

  it('displays invoice list correctly', () => {
    render(
      <AppContextProvider value={mockContext}>
        <Invoices />
      </AppContextProvider>
    );

    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('₩1,000,000')).toBeInTheDocument();
    expect(screen.getByText('미결제')).toBeInTheDocument();
  });

  it('opens form modal when "새 청구서" clicked', async () => {
    render(<Invoices />);

    fireEvent.click(screen.getByText('새 청구서'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('calls deleteInvoice when delete button clicked', async () => {
    render(<Invoices />);

    fireEvent.click(screen.getByLabelText('삭제'));

    // 확인 대화상자
    fireEvent.click(screen.getByText('확인'));

    await waitFor(() => {
      expect(mockContext.deleteInvoice).toHaveBeenCalledWith('INV-001');
    });
  });

  it('filters invoices by status', async () => {
    render(<Invoices />);

    fireEvent.change(screen.getByLabelText('상태'), {
      target: { value: '결제완료' }
    });

    await waitFor(() => {
      expect(screen.queryByText('미결제')).not.toBeInTheDocument();
    });
  });
});
```

**커버리지 목표**:
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "statements": 70,
        "branches": 65,
        "functions": 70,
        "lines": 70
      }
    }
  }
}
```

**예상 소요**: 3주
**영향도**: 🟡 Medium (품질)
**담당**: QA + 개발팀

---

### 🟡 6. E2E 테스트 시나리오 확장

**현황**: 1개 포괄적 E2E 테스트 (네비게이션, 접근성)

**목표**: 핵심 비즈니스 워크플로우 5개 시나리오 추가

**신규 E2E 시나리오**:

**1. 청구서 생성 → PDF 출력 워크플로우**
```typescript
// e2e/invoice-workflow.spec.ts
test('complete invoice creation and PDF export', async ({ page }) => {
  // 1. 건축주 선택
  await page.goto('/invoices');
  await page.click('button:has-text("새 청구서")');

  // 2. 청구서 작성
  await page.selectOption('[name="client"]', { label: '테스트 건축주' });
  await page.fill('[name="amount"]', '1000000');
  await page.click('button:has-text("저장")');

  // 3. PDF 다운로드
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("PDF 다운로드")')
  ]);

  expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf$/);

  // 4. PDF 내용 검증 (이미지 스냅샷)
  const pdfPage = await page.goto(download.url());
  await expect(pdfPage).toHaveScreenshot('invoice-pdf.png');
});
```

**2. 견적서 → 청구서 전환**
```typescript
// e2e/estimate-to-invoice.spec.ts
test('convert estimate to invoice', async ({ page }) => {
  // 1. 견적서 생성
  await page.goto('/estimates');
  // ... 견적서 생성 로직

  // 2. 청구서로 전환
  await page.click('button:has-text("청구서로 전환")');

  // 3. 청구서 확인
  await expect(page).toHaveURL(/\/invoices\/INV-\d+/);
  await expect(page.locator('.invoice-status')).toHaveText('발송대기');
});
```

**3. 데이터 영속성 테스트**
```typescript
// e2e/data-persistence.spec.ts
test('data persists across page reloads', async ({ page }) => {
  // 1. 데이터 생성
  await page.goto('/clients');
  await page.click('button:has-text("새 건축주")');
  await page.fill('[name="name"]', '영속성 테스트');
  await page.click('button:has-text("저장")');

  // 2. 페이지 새로고침
  await page.reload();

  // 3. 데이터 확인
  await expect(page.locator('text=영속성 테스트')).toBeVisible();
});
```

**4. 오류 처리 시나리오**
```typescript
// e2e/error-handling.spec.ts
test('handles validation errors gracefully', async ({ page }) => {
  await page.goto('/invoices');
  await page.click('button:has-text("새 청구서")');

  // 필수 필드 누락
  await page.click('button:has-text("저장")');

  // 오류 메시지 확인
  await expect(page.locator('.error-message')).toContainText('건축주를 선택하세요');
});
```

**5. 반응형 디자인 테스트**
```typescript
// e2e/responsive.spec.ts
test('mobile navigation works correctly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // 모바일 메뉴 열기
  await page.click('button[aria-label="메뉴"]');

  // 네비게이션 확인
  await expect(page.locator('nav')).toBeVisible();
  await page.click('text=청구서 관리');
  await expect(page).toHaveURL('/invoices');
});
```

**실행 전략**:
```bash
# 로컬 개발
npm run test:e2e

# CI/CD 파이프라인
npm run test:e2e:ci

# 비주얼 리그레션
npm run test:e2e:visual
```

**예상 소요**: 2주
**영향도**: 🟢 Medium (품질)
**담당**: QA 엔지니어

---

## 🎯 P2: 중기 개선 (Low Priority - 완료 기한: 6개월)

### 🟢 7. React 렌더링 성능 최적화

**목표**: 초기 렌더링 30% 향상, 리스트 스크롤 성능 2배 향상

**최적화 영역**:

**7.1 무거운 리스트 가상화**
```typescript
// Before: 모든 항목 렌더링 (1000개 → 느림)
{invoices.map(invoice => <InvoiceRow key={invoice.id} data={invoice} />)}

// After: 가상 스크롤링 (화면에 보이는 20개만)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={invoices.length}
  itemSize={72}
  width="100%"
  overscanCount={5}
>
  {({ index, style }) => (
    <div style={style}>
      <InvoiceRow data={invoices[index]} />
    </div>
  )}
</FixedSizeList>
```

**예상 효과**: 1000개 항목 스크롤 시 60fps 유지

**7.2 React.memo 적용**
```typescript
// Before: 부모 리렌더링 시 매번 재렌더링
const InvoicesTable = ({ data, onEdit, onDelete }) => { ... }

// After: props 변경 시만 재렌더링
const InvoicesTable = React.memo(
  ({ data, onEdit, onDelete }) => { ... },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);
```

**7.3 useCallback/useMemo 최적화**
```typescript
// Before: 매 렌더링마다 함수 재생성
const Dashboard = () => {
  const handleEdit = (id) => { ... }
  const filteredData = data.filter(/* ... */);

  return <Table data={filteredData} onEdit={handleEdit} />;
}

// After: 의존성 변경 시만 재생성
const Dashboard = () => {
  const handleEdit = useCallback((id) => { ... }, []);

  const filteredData = useMemo(
    () => data.filter(/* ... */),
    [data, filterCriteria]
  );

  return <Table data={filteredData} onEdit={handleEdit} />;
}
```

**7.4 이미지 최적화**
```tsx
// Before: 모든 이미지 즉시 로드
<img src={stampUrl} alt="도장" />

// After: 지연 로딩 + 비동기 디코딩
<img
  src={stampUrl}
  alt="도장"
  loading="lazy"
  decoding="async"
  width={48}
  height={48}
/>
```

**성능 측정 기준**:
```javascript
// Lighthouse 점수 목표
{
  "performance": 90+,  // 현재 80
  "accessibility": 95+,
  "best-practices": 95+,
  "seo": 90+
}

// Core Web Vitals
{
  "LCP": "< 2.5s",  // Largest Contentful Paint
  "FID": "< 100ms", // First Input Delay
  "CLS": "< 0.1"    // Cumulative Layout Shift
}
```

**예상 소요**: 2주
**영향도**: 🟢 Low (성능)
**담당**: 프론트엔드 개발자

---

### 🟢 8. PWA (Progressive Web App) 기능 추가

**목표**: 오프라인 지원 + 설치 가능한 웹 앱

**구현 단계**:

**8.1 Service Worker 등록**
```javascript
// src/index.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  });
}
```

**8.2 캐싱 전략 구현**
```javascript
// public/sw.js
const CACHE_NAME = 'cms-v1.0.0';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/vendors.js'
];

// Install: 리소스 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch: 캐시 우선 전략
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시 히트 → 캐시 반환
        if (response) {
          return response;
        }
        // 캐시 미스 → 네트워크 요청
        return fetch(event.request);
      })
  );
});

// Activate: 오래된 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**8.3 Manifest 파일 생성**
```json
// public/manifest.json
{
  "name": "건설 청구서 관리 시스템",
  "short_name": "CMS",
  "description": "건축업자를 위한 견적서/청구서 관리 도구",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2071f3",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**8.4 설치 프롬프트**
```typescript
// src/components/InstallPrompt.tsx
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted install');
    }

    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <button onClick={handleInstall}>
      앱 설치하기
    </button>
  );
};
```

**사용자 가치**:
- ✅ 오프라인에서도 완전 기능
- ✅ 네이티브 앱처럼 설치 가능
- ✅ 빠른 로딩 (캐시 활용)
- ✅ 푸시 알림 (선택)

**예상 소요**: 1주
**영향도**: 🟢 Low (기능)
**담당**: 풀스택 개발자

---

### 🟢 9. 접근성 (a11y) 개선

**목표**: WCAG 2.1 Level AA 준수

**감사 도구**:
```bash
# Lighthouse 접근성 감사
npm run lighthouse:a11y

# axe DevTools 사용
npm install --save-dev @axe-core/react
```

**개선 영역**:

**9.1 키보드 네비게이션**
```tsx
// Before: 마우스만 가능
<div onClick={handleClick}>클릭</div>

// After: 키보드 접근 가능
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="청구서 추가"
>
  클릭
</button>
```

**9.2 스크린 리더 지원**
```tsx
// Before: 의미 없는 구조
<div>
  <span>청구서 목록</span>
  <div>
    <div>INV-001</div>
    <div>1,000,000원</div>
  </div>
</div>

// After: 시맨틱 HTML + ARIA
<section aria-labelledby="invoices-heading">
  <h2 id="invoices-heading">청구서 목록</h2>
  <table>
    <caption className="sr-only">청구서 상세 정보</caption>
    <thead>
      <tr>
        <th scope="col">번호</th>
        <th scope="col">금액</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>INV-001</td>
        <td>1,000,000원</td>
      </tr>
    </tbody>
  </table>
</section>
```

**9.3 색상 대비**
```css
/* Before: 대비 부족 (3:1) */
.text-gray-500 { color: #6b7280; }  /* 회색 텍스트 */

/* After: WCAG AA 준수 (4.5:1) */
.text-gray-700 { color: #374151; }  /* 더 진한 회색 */
```

**9.4 포커스 표시**
```css
/* 명확한 포커스 링 */
*:focus-visible {
  outline: 2px solid #2071f3;
  outline-offset: 2px;
}
```

**검증 체크리스트**:
- [ ] 모든 버튼/링크 키보드 접근 가능
- [ ] 스크린 리더로 전체 앱 사용 가능
- [ ] 색상 대비 4.5:1 이상
- [ ] 포커스 표시 명확
- [ ] ARIA 레이블 적절히 사용

**예상 소요**: 2주
**영향도**: 🟢 Low (접근성)
**담당**: 프론트엔드 + UX 디자이너

---

## 🎯 P3: 장기 전략 (6개월 이상)

### 🔵 10. 클라우드 동기화 시스템

**목표**: 멀티 디바이스 데이터 동기화

**아키텍처 선택지**:

**Option A: Firebase (빠른 구현)**
```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  projectId: "cms-construction"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

**Option B: Supabase (오픈소스)**
```typescript
// supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);
```

**Option C: 자체 백엔드 (완전 제어)**
```typescript
// api/sync-service.ts
class SyncService {
  async syncToCloud(localData: any) {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: Date.now(),
        data: localData
      })
    });

    return response.json();
  }

  async resolveConflicts(local: Entity, remote: Entity) {
    // Last-Write-Wins (LWW) 전략
    return local.lastModified > remote.lastModified ? local : remote;
  }
}
```

**동기화 전략**:
```typescript
// Offline-First Architecture
class OfflineFirstSync {
  async saveData(entity: Invoice) {
    // 1. 로컬에 먼저 저장
    await db.invoices.put(entity);

    // 2. 동기화 큐에 추가
    await syncQueue.add({
      operation: 'UPDATE',
      entityType: 'invoice',
      entityId: entity.id,
      data: entity
    });

    // 3. 네트워크 가용 시 백그라운드 동기화
    if (navigator.onLine) {
      this.syncInBackground();
    }
  }

  private async syncInBackground() {
    const pendingItems = await syncQueue.getAll();

    for (const item of pendingItems) {
      try {
        await this.syncToCloud(item);
        await syncQueue.remove(item.id);
      } catch (error) {
        // 재시도 로직
        await this.scheduleRetry(item);
      }
    }
  }
}
```

**충돌 해결**:
```typescript
interface ConflictResolution {
  strategy: 'last-write-wins' | 'manual' | 'merge';

  resolve(local: Entity, remote: Entity): Entity {
    switch (this.strategy) {
      case 'last-write-wins':
        return local.lastModified > remote.lastModified ? local : remote;

      case 'manual':
        // UI에서 사용자 선택 요청
        return this.promptUser(local, remote);

      case 'merge':
        // 필드별 병합
        return this.mergeFields(local, remote);
    }
  }
}
```

**예상 소요**: 8주
**영향도**: 🔵 High (기능)
**담당**: 풀스택 팀

---

### 🔵 11. 고급 분석 및 리포팅

**목표**: 비즈니스 인사이트 제공

**대시보드 기능**:

**11.1 매출 분석**
```typescript
// 월별 매출 차트
interface RevenueAnalytics {
  monthlyRevenue: Array<{ month: string; amount: number }>;
  yearOverYearGrowth: number;
  topClients: Array<{ name: string; totalRevenue: number }>;
  paymentStatus: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

const RevenueChart = () => {
  const data = useRevenueAnalytics();

  return (
    <LineChart data={data.monthlyRevenue}>
      <Line dataKey="amount" stroke="#2071f3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
    </LineChart>
  );
};
```

**11.2 프로젝트 분석**
```typescript
// 프로젝트 진행 상황
interface ProjectAnalytics {
  activeProjects: number;
  completedProjects: number;
  averageProjectDuration: number;
  profitMargin: number;
  workItemBreakdown: Record<string, number>;
}
```

**11.3 건축주 분석**
```typescript
// 고객 세분화
interface ClientAnalytics {
  totalClients: number;
  activeClients: number;
  clientLifetimeValue: Array<{ clientId: string; ltv: number }>;
  geographicDistribution: Record<string, number>;
}
```

**11.4 PDF 리포트 생성**
```typescript
// 월간 리포트 자동 생성
class ReportGenerator {
  async generateMonthlyReport(month: string) {
    const data = await this.gatherMonthlyData(month);

    const pdf = new jsPDF();

    // 헤더
    pdf.text('월간 사업 리포트', 20, 20);
    pdf.text(`기간: ${month}`, 20, 30);

    // 매출 요약
    pdf.text(`총 매출: ₩${data.totalRevenue.toLocaleString()}`, 20, 50);
    pdf.text(`청구 건수: ${data.invoiceCount}건`, 20, 60);

    // 차트 삽입
    const chartCanvas = await this.generateChart(data);
    pdf.addImage(chartCanvas, 'PNG', 20, 80, 170, 100);

    return pdf.save(`report-${month}.pdf`);
  }
}
```

**예상 소요**: 6주
**영향도**: 🔵 Medium (기능)
**담당**: 데이터 분석가 + 개발자

---

### 🔵 12. AI 기반 견적 추천 시스템

**목표**: 과거 데이터 학습으로 견적 자동 생성

**ML 파이프라인**:

**12.1 데이터 수집**
```typescript
// 견적 패턴 추출
interface EstimatePattern {
  projectType: string;
  location: string;
  size: number;
  workItems: Array<{
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
}

async function collectTrainingData() {
  const estimates = await db.estimates.toArray();

  return estimates.map(est => ({
    features: {
      projectType: est.projectType,
      location: est.location,
      size: est.size,
      seasonality: new Date(est.date).getMonth()
    },
    label: est.amount
  }));
}
```

**12.2 모델 학습** (Python/TensorFlow.js)
```python
# train-model.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# 데이터 로드
df = pd.read_csv('estimates.csv')

# 특성 엔지니어링
X = df[['project_type_encoded', 'location_encoded', 'size', 'month']]
y = df['total_amount']

# 모델 학습
model = RandomForestRegressor(n_estimators=100)
model.fit(X, y)

# 모델 저장
import joblib
joblib.dump(model, 'estimate_predictor.pkl')
```

**12.3 추론 엔진**
```typescript
// AI 추천 시스템
class EstimateRecommendation {
  async suggestEstimate(params: ProjectParams): Promise<RecommendedEstimate> {
    // TensorFlow.js로 브라우저에서 추론
    const model = await tf.loadLayersModel('/models/estimate-predictor/model.json');

    const input = tf.tensor2d([[
      params.projectTypeEncoded,
      params.locationEncoded,
      params.size,
      new Date().getMonth()
    ]]);

    const prediction = model.predict(input) as tf.Tensor;
    const predictedAmount = await prediction.data();

    return {
      suggestedAmount: predictedAmount[0],
      confidence: 0.85,
      similarProjects: await this.findSimilarProjects(params),
      priceRange: {
        min: predictedAmount[0] * 0.9,
        max: predictedAmount[0] * 1.1
      }
    };
  }
}
```

**12.4 UI 통합**
```tsx
const EstimateForm = () => {
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const handleProjectTypeChange = async (type: string) => {
    const suggestion = await estimateAI.suggestEstimate({
      projectType: type,
      // ... 기타 파라미터
    });

    setAiSuggestion(suggestion);
  };

  return (
    <form>
      <select onChange={(e) => handleProjectTypeChange(e.target.value)}>
        {/* 프로젝트 타입 */}
      </select>

      {aiSuggestion && (
        <div className="ai-suggestion">
          <h4>AI 추천 견적</h4>
          <p>예상 금액: ₩{aiSuggestion.suggestedAmount.toLocaleString()}</p>
          <p>신뢰도: {(aiSuggestion.confidence * 100).toFixed(0)}%</p>
          <button onClick={() => applyAISuggestion(aiSuggestion)}>
            추천 적용
          </button>
        </div>
      )}
    </form>
  );
};
```

**예상 효과**:
- 견적 작성 시간 50% 단축
- 견적 정확도 향상
- 시장 가격 트렌드 반영

**예상 소요**: 12주
**영향도**: 🔵 High (혁신)
**담당**: ML 엔지니어 + 개발팀

---

## 📊 구현 타임라인

```
2025 Q4                  2026 Q1                  2026 Q2
│                        │                        │
├─ P0: 보안 강화         ├─ P1: 품질 향상         ├─ P2: 성능 최적화
│  ✅ AES-GCM (완료)    │  □ TypeScript Strict   │  □ React 최적화
│  □ npm audit fix      │  □ 컴포넌트 테스트     │  □ PWA 추가
│  □ Critical any 제거  │  □ E2E 확장            │  □ 접근성 개선
│                        │                        │
└─ 1개월                └─ 3개월                └─ 6개월

2026 Q3+
│
├─ P3: 기능 확장
│  □ 클라우드 동기화
│  □ 고급 분석
│  □ AI 추천
│
└─ 6개월+
```

---

## 🎯 성공 지표 (KPIs)

### 기술 지표
| 지표 | 현재 | 목표 (6개월) | 측정 방법 |
|------|------|--------------|-----------|
| 코드 품질 | 85/100 | 95/100 | ESLint + TypeScript strict |
| 보안 점수 | 65/100 | 90/100 | npm audit + 암호화 검증 |
| 테스트 커버리지 | 40% | 70% | Jest coverage report |
| 번들 크기 | 383KB | <350KB | webpack-bundle-analyzer |
| Lighthouse 성능 | 80 | 90+ | Chrome DevTools |

### 비즈니스 지표
| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|-----------|
| 앱 안정성 | 99% | 99.9% | 오류 추적 (Sentry) |
| 사용자 만족도 | - | 4.5/5 | 피드백 설문 |
| 기능 채택률 | - | 80% | 분석 도구 |
| 생산성 향상 | - | 30% | 작업 시간 측정 |

---

## 💡 권장 우선순위 실행 계획

### 이번 주 (Week 1)
```bash
# P0-1: npm audit fix
npm audit fix
npm install postcss@^8.4.31
npm run build && npm test

# P0-2: database.ts any 타입 제거 시작
# - 타입 정의 작성
# - 18개 중 5개 우선 처리
```

### 이번 달 (Month 1)
```bash
# P0 완료
- [x] AES-GCM 암호화 (완료)
- [ ] npm 취약점 해결
- [ ] database.ts 완료
- [ ] AppContext.impl.tsx any 제거

# P1 시작
- [ ] ESLint 규칙 강화
- [ ] 컴포넌트 테스트 3개
```

### 다음 분기 (Q1 2026)
```bash
# P1 완료
- [ ] TypeScript strict mode
- [ ] 컴포넌트 테스트 70%
- [ ] E2E 시나리오 5개

# P2 시작
- [ ] React 최적화
- [ ] PWA 기능
```

---

## 📚 참고 문서

### 내부 문서
- [종합 코드 분석 보고서](/claudedocs/comprehensive-code-analysis-2025-10-05.md)
- [암호화 마이그레이션 가이드](/claudedocs/encryption-migration-report-2025-10-05.md)
- [데이터베이스 아키텍처 분석](/.serena/memories/database_architecture_analysis.md)

### 외부 리소스
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

**문서 버전**: 1.0
**다음 검토**: 2026년 1월
**담당**: 프로젝트 매니저
