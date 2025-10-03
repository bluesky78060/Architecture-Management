# 개발에 필요한 주요 명령어

## 개발 실행 명령어
```bash
# 웹 개발 서버 시작 (포트 3000)
npm start

# 웹 개발 서버 시작 (포트 변경)
npm start -- --port 3001

# Electron 개발 모드 (웹서버 + Electron 동시 실행)
npm run electron-dev

# Electron만 실행 (빌드된 파일 기준)
npm run electron
```

## 빌드 및 배포 명령어
```bash
# 프로덕션 빌드
npm run build

# Windows용 설치 파일 생성
npm run dist-win

# Mac용 설치 파일 생성
npm run dist-mac

# Windows + Mac 동시 생성
npm run dist-all

# Electron 빌드만 (배포용)
npm run build-electron
```

## 테스트 명령어
```bash
# React 단위 테스트 실행
npm test

# Playwright E2E 테스트 실행
npx playwright test

# Playwright 테스트 (헤드리스 모드)
npx playwright test --headed

# 특정 테스트 파일 실행
npx playwright test tests/e2e/auth.spec.js

# 테스트 리포트 확인
npx playwright show-report
```

## 개발 도구 명령어
```bash
# 의존성 설치
npm install

# package-lock.json 재생성
npm ci

# 프로젝트 정리
npm run clean (사용자 정의 스크립트가 있다면)
```

## 시스템 유틸리티 (macOS/Darwin)
```bash
# 파일 목록 조회
ls -la

# 디렉토리 이동
cd <directory>

# 파일 검색
find . -name "*.js"

# 텍스트 검색
grep -r "search_term" src/

# 프로세스 확인
ps aux | grep node

# 포트 사용 확인
lsof -ti:3000

# Git 상태 확인
git status
git log --oneline -10
```

## 문제 해결 명령어
```bash
# 포트 충돌 해결
lsof -ti:3000 | xargs kill -9

# Node 모듈 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 정리
npm cache clean --force
```