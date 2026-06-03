import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

/**
 * useRouteAnnouncer — 라우트 전환 시 (1) 스크린리더용 announce 메시지를 만들고
 * (2) 본문 포커스를 재설정하며 (3) 스크롤을 상단으로 올린다.
 *
 * - 최초 렌더(첫 진입)는 announce/포커스 이동을 건너뛴다. 일반 페이지 로드처럼
 *   동작해야 하고, 자동 포커스 이동은 오히려 혼란을 주기 때문이다.
 * - announce 메시지는 페이지가 useDocumentTitle 로 설정한 document.title 을 사용한다.
 *   라우트 컴포넌트가 비동기로 제목을 갱신할 수 있으므로 다음 프레임에서 읽는다.
 * - prefers-reduced-motion 을 존중해 부드러운 스크롤을 비활성화한다.
 *
 * @returns aria-live 영역에 렌더할 announce 메시지 문자열
 */
function useRouteAnnouncer(): string {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // 라우트 컴포넌트가 useDocumentTitle 로 제목을 갱신할 시간을 한 프레임 준다.
    const frame = requestAnimationFrame(() => {
      const title = document.title.trim()
      setMessage(title ? t('a11y.navigatedTo', { title }) : t('a11y.pageChanged'))

      // 본문으로 포커스를 옮겨 키보드/스크린리더 사용자가 새 콘텐츠로 진입하게 한다.
      const main = document.getElementById('main-content')
      if (main) {
        main.focus({ preventScroll: true })
      }

      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    })

    return () => cancelAnimationFrame(frame)
  }, [pathname, t])

  return message
}

export default useRouteAnnouncer
