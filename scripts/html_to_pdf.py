#!/usr/bin/env python3
"""
HTML to PDF Converter using WeasyPrint
Converts user-guide.html to PDF with proper Korean font support
"""

import sys
import os
from pathlib import Path

def check_weasyprint():
    """Check if weasyprint is installed"""
    try:
        import weasyprint
        return True
    except ImportError:
        return False

def install_weasyprint():
    """Install weasyprint if not available"""
    print("📦 Installing weasyprint...")
    import subprocess
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "weasyprint"], check=True)
        print("✅ weasyprint installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install weasyprint")
        return False

def convert_html_to_pdf(input_file, output_file=None):
    """Convert HTML file to PDF"""
    from weasyprint import HTML, CSS

    if output_file is None:
        output_file = Path(input_file).with_suffix('.pdf')

    print(f"📄 Converting HTML to PDF...")
    print(f"  입력: {input_file}")
    print(f"  출력: {output_file}")

    try:
        # Custom CSS for Korean font support and styling
        custom_css = CSS(string='''
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                font-family: "Apple SD Gothic Neo", "Malgun Gothic", "Nanum Gothic", Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #2c3e50;
                page-break-after: avoid;
            }
            h1 {
                font-size: 24pt;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }
            h2 {
                font-size: 20pt;
                margin-top: 20px;
            }
            h3 {
                font-size: 16pt;
            }
            code, pre {
                font-family: "Monaco", "Courier New", monospace;
                background-color: #f5f5f5;
                padding: 2px 5px;
                border-radius: 3px;
            }
            pre {
                padding: 10px;
                overflow-x: auto;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 10px 0;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #3498db;
                color: white;
            }
            .highlight-box, .warning-box {
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
                page-break-inside: avoid;
            }
            .highlight-box {
                background-color: #e8f4f8;
                border-left: 4px solid #3498db;
            }
            .warning-box {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
            }
            img {
                max-width: 100%;
                height: auto;
            }
        ''')

        # Convert HTML to PDF
        HTML(filename=str(input_file)).write_pdf(
            str(output_file),
            stylesheets=[custom_css]
        )

        # Get file size
        size_mb = Path(output_file).stat().st_size / (1024 * 1024)

        print(f"\n✅ PDF 생성 완료!")
        print(f"  위치: {output_file}")
        print(f"  크기: {size_mb:.2f} MB")

        return True

    except Exception as e:
        print(f"\n❌ PDF 생성 실패: {e}")
        return False

def main():
    """Main function"""
    # Check if weasyprint is installed
    if not check_weasyprint():
        print("⚠️  weasyprint가 설치되어 있지 않습니다.")
        install = input("지금 설치하시겠습니까? (y/n): ")
        if install.lower() == 'y':
            if not install_weasyprint():
                sys.exit(1)
        else:
            print("❌ weasyprint 없이는 PDF를 생성할 수 없습니다.")
            sys.exit(1)

    # Get input file
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        # Default to user-guide.html in public folder
        input_file = "public/user-guide.html"

    # Get output file
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        output_file = "user-guide.pdf"

    # Check if input file exists
    if not Path(input_file).exists():
        print(f"❌ 입력 파일을 찾을 수 없습니다: {input_file}")
        sys.exit(1)

    # Convert
    success = convert_html_to_pdf(input_file, output_file)

    if success:
        print(f"\n🎉 성공적으로 PDF가 생성되었습니다!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
