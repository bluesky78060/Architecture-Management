# 다크모드 구현 가이드

## 📋 개요

건축 관리 시스템에 다크모드를 추가하면:
- 👀 눈의 피로 감소 (야간 작업 시)
- 🔋 배터리 절약 (OLED 화면)
- 🎨 모던한 사용자 경험
- ♿ 접근성 향상

---

## 🎯 난이도 평가

| 항목 | 난이도 | 예상 시간 |
|------|--------|----------|
| Tailwind 설정 | ⭐ | 1분 |
| 토글 버튼 구현 | ⭐⭐ | 10분 |
| 전체 컴포넌트 적용 | ⭐⭐⭐⭐ | 2~3시간 |
| 테스트 및 검증 | ⭐⭐⭐ | 30분 |
| **총합** | **⭐⭐⭐⭐** | **3~4시간** |

---

## 🔧 구현 단계

### Phase 1: Tailwind 설정 (1분)

**1.1 tailwind.config.js 수정**
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 클래스 기반 다크모드 (사용자 선택)
  // darkMode: 'media', // 시스템 설정 따르기
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // 다크모드 전용 색상 정의 (선택사항)
      colors: {
        dark: {
          bg: '#1a1a1a',
          card: '#2d2d2d',
          border: '#404040',
          text: '#e5e5e5',
        }
      }
    },
  },
  plugins: [],
}
```

**선택 기준**:
- `'class'`: 사용자가 버튼으로 토글 (추천) ✅
- `'media'`: 시스템 설정 자동 감지

---

### Phase 2: 다크모드 Context 구현 (15분)

**2.1 Context 생성**
```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // localStorage에서 저장된 테마 불러오기
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    // HTML root에 클래스 적용
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // localStorage에 저장
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

**2.2 index.tsx에 Provider 추가**
```tsx
// src/index.tsx
import { ThemeProvider } from './contexts/ThemeContext';

root.render(
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <ThemeProvider>  {/* 추가 */}
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </ThemeProvider>
    </UserProvider>
  </QueryClientProvider>
);
```

---

### Phase 3: 다크모드 토글 버튼 (15분)

**3.1 토글 컴포넌트**
```tsx
// src/components/ThemeToggle.tsx
import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
};

export default ThemeToggle;
```

**3.2 Layout에 버튼 추가**
```tsx
// src/components/Layout.tsx
import ThemeToggle from './ThemeToggle';

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
        {/* Header */}
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            {/* ... 기존 내용 ... */}
          </div>
          <ThemeToggle />  {/* 추가 */}
        </div>
        {/* ... */}
      </div>
    </div>
  );
}
```

---

### Phase 4: 컴포넌트별 다크모드 적용 (2~3시간)

#### 4.1 색상 매핑 가이드

| 라이트 모드 | 다크 모드 | 용도 |
|------------|----------|------|
| `bg-white` | `dark:bg-gray-800` | 카드 배경 |
| `bg-gray-50` | `dark:bg-gray-900` | 페이지 배경 |
| `bg-gray-100` | `dark:bg-gray-700` | 입력 필드 배경 |
| `text-gray-900` | `dark:text-white` | 주요 텍스트 |
| `text-gray-600` | `dark:text-gray-300` | 보조 텍스트 |
| `text-gray-500` | `dark:text-gray-400` | 힌트 텍스트 |
| `border-gray-200` | `dark:border-gray-700` | 테두리 |
| `shadow-lg` | `dark:shadow-2xl` | 그림자 |

#### 4.2 적용 예시

**Layout.tsx (이미 일부 작성)**
```tsx
// Before
<div className="min-h-screen bg-gray-50">
  <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">

// After
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
```

**Dashboard.tsx**
```tsx
// Before
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">

// After
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
```

**Clients.tsx**
```tsx
// Before
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">

// After
<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
```

**Input 필드**
```tsx
// Before
<input
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
/>

// After
<input
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
/>
```

**Button**
```tsx
// Before
<button className="bg-blue-600 text-white hover:bg-blue-700">

// After
<button className="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600">
```

---

### Phase 5: 자동화 스크립트 (선택사항)

**5.1 검색-치환 패턴**
```bash
# VS Code에서 정규표현식 검색-치환

# 패턴 1: bg-white
검색: className="([^"]*\s)?bg-white(\s[^"]*)?
치환: className="$1bg-white dark:bg-gray-800$2

# 패턴 2: text-gray-900
검색: className="([^"]*\s)?text-gray-900(\s[^"]*)?
치환: className="$1text-gray-900 dark:text-white$2

# 패턴 3: bg-gray-50
검색: className="([^"]*\s)?bg-gray-50(\s[^"]*)?
치환: className="$1bg-gray-50 dark:bg-gray-900$2
```

**⚠️ 주의**: 자동 치환은 신중하게! 컴포넌트별로 확인 필요

---

### Phase 6: 특수 케이스 처리

#### 6.1 그라데이션
```tsx
// Before
<div className="bg-gradient-to-r from-blue-500 to-purple-600">

// After
<div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
```

#### 6.2 차트/그래프
```tsx
// Chart.js 다크모드 설정
const chartOptions = {
  scales: {
    x: {
      ticks: {
        color: theme === 'dark' ? '#e5e5e5' : '#4b5563'
      },
      grid: {
        color: theme === 'dark' ? '#404040' : '#e5e7eb'
      }
    }
  }
};
```

