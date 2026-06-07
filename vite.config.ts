/// <reference types="vitest/config" />
import path from 'path'

import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      // @pettography/shared 는 CJS(dist)로 빌드되는데, Vite 는 워크스페이스 패키지를
      // pre-bundle 하지 않아 `export *` 재노출 심볼의 ESM named import 가 깨진다(dev 화이트스크린).
      // TS 소스를 직접 가리켜 Vite 가 컴파일하게 해 dist CJS interop·stale-dist 문제를 원천 제거.
      // (백엔드는 package.json main(dist)을 그대로 사용하므로 영향 없음)
      '@pettography/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@features': path.resolve(__dirname, './src/features'),
      '@router': path.resolve(__dirname, './src/router'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/')) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor'
            }
            if (id.includes('node_modules/react-router')) {
              return 'router'
            }
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'query'
            }
            if (
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod')
            ) {
              return 'form'
            }
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n'
            }
            return 'vendor-libs'
          }
        },
      },
    },
  },
})
