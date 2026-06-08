import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import AppProviders from '@/app/AppProviders'

import '@assets/styles/global.css'
import '@/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err)
    })
  })
}
