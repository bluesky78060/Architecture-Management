# 다크모드 구현 가이드

## 개요
건축 관리 시스템 다크모드 추가 가이드
- 눈의 피로 감소, 배터리 절약, 모던한 UX, 접근성 향상
- 예상 시간: 3-4시간
- 난이도: ⭐⭐⭐⭐

## 구현 단계

### Phase 1: Tailwind 설정 (1분)
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 클래스 기반 다크모드 (사용자 선택)
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
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
}
```

### Phase 2: ThemeContext 구현 (15분)
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
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
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
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### Phase 3: 토글 버튼 (15분)
```tsx
// src/components/ThemeToggle.tsx
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
      {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
};
```

### Phase 4: 색상 매핑 가이드

| 라이트 모드 | 다크 모드 | 용도 |
|------------|----------|------|
| bg-white | dark:bg-gray-800 | 카드 배경 |
| bg-gray-50 | dark:bg-gray-900 | 페이지 배경 |
| bg-gray-100 | dark:bg-gray-700 | 입력 필드 배경 |
| text-gray-900 | dark:text-white | 주요 텍스트 |
| text-gray-600 | dark:text-gray-300 | 보조 텍스트 |
| border-gray-200 | dark:border-gray-700 | 테두리 |

## 적용 우선순위

### High (필수)
- Layout.tsx
- Dashboard.tsx
- Login.tsx
- Settings.tsx

### Medium
- Clients.tsx
- WorkItemsPage.tsx
- EstimatesPage.tsx
- InvoicesPage.tsx

### Low
- CompanyInfo.tsx
- 나머지 컴포넌트

## 특수 케이스

### 인쇄 스타일 강제
```css
/* src/index.css */
@media print {
  * {
    background-color: white !important;
    color: black !important;
  }
}
```

### 전환 애니메이션
```css
* {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

## 테스트 체크리스트
- [ ] 토글 버튼 동작
- [ ] localStorage 저장/불러오기
- [ ] 새로고침 후 유지
- [ ] 모든 텍스트 가독성 (대비 4.5:1 이상)
- [ ] 인쇄 시 라이트 모드 강제

## 예상 작업 시간

| 컴포넌트 | 시간 | 복잡도 |
|----------|------|--------|
| Layout | 15분 | ⭐⭐ |
| Dashboard | 20분 | ⭐⭐⭐ |
| Clients | 30분 | ⭐⭐⭐⭐ |
| WorkItems | 25분 | ⭐⭐⭐ |
| Estimates | 30분 | ⭐⭐⭐⭐ |
| Invoices | 30분 | ⭐⭐⭐⭐ |
| Settings | 15분 | ⭐⭐ |
| 기타 | 35분 | ⭐⭐ |
| **총합** | **3.5시간** | - |

## 완료 기준
- 모든 페이지에서 다크모드 정상 작동
- 토글 버튼 모든 페이지 표시
- localStorage 설정 저장/복원
- 인쇄 시 라이트 모드 강제
- 모든 텍스트 가독성 확보
- 호버/포커스 상태 명확

**문서 위치**: `/Users/leechanhee/ConstructionManagement-Installer/docs/dark-mode-implementation-guide.md`
**작성일**: 2025.10.17
**우선순위**: Medium
