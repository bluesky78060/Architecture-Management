# Repository Guidelines

This document guides contributors working in this repository.

## Project Structure & Module Organization
- Source: `src/`
  - Pages (routes): `src/pages/*`
  - Components: `src/components/*`
  - State/contexts: `src/contexts/*`
  - Utilities: `src/utils/*`
  - Services/API: `src/services/*`
- Public assets: `public/` (HTML templates like `invoice-output.html`, `quotation-output.html`, images)
- Fonts: `font/` (SCDream1–9 OTF family)
- Build output: `build/`
- Tests: `tests/` and colocated `*.test.*`

## Build, Test, and Development Commands
- Install: `npm install` — install dependencies.
- Dev server: `npm start` — run CRA dev server with CRACO.
- Build: `npm run build` — optimized production build to `build/`.
- Test (watch): `npm test` — run Jest tests.
- Electron (dev): `npm run electron-dev` — launch desktop shell.
- Package desktop: `npm run dist-win | dist-mac | dist-all`.

## Coding Style & Naming Conventions
- Language: React 18, TypeScript preferred (`.tsx`), JS allowed.
- Indentation: 2 spaces. Keep diffs minimal; avoid noisy reformatting.
- Components: PascalCase (e.g., `ClientList.tsx`), hooks `use*`.
- Styling: Tailwind utility classes; prefer class utilities over custom CSS.
- Linting: CRA defaults (`react-app`).
- Fonts: global `SCDream` family mapped to weights 100–900 via `@font-face` in `src/index.css`.

## Testing Guidelines
- Framework: Jest (via CRA).
- Location: colocate with source or under `tests/`.
- Names: `*.test.tsx|ts|js`.
- Run CI-safe: `CI=true npm test`.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits.
  - Examples: `feat(invoices): add print button`, `fix(work-items): tighten column widths`.
- PRs must include: purpose/summary, key changes, screenshots for UI, and linked issues.
- Keep PRs focused; avoid mixing refactors with features.

## Security & Configuration Tips
- Data persists in `localStorage`; provide backup/export UI for users.
- Routing base path honors `REACT_APP_BASE_PATH`; hash router via `REACT_APP_USE_HASH_ROUTER=1` when needed.
- Printing: output templates live under `public/` and are opened with query data; keep template design stable.

---

## Codex 작업 규칙

이 저장소에서 Codex 에이전트가 작업할 때 반드시 준수해야 할 운영 규칙입니다.

- 오류 발견 시: 즉시 자체 수정하지 말고, 오류 증상/원인 추정/영향 범위를 사용자에게 먼저 보고합니다.
- 수정 승인: 사용자가 명시적으로 수정을 요청하거나 승인을 제공한 경우에만 코드 변경을 수행합니다.
- 자율 수정 금지: 오류나 문제점을 발견해도 사용자 승인 없이 임의로 수정하거나 리팩터링하지 않습니다.
- 투명성 원칙: 발견한 모든 오류와 위험 요인을 숨기지 않고 명확한 근거와 함께 보고합니다.

---

## 롤백 체크포인트 코덱스 (Rollback-codex)

[역할]
당신은 시니어 릴리즈 엔지니어입니다.
로컬 프로젝트 폴더를 스캔하여 최근 수정된 파일만 찾아내고, 변경된 코드 부분을 포함하여 롤백 가능한 마크다운 체크포인트 문서를 작성합니다.
현제 백업은 프로젝트 파일을 통째로 백업하는 방식으로 시간과 용량 부담이 큽니다. 통째 백업이 아닌 수정된 파일과 그 변경 내용을 정리한 파일만으로, 추후 심각한 오류 발생 시 오류 발생 전으로 롤백할 수 있는 체크포인트 문서를 생성합니다. git 커밋처럼 보안·수정된 내용을 백업해 프로젝트 전체를 포기하는 사태를 방지합니다.

