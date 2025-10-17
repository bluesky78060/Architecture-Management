# Supabase OAuth 설정 가이드

SNS 로그인을 활성화하려면 Supabase Dashboard에서 OAuth Provider를 설정해야 합니다.

---

## 1. Google OAuth 설정

### 1-1. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" → "사용자 인증 정보" 이동
4. "+ 사용자 인증 정보 만들기" → "OAuth 2.0 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션" 선택
6. **승인된 리디렉션 URI 추가**:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   ```
   > 💡 Supabase Project ID는 Dashboard → Settings → General에서 확인
7. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

### 1-2. Supabase Dashboard 설정
1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** 이동
4. **Google** 찾아서 활성화 (Enable)
5. Google Cloud Console에서 복사한 **Client ID**와 **Client Secret** 입력
6. **Save** 클릭

### 1-3. 승인된 도메인 추가 (선택)
Supabase Dashboard → Authentication → **URL Configuration**:
- **Site URL**: `http://localhost:3000` (개발) 또는 `https://yourdomain.com` (프로덕션)
- **Redirect URLs**: 위와 동일

---

## 2. Kakao OAuth 설정

Kakao는 Supabase가 **공식 지원**합니다!

### 2-1. Kakao Developers 설정

#### 앱 생성
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 우측 상단 "로그인" 클릭
3. **내 애플리케이션** → **애플리케이션 추가하기** 클릭
4. 다음 정보 입력:
   - 앱 아이콘 (선택)
   - 앱 이름
   - 사업자명
5. **저장** 클릭

#### REST API 키 확인
1. **내 애플리케이션** 선택
2. **앱 키** 섹션에서 **REST API 키** 복사
   > 💡 이것이 Supabase의 **Client ID**입니다

#### Client Secret 생성
1. **제품 설정** → **카카오 로그인** → **보안** 이동
2. **카카오 로그인** 활성화
3. **Client Secret** 섹션에서:
   - **코드 생성** 클릭
   - Client Secret 코드 복사
   - **Client Secret 코드**를 **사용함**으로 설정
4. **저장** 클릭

#### Redirect URI 설정
1. **제품 설정** → **카카오 로그인** 이동
2. **Redirect URI** 섹션에서 **Redirect URI 등록** 클릭
3. 다음 URI 추가:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   ```
4. **저장** 클릭

#### 동의 항목 설정
1. **제품 설정** → **카카오 로그인** → **동의 항목** 이동
2. 다음 항목 **필수 동의** 또는 **선택 동의**로 설정:
   - ✅ **account_email** (이메일)
   - ✅ **profile_nickname** (닉네임)
   - ✅ **profile_image** (프로필 사진)
3. **저장** 클릭

### 2-2. Supabase Dashboard 설정
1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** 이동
4. **Kakao** 찾아서 활성화 (Enable)
5. 다음 정보 입력:
   - **Client ID**: Kakao REST API 키
   - **Client Secret**: Kakao Client Secret 코드
6. **Save** 클릭

---

## 3. 설정 완료 후 테스트

### 개발 환경 테스트
1. 개발 서버 실행:
   ```bash
   npm start
   ```
2. 브라우저에서 `http://localhost:3000` 접속
3. 로그인 페이지에서 **Google** 또는 **Kakao** 버튼 클릭
4. OAuth 인증 플로우 확인
5. 성공 시 대시보드로 리다이렉트 확인

### 프로덕션 배포
1. **Google Cloud Console**과 **Kakao Developers**에서:
   - 프로덕션 도메인을 **승인된 도메인** 또는 **Redirect URI**에 추가
2. **Supabase Dashboard** → **URL Configuration**:
   - Site URL을 프로덕션 URL로 변경
3. 프로덕션 환경에서 테스트

---

## 4. 문제 해결

### Google 로그인 오류

**오류: `redirect_uri_mismatch`**
- **원인**: Google Cloud Console의 승인된 리디렉션 URI가 올바르지 않음
- **해결**: Supabase 콜백 URI 확인 및 재설정
  ```
  https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback
  ```

**오류: `invalid_client`**
- **원인**: Client ID 또는 Client Secret이 잘못됨
- **해결**: Google Cloud Console에서 다시 복사하여 Supabase에 입력

### Kakao 로그인 오류

**오류: `KOE101` (앱 키 오류)**
- **원인**: REST API 키가 잘못됨
- **해결**: Kakao Developers → 앱 키 확인 및 재입력

**오류: `KOE201` (Redirect URI 오류)**
- **원인**: Redirect URI가 등록되지 않음
- **해결**: Kakao Developers → 카카오 로그인 → Redirect URI 등록
  ```
  https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback
  ```

**오류: `KOE006` (Client Secret 오류)**
- **원인**: Client Secret이 활성화되지 않음
- **해결**: 카카오 로그인 → 보안 → Client Secret 코드 "사용함"으로 설정

**오류: 동의 항목 오류**
- **원인**: 필수 동의 항목이 설정되지 않음
- **해결**: 카카오 로그인 → 동의 항목 → account_email, profile_nickname 설정

---

## 5. 참고 사항

### 개발 환경
- **localhost**는 대부분의 OAuth Provider에서 자동으로 허용됩니다
- 테스트용으로 `http://localhost:3000` 사용 가능

### 프로덕션 환경
- **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS 사용
- **도메인 등록**: 각 OAuth Provider에 프로덕션 도메인 등록 필요

### 보안
- **Client Secret**: 절대 GitHub 등 공개 저장소에 커밋하지 마세요
- **환경 변수**: `.env` 파일을 `.gitignore`에 추가하세요
- **정기 갱신**: Client Secret은 정기적으로 갱신 권장

---

## 6. 공식 문서

- **Supabase Google 로그인**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Supabase Kakao 로그인**: https://supabase.com/docs/guides/auth/social-login/auth-kakao
- **Google OAuth 문서**: https://developers.google.com/identity/protocols/oauth2
- **Kakao OAuth 문서**: https://developers.kakao.com/docs/latest/ko/kakaologin/common
