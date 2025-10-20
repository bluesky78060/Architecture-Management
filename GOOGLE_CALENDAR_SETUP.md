# Google Calendar API 설정 가이드

이 문서는 건설 관리 시스템과 Google Calendar를 동기화하기 위한 설정 방법을 설명합니다.

## 개요

Google Calendar 동기화 기능을 사용하면:
- ✅ Google Calendar에서 일정 가져오기
- ✅ 이 앱의 일정을 Google Calendar로 내보내기
- ✅ 양방향 동기화 지원
- ✅ 반복 일정 자동 변환
- ✅ 알림 설정 동기화

## 1단계: Google Cloud Console 프로젝트 생성

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단의 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름 입력 (예: "건설관리-캘린더동기화")
5. "만들기" 클릭

### 1.2 Calendar API 활성화
1. 왼쪽 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. 검색창에 "Google Calendar API" 입력
3. "Google Calendar API" 선택
4. "사용" 버튼 클릭

## 2단계: OAuth 2.0 클라이언트 ID 생성

### 2.1 동의 화면 구성
1. 왼쪽 메뉴에서 "API 및 서비스" > "OAuth 동의 화면" 선택
2. 사용자 유형 선택:
   - **외부**: 누구나 사용 가능 (권장)
   - **내부**: Google Workspace 조직 내부만 사용
3. "만들기" 클릭
4. 앱 정보 입력:
   - **앱 이름**: 건설 관리 시스템
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
5. "저장 후 계속" 클릭

### 2.2 범위 추가
1. "범위 추가 또는 삭제" 클릭
2. 다음 범위 선택:
   - `https://www.googleapis.com/auth/calendar` (필수)
3. "업데이트" 클릭
4. "저장 후 계속" 클릭

### 2.3 테스트 사용자 추가 (외부 선택 시)
1. "ADD USERS" 클릭
2. 본인 이메일 추가 (테스트 시 사용할 Google 계정)
3. "추가" 클릭
4. "저장 후 계속" 클릭

### 2.4 OAuth 클라이언트 ID 생성
1. 왼쪽 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 클릭
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름 입력 (예: "건설관리 웹 클라이언트")
5. **승인된 JavaScript 원본** 추가:
   ```
   http://localhost:3000
   http://localhost:3001
   https://architecture-management.vercel.app
   https://your-custom-domain.com (프로덕션 도메인이 있는 경우)
   ```
6. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:3000
   http://localhost:3001
   https://architecture-management.vercel.app
   https://your-custom-domain.com (프로덕션 도메인이 있는 경우)
   ```
7. "만들기" 클릭
8. **클라이언트 ID** 복사 (나중에 사용)

## 3단계: API Key 생성

### 3.1 API Key 만들기
1. "사용자 인증 정보 만들기" > "API 키" 클릭
2. API 키가 생성됨
3. "키 제한" 클릭하여 보안 강화

### 3.2 API Key 제한 설정 (권장)
1. **애플리케이션 제한사항**:
   - "HTTP 리퍼러" 선택
   - 다음 리퍼러 추가:
     ```
     http://localhost:3000/*
     http://localhost:3001/*
     https://architecture-management.vercel.app/*
     https://your-custom-domain.com/*
     ```
2. **API 제한사항**:
   - "키 제한" 선택
   - "Google Calendar API" 선택
3. "저장" 클릭
4. **API Key** 복사 (나중에 사용)

## 4단계: 환경 변수 설정

### 4.1 로컬 개발 환경 (.env)
1. 프로젝트 루트의 `.env` 파일 열기
2. 다음 변수 추가:
   ```bash
   REACT_APP_GOOGLE_CLIENT_ID=복사한_클라이언트_ID
   REACT_APP_GOOGLE_API_KEY=복사한_API_키
   ```
3. 파일 저장
4. 개발 서버 재시작:
   ```bash
   npm start
   ```

### 4.2 Vercel 프로덕션 환경
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. "Settings" > "Environment Variables" 이동
4. 다음 변수 추가:
   - Name: `REACT_APP_GOOGLE_CLIENT_ID`
   - Value: 복사한 클라이언트 ID
   - Environment: Production, Preview, Development 모두 선택

   - Name: `REACT_APP_GOOGLE_API_KEY`
   - Value: 복사한 API 키
   - Environment: Production, Preview, Development 모두 선택
5. "Save" 클릭
6. 프로젝트 재배포:
   ```bash
   git push origin main
   ```

## 5단계: 동기화 기능 테스트

### 5.1 인증 테스트
1. 앱 실행 후 "일정 관리" 페이지 이동
2. "📅 Google Calendar" 버튼 클릭
3. "Google 연결" 버튼 클릭
4. Google 계정 선택 및 권한 승인
5. "연결됨" 상태 확인

### 5.2 동기화 테스트
1. 동기화 옵션 선택:
   - ✅ Google Calendar → 이 앱으로 가져오기
   - ✅ 이 앱 → Google Calendar로 내보내기
2. 날짜 범위 설정 (선택사항)
3. "동기화 시작" 버튼 클릭
4. 동기화 완료 메시지 확인
5. 일정 목록에서 가져온 일정 확인

## 문제 해결

### 인증 실패
**증상**: "Google 계정 연결 실패" 메시지 표시

**해결 방법**:
1. 브라우저 콘솔에서 에러 확인 (F12)
2. OAuth 클라이언트 ID가 올바른지 확인
3. 승인된 JavaScript 원본이 현재 도메인과 일치하는지 확인
4. 브라우저 캐시 삭제 후 재시도

### API 호출 실패
**증상**: "동기화 중 오류가 발생했습니다" 메시지 표시

**해결 방법**:
1. Google Calendar API가 활성화되어 있는지 확인
2. API Key가 올바른지 확인
3. API Key 제한사항에 현재 도메인이 포함되어 있는지 확인
4. Google Cloud Console의 "API 및 서비스" > "Dashboard"에서 할당량 확인

### 일정이 동기화되지 않음
**증상**: 동기화 완료 메시지는 나오지만 일정이 보이지 않음

**해결 방법**:
1. Google Calendar 웹사이트에서 일정이 실제로 생성되었는지 확인
2. 앱을 새로고침하여 로컬 상태 업데이트
3. 브라우저 콘솔에서 에러 로그 확인
4. Supabase 데이터베이스에서 일정이 저장되었는지 확인

## 보안 권장사항

### API Key 보호
- ⚠️ API Key를 절대 GitHub에 커밋하지 마세요
- ✅ `.env` 파일을 `.gitignore`에 추가하세요
- ✅ API Key 제한사항을 반드시 설정하세요
- ✅ 프로덕션과 개발 환경에서 서로 다른 Key 사용 권장

### OAuth 클라이언트 보호
- ✅ 승인된 JavaScript 원본을 최소한으로 유지
- ✅ 의심스러운 활동 발견 시 즉시 Key 재생성
- ✅ 정기적으로 Google Cloud Console의 활동 로그 확인

## 참고 자료

- [Google Calendar API 문서](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 지원

문제가 계속되면:
1. GitHub Issues에 문의
2. 에러 메시지 및 브라우저 콘솔 로그 첨부
3. 개발 환경 정보 (브라우저, OS 등) 제공
