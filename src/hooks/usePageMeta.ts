import { useEffect, useRef } from 'react'

const SITE_URL = 'https://pettography.vercel.app'

export interface PageMeta {
  /** document.title 에 그대로 들어가는 페이지 제목 (이미 ` · 사이트명` 포함된 전체 문자열로 넘겨도 됨). */
  title: string
  /** og:description / twitter:description / meta[name=description] 에 쓰는 한 줄 설명. 생략 시 정적 기본값 유지. */
  description?: string
  /**
   * canonical/og:url 의 절대 경로. 생략하면 현재 location.pathname 으로 자동 생성.
   * 예: '/species' → https://pettography.vercel.app/species
   */
  path?: string
}

/** name= 또는 property= 메타 태그의 content 를 읽는다. */
function readMeta(selector: string): string | null {
  return document.querySelector<HTMLMetaElement>(selector)?.content ?? null
}

/** name= 또는 property= 메타 태그의 content 를 쓴다. 태그가 없으면 무시(정적 head 에 항상 존재). */
function writeMeta(selector: string, value: string): void {
  const el = document.querySelector<HTMLMetaElement>(selector)
  if (el) el.content = value
}

function readLink(selector: string): string | null {
  return document.querySelector<HTMLLinkElement>(selector)?.href ?? null
}

function writeLink(selector: string, value: string): void {
  const el = document.querySelector<HTMLLinkElement>(selector)
  if (el) el.href = value
}

/**
 * 라우트별 document.title + OG/Twitter/canonical 메타를 선언적으로 세팅한다.
 * 언마운트 시 index.html 의 정적 기본값으로 복원해, SPA 클라이언트 내비게이션에서
 * 이전 페이지 메타가 남지 않게 한다. (외부 의존성 없는 네이티브 useEffect 훅)
 *
 * 정적 head 에 미리 박혀 있어야 하는 태그:
 *   <title>, meta[name=description], link[rel=canonical],
 *   og:title/og:description/og:url, twitter:title/twitter:description
 *
 * @example
 *   usePageMeta({
 *     title: `${t('species.catalogTitle')} · Pettography`,
 *     description: t('species.catalogSubtitle'),
 *     path: '/species',
 *   })
 */
export default function usePageMeta({ title, description, path }: PageMeta): void {
  // 첫 마운트 시점의 정적 기본값을 스냅샷 — 언마운트 때 그대로 되돌린다.
  const defaults = useRef<{
    title: string
    description: string | null
    canonical: string | null
    ogTitle: string | null
    ogDescription: string | null
    ogUrl: string | null
    twitterTitle: string | null
    twitterDescription: string | null
  } | null>(null)

  if (defaults.current === null) {
    defaults.current = {
      title: document.title,
      description: readMeta('meta[name="description"]'),
      canonical: readLink('link[rel="canonical"]'),
      ogTitle: readMeta('meta[property="og:title"]'),
      ogDescription: readMeta('meta[property="og:description"]'),
      ogUrl: readMeta('meta[property="og:url"]'),
      twitterTitle: readMeta('meta[name="twitter:title"]'),
      twitterDescription: readMeta('meta[name="twitter:description"]'),
    }
  }

  useEffect(() => {
    // canonical/og:url 은 쿼리스트링을 제외한 경로만 사용 (검색 파라미터 중복 인덱싱 방지).
    const url = SITE_URL + (path ?? globalThis.location.pathname)

    document.title = title
    writeMeta('meta[property="og:title"]', title)
    writeMeta('meta[name="twitter:title"]', title)
    writeLink('link[rel="canonical"]', url)
    writeMeta('meta[property="og:url"]', url)

    if (description) {
      writeMeta('meta[name="description"]', description)
      writeMeta('meta[property="og:description"]', description)
      writeMeta('meta[name="twitter:description"]', description)
    }
  }, [title, description, path])

  useEffect(() => {
    const snapshot = defaults.current
    return () => {
      if (!snapshot) return
      document.title = snapshot.title
      if (snapshot.description !== null) {
        writeMeta('meta[name="description"]', snapshot.description)
      }
      if (snapshot.ogDescription !== null) {
        writeMeta('meta[property="og:description"]', snapshot.ogDescription)
      }
      if (snapshot.twitterDescription !== null) {
        writeMeta('meta[name="twitter:description"]', snapshot.twitterDescription)
      }
      if (snapshot.ogTitle !== null) writeMeta('meta[property="og:title"]', snapshot.ogTitle)
      if (snapshot.twitterTitle !== null) {
        writeMeta('meta[name="twitter:title"]', snapshot.twitterTitle)
      }
      if (snapshot.canonical !== null) writeLink('link[rel="canonical"]', snapshot.canonical)
      if (snapshot.ogUrl !== null) writeMeta('meta[property="og:url"]', snapshot.ogUrl)
    }
  }, [])
}
