#!/usr/bin/env node

/**
 * Markdown to Styled HTML Converter
 * Converts PROJECT_INTRODUCTION.md to project-introduction.html with professional styling
 */

const fs = require('fs');
const path = require('path');

// Input and output files
const inputFile = path.join(__dirname, '../PROJECT_INTRODUCTION.md');
const outputFile = path.join(__dirname, '../public/project-introduction.html');

console.log('📄 Markdown을 HTML로 변환 중...\n');

// Read markdown content
const markdown = fs.readFileSync(inputFile, 'utf-8');

// Simple markdown to HTML converter
function markdownToHtml(md) {
  let html = md;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Code blocks
  html = html.replace(/```(.*?)\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists (unordered)
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');

  // Checkboxes
  html = html.replace(/✅/g, '<span class="emoji">✅</span>');
  html = html.replace(/❌/g, '<span class="emoji">❌</span>');
  html = html.replace(/📊/g, '<span class="emoji">📊</span>');
  html = html.replace(/👥/g, '<span class="emoji">👥</span>');
  html = html.replace(/🔧/g, '<span class="emoji">🔧</span>');
  html = html.replace(/📄/g, '<span class="emoji">📄</span>');
  html = html.replace(/💰/g, '<span class="emoji">💰</span>');
  html = html.replace(/🏢/g, '<span class="emoji">🏢</span>');
  html = html.replace(/⚙️/g, '<span class="emoji">⚙️</span>');
  html = html.replace(/💻/g, '<span class="emoji">💻</span>');
  html = html.replace(/📦/g, '<span class="emoji">📦</span>');
  html = html.replace(/🌐/g, '<span class="emoji">🌐</span>');
  html = html.replace(/📱/g, '<span class="emoji">📱</span>');
  html = html.replace(/🔒/g, '<span class="emoji">🔒</span>');
  html = html.replace(/📖/g, '<span class="emoji">📖</span>');
  html = html.replace(/🛠️/g, '<span class="emoji">🛠️</span>');
  html = html.replace(/📞/g, '<span class="emoji">📞</span>');
  html = html.replace(/📅/g, '<span class="emoji">📅</span>');
  html = html.replace(/🚀/g, '<span class="emoji">🚀</span>');
  html = html.replace(/🎯/g, '<span class="emoji">🎯</span>');
  html = html.replace(/🏗️/g, '<span class="emoji">🏗️</span>');
  html = html.replace(/🙏/g, '<span class="emoji">🙏</span>');
  html = html.replace(/✨/g, '<span class="emoji">✨</span>');
  html = html.replace(/🐛/g, '<span class="emoji">🐛</span>');
  html = html.replace(/📧/g, '<span class="emoji">📧</span>');
  html = html.replace(/📋/g, '<span class="emoji">📋</span>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');

  return html;
}

// Convert markdown to HTML
const bodyHtml = markdownToHtml(markdown);

// Create full HTML document with styling
const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>건축 관리 시스템 - 프로젝트 소개</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', '맑은 고딕', sans-serif;
      line-height: 1.8;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 3rem;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #667eea;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 4px solid #667eea;
      text-align: center;
    }

    h2 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #764ba2;
      margin-top: 3rem;
      margin-bottom: 1rem;
      padding-left: 1rem;
      border-left: 5px solid #764ba2;
    }

    h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #555;
      margin-top: 2rem;
      margin-bottom: 0.8rem;
    }

    p {
      margin-bottom: 1.2rem;
      line-height: 1.8;
      color: #555;
    }

    ul {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.8rem;
      line-height: 1.8;
      color: #555;
    }

    code {
      background: #f4f4f9;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.9em;
      color: #e83e8c;
    }

    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    pre code {
      background: none;
      padding: 0;
      color: #f8f8f2;
      font-size: 0.95em;
    }

    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    a:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    strong {
      font-weight: 700;
      color: #333;
    }

    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      margin: 2.5rem 0;
    }

    .emoji {
      font-size: 1.3em;
      margin-right: 0.3rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 2rem 1.5rem;
      }

      h1 {
        font-size: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      h3 {
        font-size: 1.2rem;
      }
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${bodyHtml}
  </div>
</body>
</html>
`;

// Write HTML file
fs.writeFileSync(outputFile, fullHtml, 'utf-8');

// Get file size
const stats = fs.statSync(outputFile);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log(`✅ HTML 생성 완료!`);
console.log(`   위치: ${outputFile}`);
console.log(`   크기: ${sizeKB} KB\n`);
