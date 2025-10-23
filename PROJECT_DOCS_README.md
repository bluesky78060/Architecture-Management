# 프로젝트 소개 문서 생성 가이드

이 문서는 프로젝트 소개 페이지를 Markdown, HTML, PDF 형식으로 자동 생성하는 방법을 설명합니다.

## 📦 생성된 파일 목록

### 소스 문서
- **PROJECT_INTRODUCTION.md** (10KB)
  - 프로젝트 소개 Markdown 원본
  - 위치: 프로젝트 루트

### 웹 페이지
- **public/project-introduction.html** (18KB)
  - 스타일이 적용된 HTML 버전
  - 그라디언트 배경, 전문적인 디자인
  - 브라우저에서 바로 열람 가능

### PDF 문서
- **public/project-introduction.pdf** (1.1MB)
  - A4 형식, 인쇄 가능한 PDF
  - 오프라인 배포용
  - 한글 폰트 완벽 지원

### 변환 스크립트
- **scripts/md-to-html.js** (6.6KB)
  - Markdown → HTML 변환기
  - 자동 스타일링 적용

- **scripts/project-to-pdf.js** (2.6KB)
  - HTML → PDF 변환기
  - Puppeteer 기반

---

## 🚀 빠른 시작

### 1. Markdown 수정 후 재생성
```bash
# 1단계: Markdown 편집
vi PROJECT_INTRODUCTION.md

# 2단계: HTML 생성
node scripts/md-to-html.js

# 3단계: PDF 생성
node scripts/project-to-pdf.js
```

### 2. 한 번에 모두 생성
```bash
# Markdown → HTML → PDF 한 번에
node scripts/md-to-html.js && node scripts/project-to-pdf.js
```

---

## 📝 Markdown 편집 가이드

### 기본 문법
```markdown
# 제목 1 (h1)
## 제목 2 (h2)
### 제목 3 (h3)

**굵은 글씨**
`인라인 코드`

- 목록 항목 1
- 목록 항목 2

[링크 텍스트](https://example.com)

\```bash
코드 블록
\```
```

### 지원하는 이모지
```
✅ ❌ 📊 👥 🔧 📄 💰 🏢 ⚙️ 💻
📦 🌐 📱 🔒 📖 🛠️ 📞 📅 🚀 🎯
🏗️ 🙏 ✨ 🐛 📧 📋
```

---

## 🎨 HTML 스타일 커스터마이징

### 색상 변경
`scripts/md-to-html.js` 파일에서 CSS 변수 수정:

```javascript
// 그라디언트 배경
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// 제목 색상
h1 { color: #667eea; }
h2 { color: #764ba2; }
```

### 폰트 변경
```javascript
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Malgun Gothic', '맑은 고딕', sans-serif;
```

---

## 📄 PDF 옵션 조정

### 페이지 크기 변경
`scripts/project-to-pdf.js` 파일에서:

```javascript
await page.pdf({
  format: 'A4',  // A3, Letter, Legal 등으로 변경 가능
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  }
});
```

### 인쇄 품질 조정
```javascript
await page.setViewport({
  width: 1200,
  height: 800,
  deviceScaleFactor: 2  // 1 (저화질) ~ 3 (고화질)
});
```

---

## 🔧 문제 해결

### Puppeteer 설치 오류
```bash
# Node.js 버전 확인 (v14 이상 필요)
node --version

# Puppeteer 재설치
npm uninstall puppeteer
npm install puppeteer
```

### 한글 폰트가 안 보일 때
```bash
# macOS
brew install --cask font-nanum

# Ubuntu/Debian
sudo apt-get install fonts-nanum
```

### PDF 파일 크기가 너무 클 때
```javascript
// deviceScaleFactor 낮추기
deviceScaleFactor: 1  // 2에서 1로 변경
```

---

## 📊 파일 크기 최적화

### Markdown 최적화
- 불필요한 공백 제거
- 중복 내용 정리
- 이미지 최적화 (외부 링크 사용)

### HTML 최적화
```bash
# HTML 압축 (선택 사항)
npm install -g html-minifier
html-minifier --collapse-whitespace \
              --remove-comments \
              public/project-introduction.html \
              -o public/project-introduction.min.html
```

### PDF 최적화
```bash
# PDF 압축 (선택 사항)
brew install ghostscript
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=public/project-introduction-compressed.pdf \
   public/project-introduction.pdf
```

---

## 🌐 웹 배포

### GitHub Pages
```bash
# public 폴더를 gh-pages 브랜치로 배포
npm run deploy
```

### Vercel 배포
Vercel은 `public` 폴더를 자동으로 정적 파일로 제공합니다.

접근 URL:
- HTML: `https://your-domain.vercel.app/project-introduction.html`
- PDF: `https://your-domain.vercel.app/project-introduction.pdf`

---

## 📚 추가 리소스

### Markdown 가이드
- [GitHub Flavored Markdown](https://guides.github.com/features/mastering-markdown/)
- [Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/)

### Puppeteer 문서
- [Puppeteer API](https://pptr.dev/)
- [PDF Options](https://pptr.dev/api/puppeteer.pdfoptions)

### CSS 스타일링
- [CSS Gradient Generator](https://cssgradient.io/)
- [Google Fonts](https://fonts.google.com/)

---

## 🤝 기여 방법

### 개선 사항 제안
1. Markdown 템플릿 개선
2. HTML 디자인 향상
3. PDF 레이아웃 최적화
4. 다국어 지원

### 버그 리포트
GitHub Issues에 다음 정보 포함:
- 사용 환경 (OS, Node.js 버전)
- 오류 메시지
- 재현 방법

---

## 📅 업데이트 로그

### v1.0.0 (2025-10-23)
- ✨ 초기 프로젝트 소개 문서 생성
- ✨ Markdown → HTML 변환기
- ✨ HTML → PDF 변환기 (Puppeteer)
- ✨ 전문적인 디자인 템플릿
- ✨ 한글 폰트 완벽 지원

---

## 📞 지원

문의사항이 있으시면:
- **Email**: bluesky78060@gmail.com
- **GitHub**: https://github.com/bluesky78060/Architecture-Management

---

**프로젝트 소개 문서 시스템** - 전문적인 프로젝트 소개를 쉽고 빠르게! 📄✨
