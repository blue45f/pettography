import type { KakaoMapsApi } from './types'

const SDK_BASE = 'https://dapi.kakao.com/v2/maps/sdk.js'
const SCRIPT_SELECTOR = 'script[data-kakao-map]'
let cached: Promise<KakaoMapsApi | null> | null = null

export function isKakaoMapConfigured(): boolean {
  return Boolean(import.meta.env.VITE_KAKAO_MAP_KEY)
}

export function loadKakaoMap(): Promise<KakaoMapsApi | null> {
  if (cached) return cached
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY
  if (!appKey || typeof window === 'undefined' || typeof document === 'undefined') {
    cached = Promise.resolve(null)
    return cached
  }

  cached = new Promise<KakaoMapsApi | null>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR)
    let activeScript: HTMLScriptElement | null = existing
    const fail = (error: Error, script?: HTMLScriptElement | null) => {
      const failedScript = script ?? activeScript
      failedScript?.remove()
      reject(error)
    }
    const finish = () => {
      const bootstrap = window.kakao
      if (!bootstrap?.maps) {
        fail(new Error('Kakao Maps SDK did not initialize'))
        return
      }
      bootstrap.maps.load(() => {
        const { Map, LatLng, Marker, InfoWindow, event } = bootstrap.maps
        resolve({ Map, LatLng, Marker, InfoWindow, event })
      })
    }
    if (existing) {
      if (window.kakao?.maps) finish()
      else {
        existing.addEventListener('load', finish, { once: true })
        existing.addEventListener('error', () => fail(new Error('Failed to load Kakao Maps SDK')), {
          once: true,
        })
      }
      return
    }
    const script = document.createElement('script')
    activeScript = script
    script.src = `${SDK_BASE}?appkey=${encodeURIComponent(appKey)}&autoload=false`
    script.async = true
    script.defer = true
    script.dataset.kakaoMap = 'true'
    script.addEventListener('load', finish, { once: true })
    script.addEventListener(
      'error',
      () => fail(new Error('Failed to load Kakao Maps SDK'), script),
      {
        once: true,
      }
    )
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    cached = null
    throw error
  })

  return cached
}
