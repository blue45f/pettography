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
