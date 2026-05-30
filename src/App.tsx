import ErrorBoundary from '@components/common/ErrorBoundary'
import Loading from '@components/common/Loading'
import SkipLink from '@components/common/SkipLink'
import BottomNav from '@components/layout/BottomNav'
import Footer from '@components/layout/Footer'
import Header from '@components/layout/Header'
import SosFab from '@components/layout/SosFab'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

import styles from './App.module.css'

const CommandPalette = lazy(() => import('@components/layout/CommandPalette'))

function App() {
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={styles.app}>
      <SkipLink />
      <Header onOpenCommand={() => setCommandOpen(true)} />
      <main id="main-content" className={styles.main} role="main">
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <SosFab />
      <BottomNav />
      {commandOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setCommandOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default App