[목표]
- 전체 프로젝트가 아니라, 최근에 수정된 파일만 정리합니다.
- 파일 경로, 변경된 코드, 변경 이유를 AI가 직접 채워 넣습니다.
- 롤백할 때 필요한 정보(복원 방법, 테스트 방법)도 포함합니다.

[작업 절차]
1) 지정된 프로젝트 경로 {PROJECT_PATH} 를 탐색합니다.
2) 최근 수정된 파일만 골라냅니다.
   - 기준: 파일 수정 시간(예: 최근 24시간, 또는 사용자가 지정한 기간)
   - 또는 기준: 마지막 체크포인트 파일 이후 변경된 파일
3) 각 파일을 분석하여 변경된 부분(추가/삭제/수정된 코드)을 추출합니다.
   - 큰 파일은 핵심 변경 부분만 발췌
   - 불필요한 빌드 아티팩트/리소스는 제외 (.log, .tmp, node_modules 등)
4) 변경 이유와 맥락을 코드/주석/파일명으로 추론하여 작성합니다.
   - 예: 로그인 함수 수정 → "로그인 버그 수정"
   - config 파일 변경 → "API URL 교체"
5) 체크포인트 마크다운 문서를 다음 형식으로 출력합니다.
6) "체크포인트"라는 프롬프트를 트리거로 해서 문서 작성.
7) 체크포인트 마크다운 문서를 작성할 때 변경된 파일도 같이 백업 저장:
   - `/Users/leechanhee/backup_checkpoints`에 저장되어 있는 폴더 및 파일 형식으로 저장
   - `/Users/leechanhee/backup_checkpoints/checkpoint_back/` 폴더는 미러링 폴더
   - 마크다운 파일명과 같은 폴더를 생성하고, 거기에 마크다운 파일과 수정된 파일도 저장
   - 추가로 `/Users/leechanhee/backup_checkpoints/checkpoint_back/` 폴더의 같은 경로에도 수정된 파일들을 자동 복사
   - `checkpoint_back` 폴더는 항상 최신 상태로 유지하여 전체 프로젝트 백업 역할 수행
8) AGENTS.md 파일 자동 업데이트 규칙:
   - 체크포인트 생성 시 자동으로 AGENTS.md에 기록
   - 최신 3개 기록만 유지 (자동 회전 정책)
   - 3회차 이전 내용은 자동 삭제 또는 요약 보관
   - 이전 기록은 축약 형태로 보관, 새로운 기록은 정식 상세 형태로 기록

[출력 형식]
```
# 체크포인트: {CHANGE_ID}
- 생성일시: {NOW_YYYY-MM-DD HH:mm}
- 프로젝트 경로: {PROJECT_PATH}
- 수정된 파일 수: {COUNT}

## 1. 요약
- 의도: (AI가 추론한 한 문장)
- 변경 배경: (추론된 이유 불릿)
- 범위: (수정된 모듈/기능)
- 위험도: (AI가 코드 영향도 기반으로 추론)

## 2. 변경된 파일 목록
| 파일 경로 | 상태 | 설명 |
|-----------|------|------|
| `...`     | 수정 | (AI 추론한 설명) |

## 3. 핵심 변경 내용
### {PATH/TO/FILE}
```diff
# AI가 추출한 변경된 부분만 발췌
```

## 4. 복원 방법
- 각 파일을 체크포인트 사본으로 교체하거나, 변경 블록을 역적용(diff -R)합니다.

## 5. 테스트 방법
- 관련 유닛/통합 테스트 실행 지침 또는 수동 확인 절차를 기재합니다.
```

[단순 규칙 적용(권장)]
- 체크포인트 생성 시 자동으로:
  1. 백업 생성
  2. AGENTS.md 기록 추가
  3. 3개 이상이면 오래된 것 정리

---

## Checkpoints Log

- CHK-2025-10-01-01 — 2025-10-01 11:28 — 2 files (src/components/WorkItems.js, AGENTS.md)
