# 작업 완료 시 체크리스트

## 코드 품질 검증
### 1. 린팅 및 포맷팅
```bash
# ESLint 검사 (package.json 기준)
npm run lint  # (사용 가능한 경우)

# 또는 수동으로 코드 스타일 확인
# - React 컴포넌트 네이밍 (PascalCase)
# - 함수/변수 네이밍 (camelCase)
# - import 순서 준수
# - Tailwind 클래스 정리
```

### 2. TypeScript 타입 검사
```bash
# TypeScript 컴파일 검사
npx tsc --noEmit

# 또는 빌드로 타입 오류 확인
npm run build
```

### 3. 빌드 테스트
```bash
# 프로덕션 빌드 성공 확인
npm run build

# Electron 빌드 테스트 (필요시)
npm run build-electron
```

## 기능 테스트
### 4. 단위 테스트
```bash
# React 테스트 실행
npm test

# 모든 테스트 통과 확인
npm test -- --watchAll=false
```

### 5. E2E 테스트
```bash
# Playwright 테스트 실행
npx playwright test

# 특정 브라우저 테스트
npx playwright test --project=chromium

# 헤드리스 모드로 확인
npx playwright test --headed
```

### 6. 수동 기능 테스트
- [ ] 웹 서버 시작 (`npm start`)
- [ ] 주요 페이지 네비게이션 확인
- [ ] CRUD 기능 동작 확인
- [ ] PDF 생성 기능 확인
- [ ] 반응형 디자인 확인

## 배포 전 검증
### 7. 다양한 환경 테스트
```bash
# 다른 포트에서 테스트
npm start -- --port 3001

# Electron 앱 테스트
npm run electron-dev
```

### 8. 성능 확인
- [ ] 페이지 로딩 속도 확인
- [ ] 메모리 사용량 확인 (개발자 도구)
- [ ] 콘솔 에러 없음 확인

## 문서화
### 9. 코드 문서화
- [ ] 새로운 컴포넌트에 JSDoc 추가
- [ ] README 업데이트 (필요시)
- [ ] 타입 정의 업데이트

### 10. Git 관리
```bash
# 변경사항 확인
git status
git diff

# 커밋 메시지 작성
git add .
git commit -m "feat: 새로운 기능 구현"

# 브랜치 관리
git push origin feature-branch
```

## 최종 체크리스트
- [ ] 모든 테스트 통과
- [ ] 빌드 성공
- [ ] 주요 기능 동작 확인
- [ ] 코드 스타일 준수
- [ ] 타입 오류 없음
- [ ] 콘솔 에러 없음
- [ ] 문서 업데이트 완료
- [ ] Git 커밋 완료