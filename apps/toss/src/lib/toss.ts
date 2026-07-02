/**
 * 앱인토스 WebView 브릿지 래퍼.
 * 토스 환경이 아닐 때(일반 브라우저/개발)도 안전하게 폴백하도록 모두 try/catch로 감싸요.
 */
import {
  appLogin,
  generateHapticFeedback,
  getAnonymousKey,
  getOperationalEnvironment,
  getSchemeUri,
  getTossAppVersion,
  getTossShareLink,
  openURL,
  share,
} from '@apps-in-toss/web-framework'

import type { HapticFeedbackType } from '@apps-in-toss/web-framework'

export type TossEnv = 'toss' | 'sandbox' | 'web'

/** 'toss'(실기기/앱) | 'sandbox'(샌드박스) | 'web'(브릿지 없음). */
export function getTossEnv(): TossEnv {
  try {
    return getOperationalEnvironment()
  } catch {
    return 'web'
  }
}

export const isInToss = (): boolean => getTossEnv() !== 'web'

/** 공유 OG 이미지·BGM 등 웹 자산 절대화 기준 오리진. */
export const WEB_ORIGIN =
  import.meta.env.VITE_WEB_ORIGIN?.trim() || 'https://pettography.vercel.app'

/**
 * 비게임 미니앱 사용자 식별키(hash). 서버/동의 없이 미니앱 내 고유 사용자 식별.
 * 샌드박스에서는 mock, 미지원/실패 시 null.
 */
export async function getStableUserKey(): Promise<string | null> {
  try {
    const result = await getAnonymousKey()
    if (result && typeof result === 'object' && result.type === 'HASH') {
      return result.hash
    }
    return null
  } catch {
    return null
  }
}

/**
 * 토스 로그인 인가 코드 획득. 토큰 교환/사용자 조회는 서버에서 처리해야 해요(mTLS).
 * 인가 코드는 10분 유효·일회성. (서버 mTLS 미보유 — 현재 미배선, 익명키만 사용해요)
 */
export async function tossAppLogin(): Promise<{
  authorizationCode: string
  referrer: 'DEFAULT' | 'SANDBOX'
} | null> {
  try {
    const result = await appLogin()
    return result ?? null
  } catch {
    return null
  }
}

/** 이 미니앱으로 돌아오는 딥링크 스킴(intoss://pettography ...). */
export function getMiniAppSchemeUri(): string | null {
  try {
    return getSchemeUri()
  } catch {
    return null
  }
}

/** 현재 토스 앱 버전 문자열. 토스 밖/실패 시 null. */
export function getTossAppVersionSafe(): string | null {
  try {
    return getTossAppVersion() || null
  } catch {
    return null
  }
}

/** 토스 앱 버전이 최소 버전 이상인지("5.241.0" 형식, 숫자 세그먼트 비교). */
export function isTossAppVersionAtLeast(min: string): boolean {
  const current = getTossAppVersionSafe()
  if (!current) return false
  const a = current.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const b = min.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return true
}

/** 햅틱 피드백. 토스 밖/미지원 환경에서는 조용히 no-op. */
export function haptic(type: HapticFeedbackType): void {
  if (!isInToss()) return
  try {
    void generateHapticFeedback({ type }).catch(() => {})
  } catch {
    // no-op
  }
}

/** 외부 URL 열기 — 토스 안에서는 openURL 브릿지, 밖에서는 새 탭. */
export function openExternalUrl(url: string): void {
  if (isInToss()) {
    try {
      void openURL(url)
      return
    } catch {
      // fall through
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 토스 공유 링크 생성(intoss:// 딥링크 → 공유용 https 링크). 토스 밖/실패 시 null.
 */
export async function getTossShareLinkSafe(
  deepLink: string,
  ogImageUrl?: string
): Promise<string | null> {
  if (!isInToss()) return null
  try {
    const link = await getTossShareLink(deepLink, ogImageUrl)
    return link || null
  } catch {
    return null
  }
}

/**
 * 메시지 공유. 토스 네이티브 공유 → navigator.share → 클립보드 순으로 폴백.
 * @returns 공유/복사 성공 여부
 */
export async function shareMessage(
  message: string
): Promise<'toss' | 'web-share' | 'clipboard' | null> {
  if (isInToss()) {
    try {
      await share({ message })
      return 'toss'
    } catch {
      // fall through to web fallbacks
    }
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ text: message })
      return 'web-share'
    }
  } catch {
    return null // 사용자가 공유 시트를 닫은 경우 등
  }

  try {
    await navigator.clipboard.writeText(message)
    return 'clipboard'
  } catch {
    return null
  }
}
