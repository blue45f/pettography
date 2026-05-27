# 아키텍처 가이드

이 문서는 React Scaffolding 프로젝트의 현재 아키텍처와 확장 규칙을 설명합니다.

## 설계 원칙

1. **앱 조립과 기능 구현 분리** - Provider, QueryClient, Router는 `src/app`과 `src/router`에서 조립하고 페이지/기능 코드는 도메인별로 둡니다.
2. **서버 상태와 클라이언트 상태 분리** - 비동기 서버 상태는 TanStack Query, 사용자/테마 같은 클라이언트 상태는 Zustand가 담당합니다.
3. **Data Router 우선** - React Router 7의 Data Router 객체 라우팅과 route-level `lazy` module을 사용합니다.
4. **검증 가능한 스캐폴딩** - lint, typecheck, test, build, i18n 키 동기화, security audit을 스크립트와 Husky 훅으로 고정합니다.
5. **점진적 확장** - 기능이 커질 때 `features/<domain>` 안에 schema, api, queries, store를 함께 배치합니다.

## 디렉토리 구조

```
src/
├── app/             앱 조립 계층 (AppProviders, QueryClient factory)
├── assets/          정적 자원 및 글로벌 스타일
├── components/      재사용 가능한 UI 컴포넌트
│   ├── common/      범용 컴포넌트
│   └── layout/      레이아웃 컴포넌트
├── features/        도메인 모듈 (예: todos)
├── hooks/           커스텀 React 훅
├── i18n/            i18next 설정, 로케일, 키 동기화 테스트
├── pages/           라우트 단위 화면 컴포넌트
├── router/          Data Router route object 정의
├── services/        범용 API 클라이언트
├── store/           Zustand 기반 앱 전역 상태
├── test/            Vitest setup
├── types/           공유 타입
└── utils/           순수 유틸리티
```

## 앱 부트스트랩

`main.tsx`는 DOM mount와 `StrictMode`만 담당합니다. 실제 앱 조립은 `src/app/AppProviders.tsx`에 모읍니다.

```
main.tsx
  └─ AppProviders
      ├─ QueryClientProvider
      ├─ ToastProvider
      ├─ RouterProvider
      └─ ReactQueryDevtools (DEV only)
```

TanStack Query의 `QueryClient`는 `src/app/queryClient.ts`에서 factory와 브라우저용 singleton을 함께 제공합니다. 테스트나 Storybook에서 별도 client가 필요하면 `createAppQueryClient()`를 사용합니다.

## 라우팅

라우팅은 `createBrowserRouter(routes)` 기반입니다. 페이지 컴포넌트는 Data Router의 `lazy` route module로 동적 import합니다.

```tsx
export const routes = [
  {
    path: '/',
    Component: App,
    ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: lazyPage(() => import('@pages/Home')) },
      { path: 'about', lazy: lazyPage(() => import('@pages/About')) },
    ],
  },
]
```

새 페이지를 추가할 때는 `src/pages/NewPage/`를 만들고 `src/router/index.tsx`의 children에 lazy route를 추가합니다. 경로 매칭에 필요한 `path`, `index`, `children`은 정적으로 정의하고, 화면 구현만 lazy로 분리합니다.

## 상태 관리

### 서버 상태

TanStack Query를 사용합니다. query key, query hook, mutation hook은 가능하면 `features/<domain>/queries.ts`에 둡니다.

### 클라이언트 상태

Zustand를 사용합니다. 현재 `src/store/index.tsx`는 테마, 사용자, 인증 상태를 localStorage에 persist합니다. 도메인 전용 UI 상태는 해당 feature 안의 작은 store로 분리합니다.

## i18n

i18next와 react-i18next를 사용합니다.

- `src/i18n/locales/ko.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales.test.ts`

로케일 키가 어긋나면 `pnpm test:i18n`과 전체 테스트에서 실패합니다. 새 문구를 추가할 때는 모든 지원 언어에 같은 키를 추가해야 합니다.

## 품질 게이트

| 단계           | 명령                               | 목적                                               |
| -------------- | ---------------------------------- | -------------------------------------------------- |
| pre-commit     | `pnpm exec lint-staged`            | staged 파일 자동 lint/format                       |
| commit-msg     | `pnpm exec commitlint --edit "$1"` | Conventional Commit 강제                           |
| pre-push       | `pnpm verify:push`                 | 포맷, lint, typecheck, test, build, security audit |
| 수동 전체 검증 | `pnpm verify`                      | 로컬 릴리스 전 기본 검증                           |
| 보안 검증      | `pnpm lint:security`               | ESLint 보안 규칙과 dependency audit                |

## 빌드 파이프라인

```
TypeScript 타입 체크
  → Vite/Rolldown 프로덕션 빌드
  → CSS Modules 해시 클래스 생성
  → route/component 코드 스플리팅
  → vendor/router/query/form/i18n 청크 분리
  → dist/ 정적 파일 출력
```

React Compiler preset은 Vite 설정에서 Babel plugin으로 연결되어 있습니다. 관련 정적 검사는 ESLint의 `react-compiler/react-compiler` 규칙으로 수행합니다.
