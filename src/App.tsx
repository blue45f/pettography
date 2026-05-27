import ErrorBoundary from '@components/common/ErrorBoundary'
import Loading from '@components/common/Loading'
import SkipLink from '@components/common/SkipLink'
import Footer from '@components/layout/Footer'
import Header from '@components/layout/Header'
import { Suspense } from 'react'
import { Outlet } from 'react-router'

import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <SkipLink />
      <Header />
      <main id="main-content" className={styles.main} role="main">
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

export default App
