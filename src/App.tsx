import ErrorBoundary from '@components/common/ErrorBoundary'
import Loading from '@components/common/Loading'
import RouteAnnouncer from '@components/common/RouteAnnouncer'
import SkipLink from '@components/common/SkipLink'
import { FeedbackWidget } from '@components/feedback/FeedbackWidget'
import BottomNav from '@components/layout/BottomNav'
import Footer from '@components/layout/Footer'
import Header from '@components/layout/Header'
import SosFab from '@components/layout/SosFab'
import { useOnboardingStore } from '@domains/onboarding'
import { lazyRetry } from '@utils/lazyRetry'
import { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

import styles from './App.module.css'

const CommandPalette = lazyRetry(() => import('@components/layout/CommandPalette'))

function App() {
  const [commandOpen, setCommandOpen] = useState(false)
  const category = useOnboardingStore((s) => s.profile.category)

  useEffect(() => {
    if (category) {
      document.documentElement.setAttribute('data-category', category)
    } else {
      document.documentElement.removeAttribute('data-category')
    }
  }, [category])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={styles.app}>
      <SkipLink />
      <RouteAnnouncer />
      <Header onOpenCommand={() => setCommandOpen(true)} />
      <main id="main-content" className={styles.main} role="main" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <SosFab />
      <BottomNav />
      {/* SurveyDesk 피드백 위젯 — VITE_SURVEYDESK_URL 미설정 시 렌더 안 함(현재 기본값). */}
      {import.meta.env.VITE_SURVEYDESK_URL && (
        <FeedbackWidget appId="pettography" endpoint={import.meta.env.VITE_SURVEYDESK_URL} />
      )}
      {commandOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setCommandOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default App
