/**
 * 앱인토스 인앱 광고 헬퍼(배너·전면형·보상형).
 * ──────────────────────────────────────────────────────────────────────────
 * 정책:
 * - 운영은 콘솔 발급 광고 그룹 ID(env)만, dev 빌드는 공식 테스트 ID만 사용해요.
 * - env 미설정(운영)이면 해당 광고는 아예 미노출(빈 슬롯·의도치 않은 테스트 광고 방지).
 * - 배너는 화면당 1개 96px 슬롯, onNoFill 시 접기. 토스 앱 5.241.0 미만은 미노출 게이트.
 * - 전면형은 화면 전환 3회 + 마지막 노출(또는 앱 진입)로부터 2분 경과 시에만 —
 *   진입 직후 노출 금지, load→loaded 사전로드 후에만 show.
 * - 보상형은 명시적 옵트인 버튼에서만, 보상 지급은 userEarnedReward 이벤트에서만.
 * - 외부 광고 네트워크 금지(앱인토스 광고만). 토스 밖/미지원 환경에서는 안전하게 no-op.
 */
import { TossAds, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'
import { useCallback, useEffect, useRef, useState } from 'react'

import { isTossAppVersionAtLeast } from './toss'

import type { TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework'

/** 배너/전면형/보상형 공식 테스트 광고 그룹 ID — dev 전용(운영 사용 금지). */
const TEST_BANNER_AD_GROUP_ID = 'ait-ad-test-banner-id'
const TEST_INTERSTITIAL_AD_GROUP_ID = 'ait-ad-test-interstitial-id'
const TEST_REWARDED_AD_GROUP_ID = 'ait-ad-test-rewarded-id'

/** 배너 광고를 지원하는 최소 토스 앱 버전. */
const MIN_TOSS_APP_VERSION = '5.241.0'

function resolveAdGroupId(envValue: string | undefined, devFallback: string): string | null {
  const value = envValue?.trim()
  if (value) return value
  return import.meta.env.DEV ? devFallback : null
}

/** 노출할 배너 광고 그룹 ID. 운영 미설정 시 null(미노출). */
export function getBannerAdGroupId(): string | null {
  return resolveAdGroupId(import.meta.env.VITE_TOSS_AD_GROUP_ID, TEST_BANNER_AD_GROUP_ID)
}

/** 전면형 광고 그룹 ID. 운영 미설정 시 null(미노출). */
export function getInterstitialAdGroupId(): string | null {
  return resolveAdGroupId(
    import.meta.env.VITE_TOSS_INTERSTITIAL_AD_GROUP_ID,
    TEST_INTERSTITIAL_AD_GROUP_ID
  )
}

/** 보상형 광고 그룹 ID. 운영 미설정 시 null(옵트인 UI 자체 미노출). */
export function getRewardedAdGroupId(): string | null {
  return resolveAdGroupId(import.meta.env.VITE_TOSS_REWARDED_AD_GROUP_ID, TEST_REWARDED_AD_GROUP_ID)
}

/** 배너 SDK 지원 + 토스 앱 버전 게이트(5.241.0+). */
export function isBannerSupported(): boolean {
  try {
    return Boolean(TossAds?.initialize?.isSupported?.()) && isTossAppVersionAtLeast(MIN_TOSS_APP_VERSION)
  } catch {
    return false
  }
}

function isFullScreenAdSupported(): boolean {
  try {
    return (
      Boolean(loadFullScreenAd.isSupported() && showFullScreenAd.isSupported()) &&
      isTossAppVersionAtLeast(MIN_TOSS_APP_VERSION)
    )
  } catch {
    return false
  }
}

// SDK는 앱 전체에서 한 번만 초기화(중복 초기화 금지) — 모듈 스코프로 상태 공유.
let sdkInitialized = false
let sdkInitializing = false
const sdkReadyListeners = new Set<() => void>()

function initBannerSdk(): void {
  if (sdkInitialized || sdkInitializing || !isBannerSupported()) return
  sdkInitializing = true
  try {
    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          sdkInitialized = true
          sdkInitializing = false
          for (const listener of sdkReadyListeners) listener()
          sdkReadyListeners.clear()
        },
        onInitializationFailed: () => {
          sdkInitializing = false
        },
      },
    })
  } catch {
    sdkInitializing = false
  }
}

/**
 * TossAds 초기화 + 배너 부착 헬퍼 훅.
 * @returns ready(초기화 완료), attach(배너 부착 — 반환 객체의 destroy()로 정리)
 */
export function useTossBanner() {
  const [ready, setReady] = useState(sdkInitialized)

  useEffect(() => {
    if (sdkInitialized) {
      setReady(true)
      return
    }
    if (!isBannerSupported()) return
    const listener = () => setReady(true)
    sdkReadyListeners.add(listener)
    initBannerSdk()
    return () => {
      sdkReadyListeners.delete(listener)
    }
  }, [])

  const attach = useCallback(
    (adGroupId: string, element: HTMLElement, options?: TossAdsAttachBannerOptions) => {
      if (!sdkInitialized) return undefined
      try {
        return TossAds.attachBanner(adGroupId, element, options)
      } catch {
        return undefined
      }
    },
    []
  )

  return { ready, attach, supported: isBannerSupported() }
}

/* ── 전면형(interstitial) ────────────────────────────────────────────────
 * 게이트: 화면 전환 3회 이상 + 마지막 노출로부터 2분 이상. 앱 시작 시각을
 * 마지막 노출로 간주해 진입 직후 노출을 막아요. loaded 상태에서만 show.
 */
