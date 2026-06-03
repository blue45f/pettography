# pettography Development Guide

## 개요

이 프로젝트는 아키텍처 문서 정합성, 코드 변경 범위, CI 게이트를 함께 관리합니다.

## 필수 검증 흐름

- 아키텍처 문서 점검을 선행합니다.
- 타입/린트/테스트/빌드 검증을 완료합니다.
- PR 병합 전 증적을 남깁니다.

## 최소 실행 커맨드

- `pnpm run dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run verify`
- `pnpm run ci`

## 아키텍처 변경 규칙

1. 도메인 경계와 공유 타입 계약 변경은 `docs/ARCHITECTURE.md`에서 먼저 반영합니다.
2. 계약 변경이 API/스키마에 영향을 주면 문서와 테스트 계획을 함께 갱신합니다.
3. `pnpm run verify`는 `validate:architecture`가 선행된 상태여야 합니다.

## 접근성 (a11y) 패턴

SPA 라우트 전환은 전체 페이지 리로드가 없어 보조기술 사용자가 페이지 변경을 인지하기
어렵습니다. 아래 두 계층으로 이를 보완합니다.

### 라우트 전환 announce + 포커스 관리

- `src/hooks/useRouteAnnouncer.ts` — `useLocation` 변경을 감지해 (1) `document.title`(각 페이지가
  `useDocumentTitle` 로 설정)을 `role="status"` `aria-live="polite"` 영역에 announce 하고,
  (2) 본문 랜드마크(`#main-content`)로 포커스를 이동시키며, (3) 상단으로 스크롤합니다.
  최초 진입(첫 렌더)은 일반 페이지 로드처럼 동작하도록 건너뜁니다. `prefers-reduced-motion`
  을 존중합니다.
- `src/components/common/RouteAnnouncer/` — 위 훅을 감싸는 비시각(`.sr-only`) live 영역 컴포넌트.
  `src/App.tsx` 에서 `<SkipLink />` 바로 뒤에 한 번 마운트하며, `<main id="main-content">` 에는
  `tabIndex={-1}` 을 부여해 프로그램적 포커스를 받습니다(탭 순서에는 추가되지 않음).
- announce 문구는 i18n `a11y.navigatedTo` / `a11y.pageChanged` 키(ko/en/ja)로 관리합니다.

기존 정적 a11y(스킵 링크, `role="main"` 랜드마크, 네비게이션 `aria-current`/`aria-expanded`,
`.sr-only` 유틸)는 그대로 유지됩니다. 새 페이지를 추가할 때는 `useDocumentTitle` 로 의미 있는
제목을 설정하면 announce 문구가 자동으로 정확해집니다.

### 다크 모드 무깜빡임(no-FOUC) 부트스트랩

- 테마 토큰/토글/`useTheme` 훅은 이미 존재하나, `data-theme` 를 마운트 후 effect 에서 설정하면
  다크모드 사용자에게 첫 페인트 깜빡임(FOUC)이 발생합니다.
- `index.html` `<head>` 의 인라인 스크립트가 페인트 전에 `localStorage['app-store']`
  (zustand persist, `{state:{theme}}`) → 없으면 `prefers-color-scheme` 순으로 테마를 확정해
  `documentElement.dataset.theme` 를 설정합니다. 저장 형식은 `src/hooks/useTheme.ts` 와 일치해야
  합니다(persist 키/구조 변경 시 인라인 스크립트도 함께 갱신).

## PR 체크리스트

- 변경 범위 요약
- 영향 받는 도메인
- 실행한 검증 명령어 및 결과
- 회귀 확인 항목
