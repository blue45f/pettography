import { base, react, plugin, defineConfig } from '@heejun/eslint-config'
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
    '.claude',
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

  // 레포 정책: 네이티브 window.confirm/alert/prompt 금지 — Modal/Toast 등 브랜드 UI를 쓴다.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: '브랜드 확인 다이얼로그를 사용하세요 (window.confirm 금지).' },
        { name: 'alert', message: 'Toast/Modal을 사용하세요 (window.alert 금지).' },
        { name: 'prompt', message: '입력 다이얼로그/폼을 사용하세요 (window.prompt 금지).' },
      ],
    },
  },

  // 라우트 테이블은 routes/router 상수 + lazy 컴포넌트 혼재라 fast-refresh 제약 완화.
  {
    files: ['src/router/index.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
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
  },
)
