#!/usr/bin/env node

/**
 * Project Introduction HTML to PDF Converter
 * Converts project-introduction.html to PDF using Puppeteer
 */

const fs = require('fs');
const path = require('path');

async function convertToPDF() {
  console.log('📄 HTML을 PDF로 변환 중...\n');

  // Check if puppeteer is installed
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (error) {
    console.log('⚠️  puppeteer가 설치되어 있지 않습니다.');
    console.log('📦 puppeteer 설치 중...\n');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer', { stdio: 'inherit' });
    puppeteer = require('puppeteer');
    console.log('\n✅ puppeteer 설치 완료!\n');
  }

  const inputFile = path.join(__dirname, '../public/project-introduction.html');
  const outputFile = path.join(__dirname, '../public/project-introduction.pdf');

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error('❌ 오류: project-introduction.html 파일을 찾을 수 없습니다.');
    console.error(`   경로: ${inputFile}\n`);
    console.error('💡 먼저 "node scripts/md-to-html.js"를 실행하세요.\n');
    process.exit(1);
  }

  // Launch browser
  console.log('🚀 브라우저 시작 중...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport for consistent rendering
  await page.setViewport({
    width: 1200,
    height: 800,
    deviceScaleFactor: 2
  });

  console.log('📖 HTML 파일 로드 중...');
  await page.goto(`file://${inputFile}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait a bit for fonts to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('🖨️  PDF 생성 중...');
  await page.pdf({
    path: outputFile,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true,
    preferCSSPageSize: false
  });

  await browser.close();

  // Get file size
  const stats = fs.statSync(outputFile);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n✅ PDF 생성 완료!');
  console.log(`   위치: ${outputFile}`);
  console.log(`   크기: ${sizeMB} MB`);
  console.log(`   형식: A4, 여백 포함\n`);
}

// Run conversion
convertToPDF().catch(error => {
  console.error('\n❌ PDF 생성 중 오류 발생:', error.message);
  console.error('\n스택 트레이스:');
  console.error(error.stack);
  process.exit(1);
});
