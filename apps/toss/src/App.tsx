import { SpeciesDetailPage } from './pages/SpeciesDetailPage.tsx'
import { SpeciesListPage } from './pages/SpeciesListPage.tsx'
import { useHashPath } from './router'
import IntroSplashScreen from './components/IntroSplashScreen.tsx'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/species\/(.+)$/)
  const content = m ? (
    <SpeciesDetailPage slug={decodeURIComponent(m[1])} />
  ) : (
    <SpeciesListPage />
  )

  return (
    <>
      <IntroSplashScreen />
      {content}
    </>
  )
}
