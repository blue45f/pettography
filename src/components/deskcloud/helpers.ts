/**
 * DeskCloud 네이티브 통합 공용 헬퍼 — 포맷·익명 id·별점 렌더 보조.
 * 외부 의존성 없음(앱 내장 Intl 사용). 클라이언트(브라우저) 전용.
 */

const ANON_KEY = 'deskcloud:anon-id'

/**
 * 안정적인 익명 식별자. ChangelogDesk(seen)·NotifyDesk(recipientId) 같은
 * 1차-사용자 식별이 없는 표면에서 같은 브라우저를 일관되게 가리키기 위함.
 * localStorage 가 막히면(시크릿/거부) 세션 한정 임시 id 로 폴백한다.
 */
export function getAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_KEY)
    if (existing) return existing
    const next = `anon_${crypto.randomUUID()}`
    localStorage.setItem(ANON_KEY, next)
    return next
  } catch {
    return `anon_session_${Math.random().toString(36).slice(2)}`
  }
}

const RELATIVE_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

/**
 * ISO 타임스탬프를 로케일 상대시간으로(예: "3시간 전"). 잘못된 입력은 빈 문자열.
 * `locale` 은 i18n 의 현재 언어를 넘긴다(기본 ko).
 */
export function formatRelativeTime(iso: string, locale = 'ko'): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  let duration = (then - Date.now()) / 1000
  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}

/** 별점(0..5)을 ★/☆ 문자열로. 표시는 별이지만 접근성 라벨은 호출부가 따로 제공. */
export function renderStars(rating: number, max = 5): { filled: string; empty: string } {
  const filledCount = Math.max(0, Math.min(max, Math.round(rating)))
  return {
    filled: '★'.repeat(filledCount),
    empty: '☆'.repeat(max - filledCount),
  }
}
