/// <reference types="vitest/config" />
import path from 'path'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      // @pettography/shared 는 CJS(dist)로 빌드되는데, Vite 는 워크스페이스 패키지를
      // pre-bundle 하지 않아 `export *` 재노출 심볼의 ESM named import 가 깨진다(dev 화이트스크린).
      // TS 소스를 직접 가리켜 Vite 가 컴파일하게 해 dist CJS interop·stale-dist 문제를 원천 제거.
      // (백엔드는 package.json main(dist)을 그대로 사용하므로 영향 없음)
      '@pettography/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
      // @heejun/deskcloud 는 socket.io-client 를 *선택적* peer(realtime/chat 의 동적
      // import)로만 참조한다. 이 앱은 그 클라이언트를 쓰지 않아 미설치 상태인데, Vite
      // dev dep-optimizer 가 그 bare import 를 해석하려다 실패한다. 가벼운 스텁으로
      // 별칭해 dev 해석을 통과시킨다(스텁은 호출 시 명시적으로 실패; 미사용이라
      // 프로덕션 빌드에선 트리셰이크로 제거됨).
      'socket.io-client': path.resolve(__dirname, './src/infrastructure/socket-io-client-stub.ts'),
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@domains': path.resolve(__dirname, './src/domains'),
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
