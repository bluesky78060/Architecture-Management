# 건설 청구서 관리 시스템 프로젝트 개요

## 프로젝트 목적
건축업자가 건축주에게 작업 완료 후 청구서를 생성하고 관리하는 시스템

## 주요 기능
- 📊 **대시보드**: 청구서 현황 및 통계 확인
- 📄 **청구서 관리**: 청구서 생성, 수정, 삭제 및 PDF 다운로드
- 👥 **건축주 관리**: 건축주 정보 및 여러 작업장 관리
- 🔧 **작업 항목 관리**: 건축주별 작업 항목 관리 및 추적
- 🏗️ **작업장 정보**: 각 건축주별 여러 작업장 주소 관리

## 기술 스택
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Create React App + CRACO
- **Desktop App**: Electron
- **PDF Generation**: react-to-print, jsPDF
- **Excel/Data**: ExcelJS, XLSX
- **Testing**: Playwright (E2E)
- **UI Components**: Headless UI, Hero Icons
- **Performance**: Million.js (React 최적화)

## 플랫폼 지원
- **웹 애플리케이션**: 모든 현대 브라우저
- **데스크톱 앱**: Windows 10+, macOS 10.14+
- **모바일**: 반응형 디자인으로 모바일 지원