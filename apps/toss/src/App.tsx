import { SpeciesDetailPage } from './pages/SpeciesDetailPage.tsx'
import { SpeciesListPage } from './pages/SpeciesListPage.tsx'
import { useHashPath } from './router'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/species\/(.+)$/)
  if (m) return <SpeciesDetailPage slug={decodeURIComponent(m[1])} />
  return <SpeciesListPage />
}
