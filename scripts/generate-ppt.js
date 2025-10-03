/*
 * Generates a user manual PowerPoint (PPTX) for the Construction Management System.
 */
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

function makeSlideTitle(slide, title) {
  slide.addText(title, {
    x: 0.5, y: 0.4, w: 12.5, h: 1.0,
    fontSize: 32, bold: true, color: '20304a'
  });
}

function makeBullets(slide, items, yStart = 1.5) {
  slide.addText(items.map((t) => ({ text: t + '\n' })), {
    x: 0.8, y: yStart, w: 11.7, h: 5.5,
    fontSize: 20, color: '333333', bullet: true, lineSpacing: 28
  });
}

async function run() {
  const pptx = new PptxGenJS();
  pptx.author = 'Construction Management System';
  pptx.company = 'CMS';
  pptx.layout = 'LAYOUT_16x9';

  // 1. Title
  let slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  makeSlideTitle(slide, '건설 청구서 관리 시스템 – 사용자 설명서');
  slide.addText('버전: 최신 | 문서 자동 생성', { x: 0.8, y: 1.6, fontSize: 18, color: '666666' });
  slide.addText('문의: 관리자', { x: 0.8, y: 2.1, fontSize: 18, color: '666666' });

  // 2. 개요
  slide = pptx.addSlide();
  makeSlideTitle(slide, '개요');
  makeBullets(slide, [
    '대시보드에서 청구 현황 요약 확인',
    '건축주·작업항목·견적서·청구서의 생성/관리',
    '백업/복원으로 데이터 보호',
  ]);

  // 3. 실행 방법
  slide = pptx.addSlide();
  makeSlideTitle(slide, '실행 방법');
  makeBullets(slide, [
    '개발: npm install → npm start',
    '빌드: npm run build (build/ 생성)',
    '데스크톱(Electron): npm run electron-dev',
  ]);

  // 4. 네비게이션
  slide = pptx.addSlide();
  makeSlideTitle(slide, '주요 화면');
  makeBullets(slide, [
    '대시보드: 요약 카드, 최근 청구서, 백업/복원',
    '건축주 관리: 건축주/작업장/프로젝트(필수) 관리',
    '작업 항목 관리: 프로젝트/상태/단가·수량 관리',
    '견적서 관리: 생성/편집/인쇄/일괄 삭제',
    '청구서 관리: 상태 변경/인쇄/일괄 삭제',
  ]);

  // 5. 대시보드
  slide = pptx.addSlide();
  makeSlideTitle(slide, '대시보드');
  makeBullets(slide, [
    '등록된 건축주 수, 청구액, 미수금, 결제완료 요약',
    '백업: 💾 버튼으로 JSON 저장',
    '복원: ♻️ 버튼으로 JSON 선택',
    '안내: 작업 종료 시 백업 권장',
  ]);

  // 6. 건축주 관리
  slide = pptx.addSlide();
  makeSlideTitle(slide, '건축주 관리');
  makeBullets(slide, [
    '새 건축주: 기본정보 + 작업장',
    '프로젝트(작업장 설명) 필수 입력',
    'projects 배열은 작업장 프로젝트에서 자동 동기화',
    '엑셀 가져오기/내보내기 지원',
  ]);

  // 7. 작업 항목 관리
  slide = pptx.addSlide();
  makeSlideTitle(slide, '작업 항목 관리');
  makeBullets(slide, [
    '건축주/프로젝트/작업장/상태 필터',
    '단가·수량 합계 자동 계산',
    '체크박스 일괄 선택/삭제',
  ]);

  // 8. 견적서 관리
  slide = pptx.addSlide();
  makeSlideTitle(slide, '견적서 관리');
  makeBullets(slide, [
    '생성/편집/인쇄(PDF)',
    '작업장 선택 시 프로젝트 자동 채움',
    '체크박스 일괄 삭제(모달 확인)',
  ]);

  // 9. 청구서 관리
  slide = pptx.addSlide();
  makeSlideTitle(slide, '청구서 관리');
  makeBullets(slide, [
    '상태: 발송대기/발송됨/미결제/결제완료',
    '작업장 선택 시 프로젝트 자동 채움',
    '인쇄(PDF), 체크박스 일괄 삭제(모달 확인)',
  ]);

  // 10. 백업/복원 주의사항
  slide = pptx.addSlide();
  makeSlideTitle(slide, '백업/복원 주의사항');
  makeBullets(slide, [
    'JSON 파일은 안전한 위치에 보관',
    '복원 시 현재 데이터가 덮어써질 수 있음',
    '버전 차이 발생 시 일부 항목 불러오기 제한 가능',
  ]);

  // 11. 환경 설정
  slide = pptx.addSlide();
  makeSlideTitle(slide, '환경 설정 & 라우팅');
  makeBullets(slide, [
    'REACT_APP_BASE_PATH=/cms (기본 경로)',
    'REACT_APP_USE_HASH_ROUTER=1 (해시 라우터)',
    '개발 포트: .env.development의 PORT=3003',
  ]);

  // 12. 팁
  slide = pptx.addSlide();
  makeSlideTitle(slide, '팁');
  makeBullets(slide, [
    '목록 헤더 체크박스로 전체 선택',
    '선택 삭제 버튼은 항목 선택 시에만 표시',
    '작업 종료 시 백업 수행',
  ]);

  // Ensure docs directory
  const outDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const outPath = path.join(outDir, '사용설명서.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log('Presentation generated at:', outPath);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

