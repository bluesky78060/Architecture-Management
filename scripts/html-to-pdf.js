#!/usr/bin/env node
/**
 * HTML to PDF Converter using Puppeteer
 * Converts user-guide.html to PDF with proper Korean font support
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
    try {
      execSync('npm install puppeteer', { stdio: 'inherit' });
      puppeteer = require('puppeteer');
      console.log('\n✅ puppeteer 설치 완료!\n');
    } catch (installError) {
      console.error('❌ puppeteer 설치 실패:', installError.message);
      process.exit(1);
    }
  }

  const inputFile = path.join(__dirname, '../public/user-guide.html');
  const outputFile = path.join(__dirname, '../user-guide.pdf');

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 입력 파일을 찾을 수 없습니다: ${inputFile}`);
    process.exit(1);
  }

  console.log(`  입력: ${path.basename(inputFile)}`);
  console.log(`  출력: ${path.basename(outputFile)}\n`);

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Navigate to HTML file
    await page.goto(`file://${inputFile}`, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
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
      displayHeaderFooter: false
    });

    await browser.close();

    // Get file size
    const stats = fs.statSync(outputFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ PDF 생성 완료!\n');
    console.log(`  위치: ${outputFile}`);
    console.log(`  크기: ${sizeMB} MB\n`);
    console.log('🎉 성공적으로 PDF가 생성되었습니다!');

  } catch (error) {
    console.error('\n❌ PDF 생성 실패:', error.message);
    process.exit(1);
  }
}

// Run the conversion
convertToPDF();