const INTERSTITIAL_MIN_NAVIGATIONS = 3
const INTERSTITIAL_MIN_INTERVAL_MS = 2 * 60_000

let navigationsSinceShow = 0
let lastInterstitialAt = Date.now() // 앱 진입 직후 노출 금지
let interstitialLoaded = false
let interstitialLoading = false
let interstitialShowing = false
let unregisterInterstitialLoad: (() => void) | null = null
let unregisterInterstitialShow: (() => void) | null = null

function preloadInterstitial(): void {
  const adGroupId = getInterstitialAdGroupId()
  if (!adGroupId || interstitialLoaded || interstitialLoading || !isFullScreenAdSupported()) return
  interstitialLoading = true
  try {
    unregisterInterstitialLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: ({ type }) => {
        if (type !== 'loaded') return
        unregisterInterstitialLoad?.()
        unregisterInterstitialLoad = null
        interstitialLoading = false
        interstitialLoaded = true
      },
      onError: () => {
        unregisterInterstitialLoad?.()
        unregisterInterstitialLoad = null
        interstitialLoading = false
        interstitialLoaded = false
      },
    })
  } catch {
    interstitialLoading = false
  }
}

function showInterstitial(): void {
  const adGroupId = getInterstitialAdGroupId()
  if (!adGroupId || !interstitialLoaded || interstitialShowing) return
  interstitialShowing = true
  interstitialLoaded = false

  const finish = () => {
    if (!interstitialShowing) return
    interstitialShowing = false
    unregisterInterstitialShow?.()
    unregisterInterstitialShow = null
    navigationsSinceShow = 0
    lastInterstitialAt = Date.now()
    preloadInterstitial() // 다음 노출 대비 사전로드
  }

  try {
    unregisterInterstitialShow = showFullScreenAd({
      options: { adGroupId },
      onEvent: ({ type }) => {
        if (type === 'dismissed' || type === 'failedToShow') finish()
      },
      onError: finish,
    })
  } catch {
    finish()
  }
}

/**
 * 화면 전환마다 호출 — 게이트를 통과하면 사전로드된 전면형 광고를 노출해요.
 * 초기 진입(첫 렌더)에는 호출하지 말 것.
 */
export function registerNavigation(): void {
  if (!getInterstitialAdGroupId() || !isFullScreenAdSupported()) return
  navigationsSinceShow += 1
  preloadInterstitial()
  if (
    navigationsSinceShow >= INTERSTITIAL_MIN_NAVIGATIONS &&
    Date.now() - lastInterstitialAt >= INTERSTITIAL_MIN_INTERVAL_MS &&
    interstitialLoaded &&
    !interstitialShowing
  ) {
    showInterstitial()
  }
}

/* ── 보상형(rewarded) ────────────────────────────────────────────────── */

interface RewardedAdCallbacks {
  onReward?: (reward: { unitType: string; unitAmount: number }) => void
  onFinished?: () => void
}

/**
 * 보상형 광고 훅 — 옵트인 버튼 전용. configured=false면 UI 자체를 숨기세요.
 * 보상 지급은 반드시 userEarnedReward 이벤트에서만 일어나요.
 */
export function useRewardedAd(callbacks: RewardedAdCallbacks = {}) {
  const adGroupId = getRewardedAdGroupId()
  const supported = isFullScreenAdSupported()
  const [ready, setReady] = useState(false)
  const [showing, setShowing] = useState(false)
  const loadUnregisterRef = useRef<(() => void) | null>(null)
  const showUnregisterRef = useRef<(() => void) | null>(null)
  const onRewardRef = useRef(callbacks.onReward)
  const onFinishedRef = useRef(callbacks.onFinished)

  // react-compiler: ref 변이는 렌더 중 금지 — 커밋 후 최신 콜백을 동기화해요.
  useEffect(() => {
    onRewardRef.current = callbacks.onReward
    onFinishedRef.current = callbacks.onFinished
  })

  const load = useCallback(() => {
    loadUnregisterRef.current?.()
    loadUnregisterRef.current = null
    setReady(false)
    if (!adGroupId || !supported) return
    try {
      loadUnregisterRef.current = loadFullScreenAd({
        options: { adGroupId },
        onEvent: ({ type }) => {
          if (type !== 'loaded') return
          loadUnregisterRef.current?.()
          loadUnregisterRef.current = null
          setReady(true)
        },
        onError: () => {
          loadUnregisterRef.current?.()
          loadUnregisterRef.current = null
          setReady(false)
        },
      })
    } catch {
      setReady(false)
    }
  }, [adGroupId, supported])

  useEffect(() => {
    load()
    return () => {
      loadUnregisterRef.current?.()
      loadUnregisterRef.current = null
      showUnregisterRef.current?.()
      showUnregisterRef.current = null
    }
  }, [load])

  const show = (): boolean => {
    if (!ready || !adGroupId || !supported || showing) return false
    showUnregisterRef.current?.()
    showUnregisterRef.current = null
    setReady(false)
    setShowing(true)
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      showUnregisterRef.current?.()
      showUnregisterRef.current = null
      setShowing(false)
      onFinishedRef.current?.()
      load() // 다음 시청 대비 재로드
    }
    try {
      showUnregisterRef.current = showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') {
            onRewardRef.current?.(event.data)
          }
          if (event.type === 'dismissed' || event.type === 'failedToShow') finish()
        },
        onError: finish,
      })
      return true
    } catch {
      finish()
      return false
    }
  }

  return { configured: Boolean(adGroupId) && supported, ready, showing, show }
}
