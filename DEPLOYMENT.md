# GitHub Pages 배포 가이드

## 🚀 자동 배포 설정

이 프로젝트는 GitHub Pages를 통한 자동 배포가 설정되어 있습니다.

### 배포 URL
- **배포 주소**: https://bluesky78060.github.io/Architecture-Management

### 자동 배포 조건
- `main` 또는 `master` 브랜치에 푸시할 때마다 자동으로 배포됩니다
- GitHub Actions를 통해 빌드 및 배포가 자동으로 진행됩니다

## 📋 배포 설정 단계

### 1. GitHub Pages 활성화
1. GitHub 저장소 → Settings → Pages
2. Source: "GitHub Actions" 선택
3. 자동으로 워크플로우가 실행됩니다

### 2. 수동 배포 (로컬에서)
```bash
# 의존성 설치
npm install

# 프로덕션 빌드 및 배포
npm run deploy
```

### 3. 배포 상태 확인
- GitHub 저장소의 Actions 탭에서 배포 진행 상황 확인
- 배포 완료 후 약 5-10분 후 실제 사이트에 반영

## 🔧 배포 설정 파일

### 1. package.json 설정
```json
{
  "homepage": "https://bluesky78060.github.io/Architecture-Management",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 2. GitHub Actions 워크플로우
- `.github/workflows/deploy.yml`
- 자동 빌드 및 배포 설정

### 3. SPA 라우팅 지원
- `public/404.html`: SPA 라우팅을 위한 리다이렉트 처리
- `public/index.html`: GitHub Pages SPA 스크립트 포함

## 🌐 배포된 기능

### 지원되는 기능
✅ 대시보드 및 모든 페이지 접근  
✅ 청구서/견적서/건축주/작업항목 관리  
✅ Excel 파일 생성 및 다운로드  
✅ 반응형 디자인 (모바일/데스크톱)  
✅ 도장 이미지 업로드 및 저장  

### 제한사항
❌ 파일 시스템 접근 (Electron 기능)  
❌ 로컬 파일 저장 (브라우저 제한)  
❌ 데스크톱 앱 전용 기능  

## 💡 주의사항

### 데이터 저장
- 모든 데이터는 브라우저의 localStorage에 저장됩니다
- 브라우저 데이터를 삭제하면 저장된 정보가 사라집니다
- 중요한 데이터는 정기적으로 Excel로 백업하세요

### 브라우저 호환성
- Chrome, Firefox, Safari, Edge 최신 버전 지원
- 모바일 브라우저에서도 정상 작동

### 성능 최적화
- Million.js를 통한 렌더링 성능 향상 (16-93% 빠른 렌더링)
- 코드 스플리팅 및 최적화된 번들 크기

## 🔍 배포 문제 해결

### 빌드 실패 시
```bash
# 캐시 정리 후 재빌드
npm run build
```

### 배포 실패 시
```bash
# gh-pages 캐시 정리
rm -rf node_modules/.cache/gh-pages
npm run deploy
```

### 404 오류 시
- GitHub Pages 설정 확인
- DNS 전파 대기 (최대 24시간)
- 저장소 Public 설정 확인

## 📞 지원

배포 관련 문제가 있을 경우:
1. GitHub Actions 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 이슈 생성 또는 문의