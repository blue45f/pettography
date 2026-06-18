import { base, react, plugin, boundaries, defineConfig } from '@heejun/eslint-config'
import { globalIgnores } from 'eslint/config'
import security from 'eslint-plugin-security'
import vitest from '@vitest/eslint-plugin'
import globals from 'globals'

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/storybook-static/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/node_modules/**',
    '.husky',
    '**/*.tsbuildinfo',
    // backend/ 는 자체 eslint.config.mjs 를 가진다 — 루트 설정 대상 아님.
    'backend',
    'apps/toss',
    '.claude',
    // DeskCloud 위젯은 외부 온보딩형 single-file 벤더 위젯(소스 무수정 원칙)이라
    // 레포 strict 린트 대상에서 제외한다.
    '**/components/deskcloud/**',
  ]),

  // 공유 베이스(TS + import 위생 + 커스텀 규칙 + prettier 충돌 비활성).
  base({ files: ['**/*.{ts,tsx}'] }),

  // 루트 src/ — React 19 + Vite + RC + jsx-a11y.
  react({ files: ['src/**/*.{ts,tsx}'] }),

  // heejun 개인 테스트/목 컨벤션 규칙은 비활성 — 횡단 일관성 대상이 아니라
  // pettography 자체 테스트 스타일(vitest)과 충돌한다(shared base 의 일반 규칙만 채택).
  {
    plugins: { '@heejun': plugin },
    rules: {
      '@heejun/vitest-mock-import': 'off',
      '@heejun/vitest-mock-import-original': 'off',
      '@heejun/mock-response-naming': 'off',
      '@heejun/no-js-interface-direct-access': 'off',
    },
  },

  // 보안 규칙(eslint-plugin-security) — 전 TS 파일.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      // 정적 인덱스 접근 위주라 오탐이 많다.
      'security/detect-object-injection': 'off',
    },
  },

  // 레포 정책: 네이티브 globalThis.confirm/alert/prompt 금지 — Modal/Toast 등 브랜드 UI를 쓴다.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'confirm',
          message: '브랜드 확인 다이얼로그를 사용하세요 (globalThis.confirm 금지).',
        },
        { name: 'alert', message: 'Toast/Modal을 사용하세요 (globalThis.alert 금지).' },
        { name: 'prompt', message: '입력 다이얼로그/폼을 사용하세요 (globalThis.prompt 금지).' },
      ],
    },
  },

  // 라우트 테이블은 routes/router 상수 + lazy 컴포넌트 혼재라 fast-refresh 제약 완화.
  {
    files: ['src/router/index.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // 계층 경계 — 개발가이드의 app/domains/shared/infrastructure 4계층.
  // components/hooks/utils/store/config/i18n/types/assets 는 물리적으로 옮기지 않고
  // shared 로 매핑한다. files 를 src/** 로 한정해 backend/ 에는 적용하지 않는다.
  ...boundaries({
    files: ['src/**/*.{ts,tsx}'],
    elements: [
      { type: 'app', pattern: 'src/{app,router,pages}/**/*', mode: 'full' },
      { type: 'app', pattern: 'src/{App,main}.tsx', mode: 'full' },
      { type: 'domains', pattern: 'src/domains/*/**/*', mode: 'full' },
      {
        type: 'shared',
        pattern: 'src/{components,hooks,utils,store,config,i18n,types,assets}/**/*',
        mode: 'full',
      },
      { type: 'infrastructure', pattern: 'src/infrastructure/**/*', mode: 'full' },
    ],
    rules: [
      { from: ['app'], allow: ['app', 'domains', 'shared', 'infrastructure'] },
      { from: ['domains'], allow: ['domains', 'shared', 'infrastructure'] },
      { from: ['infrastructure'], allow: ['shared', 'infrastructure'] },
      { from: ['shared'], allow: ['shared'] },
    ],
  }),
  // boundaries 는 TS 임포트를 분류하려면 리졸버가 필요하다(없으면 조용히 no-op).
  {
    files: ['src/**/*.{ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: 'tsconfig.json' }, node: true },
    },
  },
  // 기술부채 완화(차기 패스에서 도메인으로 이동 예정): components/ 아래 일부 파일은
  // 사실상 도메인 결합 피처 컴포넌트라 domains 를 직접 import 한다 — PetBadge·
  // PetSwitcher(onboarding/species), KakaoMap(map), AttachmentGallery/Picker
  // (attachments), AdminGate(auth), Header/AlertBell/BottomNav/CommandPalette
  // (onboarding/species/alerts). 이들은 앱 전역에서 쓰이는 공용 빌딩블록이라
  // 물리 이동이 대규모 리팩터라 이번 패스 범위 밖이다. 나머지 순수 shared
  // (components 의 그 외·utils·store·config·i18n·types·assets)는 strict 강제.
  {
    files: [
      'src/components/common/{KakaoMap,PetBadge,AttachmentGallery,AttachmentPicker}/**/*.{ts,tsx}',
      'src/components/layout/{PetSwitcher,AdminGate,BottomNav,CommandPalette,Header}/**/*.{ts,tsx}',
    ],
    rules: { 'boundaries/element-types': 'off' },
  },
  // hooks/ 는 대체로 순수 shared 지만, useAggregatedAlerts 는 케어 도메인 ~13개를
  // 가로질러 알림을 집계하는 크로스도메인 훅이고 useFetch 는 infrastructure(api
  // 클라이언트)를 오케스트레이션한다. 이 둘(+테스트)만 의도적으로 완화하고 그 외
  // 순수 훅은 strict 를 유지한다.
  {
    files: ['src/hooks/{useAggregatedAlerts,useFetch,buildAlerts}{,.test}.{ts,tsx}'],
    rules: { 'boundaries/element-types': 'off' },
  },

  // 테스트 — Vitest globals; fast-refresh 제약 완화 + security 정규식 오탐 비활성.
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    plugins: { vitest },
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-conditional-expect': 'off',
      'security/detect-non-literal-regexp': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  // e2e(playwright) — fast-refresh 제약 비대상.
  {
    files: ['e2e/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  }
)
