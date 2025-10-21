import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const PRIVACY_POLICY = `# 개인정보처리방침

**최종 수정일**: 2025년 10월 20일

Architecture Management("본 서비스")는 사용자의 개인정보를 중요시하며, 개인정보보호법을 준수하고 있습니다.

## 1. 수집하는 개인정보

### 1.1 필수 수집 정보
- **계정 정보**: 이메일 주소, 비밀번호 (암호화 저장)
- **프로필 정보**: 이름 (선택사항)

### 1.2 선택 수집 정보
- **Google Calendar 연동 시**:
  - Google 계정 이메일
  - Google Calendar 일정 데이터 (제목, 날짜, 시간, 설명, 장소)
  - OAuth 접근 토큰 (임시 저장)

### 1.3 자동 수집 정보
- 서비스 이용 기록
- 접속 IP 주소
- 쿠키 및 세션 정보

## 2. 개인정보의 수집 및 이용 목적

### 2.1 서비스 제공
- 건설 프로젝트 관리 서비스 제공
- 건축주, 작업 항목, 견적서, 청구서 관리
- 일정 관리 및 캘린더 기능

### 2.2 Google Calendar 연동 (선택)
- 본 서비스의 일정과 Google Calendar 양방향 동기화
- 일정 충돌 감지 및 알림
- 반복 일정 자동 생성

### 2.3 서비스 개선
- 사용자 경험 개선
- 신규 서비스 개발
- 통계 분석 (익명 처리)

## 3. 개인정보의 보유 및 이용 기간

### 3.1 원칙
- 수집 목적 달성 시까지 보유
- 관련 법령에 따른 보존 기간 준수

### 3.2 구체적 보유 기간
- **회원 정보**: 회원 탈퇴 시까지
- **프로젝트 데이터**: 사용자 삭제 요청 시까지
- **Google Calendar 토큰**: 연동 해제 시 즉시 삭제
- **접속 기록**: 3개월

### 3.3 탈퇴 시 처리
- 모든 개인정보 즉시 삭제
- 법령에 따라 보존이 필요한 경우 별도 DB에 분리 보관

## 4. 개인정보의 제3자 제공

### 4.1 원칙
- 사용자 동의 없이 제3자에게 제공하지 않음

### 4.2 예외 사항
다음의 경우 제3자 제공 가능:
- 사용자의 명시적 동의가 있는 경우
- 법령에 근거가 있는 경우
- 수사 목적의 법원 명령이 있는 경우

### 4.3 외부 서비스 이용
본 서비스는 다음 외부 서비스를 이용합니다:

**Supabase (데이터 저장)**
- 제공 정보: 모든 사용자 데이터
- 목적: 데이터베이스 및 인증 서비스
- 위치: 미국 (AWS)
- 정책: https://supabase.com/privacy

**Google Calendar API (선택적 연동)**
- 제공 정보: 일정 데이터
- 목적: 캘린더 동기화
- 위치: 미국
- 정책: https://policies.google.com/privacy

**Vercel (호스팅)**
- 제공 정보: 접속 로그
- 목적: 웹 애플리케이션 호스팅
- 위치: 미국
- 정책: https://vercel.com/legal/privacy-policy

## 5. 개인정보의 파기 절차 및 방법

### 5.1 파기 절차
- 목적 달성 후 즉시 파기
- 법령 보존 기간 경과 후 지체 없이 파기

### 5.2 파기 방법
- 전자 파일: 복구 불가능한 방법으로 영구 삭제
- 종이 문서: 분쇄 또는 소각

## 6. 개인정보 보호를 위한 기술적/관리적 대책

### 6.1 기술적 대책
- **암호화**: 비밀번호 및 중요 정보 AES-256 암호화
- **HTTPS**: 전송 데이터 SSL/TLS 암호화
- **접근 제어**: 데이터베이스 RLS(Row Level Security) 적용
- **토큰 관리**: OAuth 토큰 안전한 저장 및 관리

### 6.2 관리적 대책
- 개인정보 취급자 최소화
- 개인정보 보호 교육 실시
- 접근 권한 관리 및 모니터링

## 7. 사용자 권리 및 행사 방법

사용자는 다음의 권리를 가집니다:

### 7.1 열람 요구권
- 본인의 개인정보 열람 요구 가능

### 7.2 정정 요구권
- 개인정보 오류 발견 시 정정 요구 가능

### 7.3 삭제 요구권
- 개인정보 삭제 요구 가능
- Settings 페이지에서 직접 삭제 가능

### 7.4 처리 정지 요구권
- 개인정보 처리 정지 요구 가능

### 7.5 권리 행사 방법
- **앱 내**: Settings → 계정 관리
- **이메일**: bluesky78060@gmail.com
- **응답 기한**: 요청 후 10일 이내

## 8. 쿠키의 운용

### 8.1 쿠키 사용 목적
- 로그인 세션 유지
- 사용자 설정 저장 (다크모드 등)

### 8.2 쿠키 설정 거부
- 브라우저 설정에서 쿠키 거부 가능
- 단, 로그인 기능 제한될 수 있음

## 9. 개인정보 보호책임자

### 9.1 개인정보 보호책임자
- **성명**: 이찬희
- **직책**: 개발자
- **이메일**: bluesky78060@gmail.com
- **전화**: 010-7137-8720

### 9.2 개인정보 보호 담당부서
- **부서명**: 기술지원팀
- **이메일**: bluesky78060@gmail.com

## 10. 개인정보 처리방침 변경

### 10.1 변경 시 고지
- 변경 사항은 시행 7일 전 공지
- 중요한 변경은 30일 전 공지

### 10.2 변경 이력
- 2025.10.20: 최초 작성

## 11. 권익침해 구제 방법

개인정보 침해에 대한 신고 및 상담:

**개인정보 침해신고센터**
- 전화: (국번없이) 118
- 웹사이트: privacy.kisa.or.kr

**개인정보 분쟁조정위원회**
- 전화: 1833-6972
- 웹사이트: kopico.go.kr

**대검찰청 사이버범죄수사단**
- 전화: (국번없이) 1301
- 웹사이트: spo.go.kr

**경찰청 사이버안전국**
- 전화: (국번없이) 182
- 웹사이트: cyberbureau.police.go.kr

---

본 개인정보처리방침은 2025년 10월 20일부터 적용됩니다.
`;

const customComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 pb-4 border-b-2 border-indigo-200 dark:border-indigo-800">
      🔒 {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-4 flex items-center">
      <span className="w-1 h-6 bg-indigo-500 mr-3"></span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2 mb-4 ml-6">
      {children}
    </ul>
  ),
  li: ({ children }) => (
    <li className="text-gray-700 dark:text-gray-300 flex items-start">
      <span className="text-indigo-500 mr-2">•</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-indigo-600 dark:text-indigo-400">
      {children}
    </strong>
  ),
  hr: () => (
    <hr className="my-8 border-gray-200 dark:border-gray-700" />
  ),
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl p-8 border-b-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">개인정보처리방침</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Architecture Management</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일</p>
              <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">2025.10.20</p>
            </div>
          </div>
        </div>

        {/* 본문 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-xl p-8 sm:p-12">
          <div className="prose prose-indigo dark:prose-invert max-w-none">
            <ReactMarkdown components={customComponents}>
              {PRIVACY_POLICY}
            </ReactMarkdown>
          </div>

          {/* 푸터 */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
                📧 문의하기
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                개인정보 처리에 관한 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.
              </p>
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <span className="font-medium">이메일:</span>
                <a href="mailto:bluesky78060@gmail.com" className="hover:underline">
                  bluesky78060@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
