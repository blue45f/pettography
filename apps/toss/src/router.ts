import { useEffect, useState } from 'react'

/** 해시 라우트 원본(예: "/species?cat=파충류"). */
export function useHashPath(): string {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export const navigate = (to: string) => {
  window.location.hash = to
}

/** "/species?cat=x" → { pathname: "/species", params }. */
export function splitHashPath(raw: string): { pathname: string; params: URLSearchParams } {
  const queryIndex = raw.indexOf('?')
  if (queryIndex === -1) return { pathname: raw, params: new URLSearchParams() }
  return {
    pathname: raw.slice(0, queryIndex),
    params: new URLSearchParams(raw.slice(queryIndex + 1)),
  }
}

/** 하단 탭이 노출되는 최상위 라우트. */
export const TAB_PATHS = ['/', '/species', '/checklist', '/library'] as const

export function isTabPath(pathname: string): boolean {
  return (TAB_PATHS as readonly string[]).includes(pathname)
}

/** 화면 깊이 — 전환 애니메이션 방향 계산용(탭=0, 상세/비교=1). */
export function routeDepth(pathname: string): number {
  return isTabPath(pathname) ? 0 : 1
}
