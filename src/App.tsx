import ErrorBoundary from '@components/common/ErrorBoundary'
import Loading from '@components/common/Loading'
import RouteAnnouncer from '@components/common/RouteAnnouncer'
import SkipLink from '@components/common/SkipLink'
import { DeskHub } from '@components/deskcloud/DeskHub'
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
  const [showSplash, setShowSplash] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const category = useOnboardingStore((s) => s.profile.category)

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 1800)

    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

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
      {showSplash && (
        <div className={`${styles.splashOverlay} ${isFading ? styles.hidden : ''}`} aria-hidden="true">
          <div className={styles.splashCircle} />
          <div className={styles.splashContent}>
            <svg className={styles.splashLogo} viewBox="0 0 24 24" fill="currentColor">
              {/* Central pad */}
              <path d="M12 10.5c-2.2 0-4 1.8-3.5 4.5.4 2.2 3.5 3 3.5 3s3.1-.8 3.5-3c.5-2.7-1.3-4.5-3.5-4.5z" />
              {/* Toes */}
              <circle cx="8.5" cy="6.5" r="1.8" />
              <circle cx="15.5" cy="6.5" r="1.8" />
              <circle cx="5" cy="9.5" r="1.8" />
              <circle cx="19" cy="9.5" r="1.8" />
            </svg>
            <h1 className={styles.splashTitle}>PETTOGRAPHY</h1>
            <div className={styles.splashLine} />
            <span className={styles.splashSubtitle}>BETA SERVICE</span>
          </div>
        </div>
      )}
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
      {/* DeskCloud 네이티브 통합 — 활성 Desk(VITE_<DESK>DESK_URL 설정분)만 허브에 노출.
          위젯 임베드 대신 발행된 SDK(@heejun/deskcloud)를 쓰고 앱 토큰으로 렌더한다.
          활성 Desk 가 없으면 아무것도 렌더하지 않는다(기본값=완전 비활성·가역적). */}
      <DeskHub />
      {commandOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setCommandOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default App
