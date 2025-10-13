# GitHub Pages 수동 배포 가이드

`gh-pages` 패키지로 자동 배포가 실패하는 경우 수동 배포 방법입니다.

## ⚠️ 문제

`npm run deploy` 실행 시 다음 오류 발생:
```
error: RPC failed; HTTP 400 curl 22
send-pack: unexpected disconnect while reading sideband packet
```

**원인**: 빌드 파일 크기가 GitHub의 push 제한을 초과

## ✅ 해결 방법 1: GitHub Actions 자동 배포

### 1단계: GitHub Actions Workflow 생성

`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          REACT_APP_SUPABASE_URL: \${{ secrets.REACT_APP_SUPABASE_URL }}
          REACT_APP_SUPABASE_ANON_KEY: \${{ secrets.REACT_APP_SUPABASE_ANON_KEY }}
          REACT_APP_DATABASE_BACKEND: supabase
          REACT_APP_USE_HASH_ROUTER: 1

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./build

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
```

### 2단계: GitHub Repository Secrets 설정

1. GitHub Repository → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 다음 secrets 추가:
   - `REACT_APP_SUPABASE_URL`: `https://rmruecimrcdtmixweqsx.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY`: `your-anon-key`

### 3단계: GitHub Pages 설정

1. Repository → Settings → Pages
2. Source: GitHub Actions 선택
3. Save 클릭

### 4단계: 배포

```bash
git add .github/workflows/deploy.yml
git commit -m "chore: add GitHub Actions deployment workflow"
git push origin main
```

GitHub Actions가 자동으로 빌드 및 배포를 실행합니다.

---

## ✅ 해결 방법 2: Vercel 배포 (권장)

Vercel은 React 앱 배포에 최적화되어 있고 설정이 간단합니다.

### 1단계: Vercel 계정 생성

1. https://vercel.com 접속
2. GitHub 계정으로 로그인

### 2단계: 프로젝트 Import

1. "Add New..." → "Project" 클릭
2. GitHub 저장소 선택: `Architecture-Management`
3. "Import" 클릭

### 3단계: 환경 변수 설정

Build & Development Settings:
- Framework Preset: Create React App
- Build Command: `npm run build`
- Output Directory: `build`

Environment Variables:
```
REACT_APP_SUPABASE_URL=https://rmruecimrcdtmixweqsx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_DATABASE_BACKEND=supabase
```

### 4단계: Deploy

"Deploy" 버튼 클릭하면 자동으로 배포됩니다.

**배포 URL**: `https://your-project.vercel.app`

---

## ✅ 해결 방법 3: Netlify 배포

### 1단계: Netlify 계정 생성

1. https://netlify.com 접속
2. GitHub 계정으로 로그인

### 2단계: New site from Git

1. "Add new site" → "Import an existing project" 클릭
2. GitHub → 저장소 선택
3. Branch: `main` 선택

### 3단계: Build settings

- Build command: `npm run build`
- Publish directory: `build`

### 4단계: 환경 변수 설정

Site settings → Environment variables:
```
REACT_APP_SUPABASE_URL=https://rmruecimrcdtmixweqsx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_DATABASE_BACKEND=supabase
```

### 5단계: Deploy

"Deploy site" 클릭

**배포 URL**: `https://your-site.netlify.app`

---

## 📊 배포 옵션 비교

| 옵션 | 난이도 | 속도 | 비용 | 추천 |
|------|--------|------|------|------|
| GitHub Actions | 중 | 빠름 | 무료 | ⭐⭐⭐ |
| Vercel | 쉬움 | 매우 빠름 | 무료 | ⭐⭐⭐⭐⭐ |
| Netlify | 쉬움 | 빠름 | 무료 | ⭐⭐⭐⭐ |
| GitHub Pages (gh-pages) | 어려움 | 느림 | 무료 | ⭐ (현재 문제 있음) |

**권장**: Vercel을 사용하는 것이 가장 쉽고 빠릅니다!

---

## 🔗 다음 단계

1. **배포 플랫폼 선택**: Vercel 또는 Netlify 권장
2. **환경 변수 설정**: Supabase 자격 증명 추가
3. **배포 실행**: 자동 배포 설정
4. **테스트**: 배포된 URL에서 앱 동작 확인
5. **RLS 설정**: Supabase SQL Editor에서 `enable-dev-access.sql` 실행

---

## 💡 참고사항

- **Supabase 보안**: Anon Key는 클라이언트에 노출 가능 (Row Level Security로 보호)
- **무료 티어**: Vercel, Netlify, GitHub Pages 모두 무료로 호스팅 가능
- **자동 배포**: main 브랜치에 push하면 자동으로 재배포
- **커스텀 도메인**: 모든 플랫폼에서 커스텀 도메인 설정 가능
