import { useCallback, useSyncExternalStore } from 'react'

// jsdom(테스트)·일부 임베디드 WebView는 matchMedia가 없다 — 함수 존재까지 확인해야
// 이 훅을 쓰는 컴포넌트(Reveal 등)가 그런 환경에서 크래시하지 않는다.
const canMatchMedia = () =>
  typeof window !== 'undefined' && typeof globalThis.matchMedia === 'function'

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!canMatchMedia()) return () => {}
      const mediaQuery = globalThis.matchMedia(query)
      mediaQuery.addEventListener('change', notify)
      return () => {
        mediaQuery.removeEventListener('change', notify)
      }
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    if (!canMatchMedia()) return false
    return globalThis.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export default useMediaQuery
