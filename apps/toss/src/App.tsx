import { useEffect, useRef, useState } from 'react'

import IntroSplashScreen from './components/IntroSplashScreen.tsx'
import { PawBurstLayer } from './components/PawBurst.tsx'
import { TabBar } from './components/TabBar.tsx'
import { registerNavigation } from './lib/ads'
import { initAppStore } from './lib/store'
import { ChecklistPage } from './pages/ChecklistPage.tsx'
import { ComparePage } from './pages/ComparePage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LibraryPage } from './pages/LibraryPage.tsx'
import { SpeciesDetailPage } from './pages/SpeciesDetailPage.tsx'
import { SpeciesListPage } from './pages/SpeciesListPage.tsx'
import { useHashPath, splitHashPath, isTabPath, routeDepth } from './router'

function renderScreen(pathname: string, params: URLSearchParams) {
  const detail = pathname.match(/^\/species\/(.+)$/)
  if (detail) return <SpeciesDetailPage slug={decodeURIComponent(detail[1])} />
  switch (pathname) {
    case '/species':
      return <SpeciesListPage initialCategory={params.get('cat') ?? undefined} />
    case '/compare':
      return (
        <ComparePage
          initialA={params.get('a') ?? undefined}
          initialB={params.get('b') ?? undefined}
        />
      )
    case '/checklist':
      return <ChecklistPage />
    case '/library':
      return <LibraryPage />
    default:
      return <HomePage />
  }
}

export function App() {
  const rawPath = useHashPath()
  const { pathname, params } = splitHashPath(rawPath)

  // 진입 시 토스 익명키 해석 → 사용자별 즐겨찾기/체크리스트 복원(실패 시 guest 폴백)
  useEffect(() => {
    void initAppStore()
  }, [])

  // 전환 애니메이션 방향 — 렌더 중 파생 상태 조정 패턴(이전 경로 대비 깊이 비교)
  const [nav, setNav] = useState({ raw: rawPath, anim: '' })
  if (nav.raw !== rawPath) {
    const prevDepth = routeDepth(splitHashPath(nav.raw).pathname)
    const nextDepth = routeDepth(pathname)
    const anim =
      nextDepth > prevDepth ? 'screen-push' : nextDepth < prevDepth ? 'screen-pop' : 'screen-tab'
    setNav({ raw: rawPath, anim })
  }

  // 화면 전환 트래킹(전면형 광고 게이트·스크롤 초기화) — 초기 진입은 제외
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    registerNavigation()
    window.scrollTo(0, 0)
  }, [rawPath])

  return (
    <>
      <IntroSplashScreen />
      <div key={nav.raw} className={nav.anim || undefined}>
        {renderScreen(pathname, params)}
      </div>
      {isTabPath(pathname) && <TabBar active={pathname} />}
      <PawBurstLayer />
    </>
  )
}