#### 6.3 인쇄 스타일 (청구서/견적서)
```tsx
// 인쇄 시 다크모드 비활성화
<div className="print:bg-white print:text-black dark:bg-gray-800 dark:text-white">
```

또는

```css
/* src/index.css */
@media print {
  * {
    background-color: white !important;
    color: black !important;
  }
}
```

---

## 📦 적용 대상 컴포넌트 목록

### 우선순위 High (필수)
- [ ] Layout.tsx
- [ ] Dashboard.tsx
- [ ] Login.tsx
- [ ] Settings.tsx

### 우선순위 Medium
- [ ] Clients.tsx
- [ ] WorkItemsPage.tsx
- [ ] EstimatesPage.tsx
- [ ] InvoicesPage.tsx

### 우선순위 Low
- [ ] CompanyInfo.tsx
- [ ] ForgotPassword.tsx
- [ ] PendingApproval.tsx
- [ ] AdminApproval.tsx

---

## 🎨 색상 테마 커스터마이징

### 옵션 1: Tailwind 기본 색상
```tsx
// 그대로 사용
bg-white dark:bg-gray-800
text-gray-900 dark:text-white
```

### 옵션 2: 커스텀 색상
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      dark: {
        100: '#1a1a1a',
        200: '#2d2d2d',
        300: '#404040',
        400: '#595959',
      }
    }
  }
}
```

```tsx
// 사용
bg-white dark:bg-dark-200
```

---

## 🧪 테스트 체크리스트

### 기능 테스트
- [ ] 토글 버튼 동작 확인
- [ ] localStorage 저장/불러오기
- [ ] 새로고침 후에도 유지되는지
- [ ] 모든 페이지에서 정상 작동

### 시각적 테스트
- [ ] 모든 텍스트 가독성 확인
- [ ] 버튼/링크 hover 상태
- [ ] 입력 필드 포커스 상태
- [ ] 모달/팝업 배경
- [ ] 그림자 효과
- [ ] 아이콘 가시성

### 인쇄 테스트
- [ ] 견적서 인쇄 (라이트 모드 강제)
- [ ] 청구서 인쇄 (라이트 모드 강제)

---

## 🚨 주의사항

### 1. 색상 대비 (접근성)
```
WCAG 2.1 기준:
- 일반 텍스트: 최소 4.5:1
- 큰 텍스트: 최소 3:1
```

**도구**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 2. 전환 애니메이션
```css
/* src/index.css */
* {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

### 3. 시스템 설정 감지 (선택)
```tsx
// 초기 테마를 시스템 설정으로
const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved as Theme;

  // 시스템 설정 확인
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};
```

---

## 🎯 빠른 구현 전략

### 전략 1: 점진적 적용 (추천) ⭐
```
Week 1: Layout + Dashboard
Week 2: Clients + WorkItems
Week 3: Estimates + Invoices
Week 4: 나머지 + 테스트
```

### 전략 2: 일괄 적용
```
Day 1: Context + Toggle 구현
Day 2: 전체 컴포넌트 일괄 적용
Day 3: 테스트 및 수정
```

---

## 💡 고급 기능 (선택)

### 자동 다크모드 (시간대 기반)
```tsx
useEffect(() => {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 6) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}, []);
```

### 다크모드 강도 조절
```tsx
// 3단계: light, dim, dark
type Theme = 'light' | 'dim' | 'dark';

<html className={theme === 'dim' ? 'dim' : theme}>
```

```css
/* Dim mode */
.dim {
  --bg-primary: #f5f5f5;
  --text-primary: #333333;
}
```

---

## 📊 예상 작업 시간 상세

| 컴포넌트 | 예상 시간 | 복잡도 |
|----------|----------|--------|
| Layout | 15분 | ⭐⭐ |
| Dashboard | 20분 | ⭐⭐⭐ |
| Clients | 30분 | ⭐⭐⭐⭐ |
| WorkItems | 25분 | ⭐⭐⭐ |
| Estimates | 30분 | ⭐⭐⭐⭐ |
| Invoices | 30분 | ⭐⭐⭐⭐ |
| Settings | 15분 | ⭐⭐ |
| AdminApproval | 20분 | ⭐⭐⭐ |
| Login | 10분 | ⭐⭐ |
| 기타 | 15분 | ⭐⭐ |
| **총합** | **3시간 30분** | - |

---

## 📚 참고 자료

- [Tailwind Dark Mode 공식 문서](https://tailwindcss.com/docs/dark-mode)
- [React Context API](https://react.dev/reference/react/useContext)
- [WCAG 색상 대비 기준](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [prefers-color-scheme MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

---

## ✅ 완료 기준

- [ ] 모든 페이지에서 다크모드 정상 작동
- [ ] 토글 버튼이 모든 페이지에 표시
- [ ] localStorage에 설정 저장/복원
- [ ] 새로고침 후에도 테마 유지
- [ ] 인쇄 시 라이트 모드 강제
- [ ] 모든 텍스트 가독성 확보 (대비 4.5:1 이상)
- [ ] 호버/포커스 상태 명확히 구분
- [ ] 브라우저 개발자 도구로 색상 대비 확인

---

**작성일**: 2025.10.17
**프로젝트**: Architecture Management System v2.0
**예상 구현 기간**: 1일 (3~4시간)
**우선순위**: Medium (사용성 개선)
