# 건설 청구서 관리 시스템

건축업자가 건축주에게 작업 완료 후 청구서를 생성하고 관리하는 시스템입니다.

## 주요 기능

- 📊 **대시보드**: 청구서 현황 및 통계 확인
- 📄 **청구서 관리**: 청구서 생성, 수정, 삭제 및 PDF 다운로드
- 👥 **건축주 관리**: 건축주 정보 및 여러 작업장 관리
- 🔧 **작업 항목 관리**: 건축주별 작업 항목 관리 및 추적
- 🏗️ **작업장 정보**: 각 건축주별 여러 작업장 주소 관리

## 실행 방법

### 1. 웹 애플리케이션으로 실행 (추천)

#### 개발 모드
```bash
npm install
npm start
```
브라우저에서 http://localhost:3000 접속

#### 프로덕션 빌드
```bash
npm run build
npm install -g serve
serve -s build
```

### 2. 데스크톱 애플리케이션으로 실행

#### 개발 모드에서 Electron 실행
```bash
npm run electron-dev
```

#### 배포용 실행 파일 생성

**Windows용 설치 파일 생성:**
```bash
npm run dist-win
```
- 생성 위치: `dist/` 폴더
- 파일: `건설 청구서 관리 시스템 Setup 0.1.0.exe`

**Mac용 설치 파일 생성:**
```bash
npm run dist-mac
```
- 생성 위치: `dist/` 폴더  
- 파일: `건설 청구서 관리 시스템-0.1.0.dmg`

**Windows + Mac 동시 생성:**
```bash
npm run dist-all
```

## 시스템 요구사항

### 웹 애플리케이션
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)
- **인터넷 연결**: 필요 없음 (로컬 실행)

### 데스크톱 애플리케이션
- **Windows**: Windows 10 이상
- **Mac**: macOS 10.14 이상
- **메모리**: 최소 4GB RAM
- **저장공간**: 200MB 이상

## 배포 옵션

### 1. 로컬 사용
- 개발 서버로 실행 (`npm start`)
- 같은 네트워크의 다른 기기에서도 접근 가능

### 2. 무료 호스팅
- **Netlify**: 드래그 앤 드롭으로 간단 배포
- **Vercel**: GitHub 연동 자동 배포
- **GitHub Pages**: 무료 정적 사이트 호스팅

### 3. 데스크톱 앱
- Windows: `.exe` 설치 파일
- Mac: `.dmg` 설치 파일
- 인터넷 연결 없이 오프라인 사용 가능

## 사용법

### 1. 건축주 관리
- 새 건축주 추가 시 여러 작업장 정보 입력 가능
- 작업장별 이름, 주소, 설명 관리

### 2. 작업 항목 관리
- 건축주별로 작업 항목 분류
- 작업장 선택 가능
- 작업 진행 상태 추적

### 3. 청구서 생성
- 완료된 작업 항목을 선택하여 청구서 생성
- 작업장 주소 자동 포함
- PDF 다운로드 기능

### 4. PDF 생성
- 청구서 목록에서 "PDF" 버튼 클릭
- 브라우저 인쇄 대화상자에서 "PDF로 저장" 선택
- 한글 폰트 완전 지원

## 문제 해결

### PDF 생성이 안 될 때
1. 팝업 차단 해제
2. 브라우저 권한 허용
3. 개발자 도구(F12) → Console에서 오류 확인

### Electron 앱 실행 안 될 때
1. Node.js 버전 확인 (v14 이상)
2. 보안 소프트웨어 예외 설정
3. 관리자 권한으로 실행

### 포트 충돌
```bash
npm start -- --port 3001
```

## 개발 정보

- **Framework**: React 18
- **Styling**: Tailwind CSS
- **PDF Generation**: react-to-print
- **Desktop App**: Electron
- **Build Tool**: Create React App

## 라이선스

이 프로젝트는 개인 및 상업적 사용이 가능합니다.