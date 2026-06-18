import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import AppProviders from '@/app/AppProviders'
import { validateFrontendEnv } from '@/config/env'

import '@assets/styles/tailwind.css'
import '@assets/styles/global.css'
import '@/i18n'

// 환경변수 비차단 검증 — 잘못된 VITE_* 값을 콘솔 경고로만 드러낸다(앱 시작 안 깸).
validateFrontendEnv()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err)
    })
  })
}
