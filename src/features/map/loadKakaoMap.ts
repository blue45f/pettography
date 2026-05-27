import type { KakaoMapsApi } from './types'

const SDK_BASE = 'https://dapi.kakao.com/v2/maps/sdk.js'
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
    const existing = document.querySelector<HTMLScriptElement>(`script[data-kakao-map]`)
    const finish = () => {
      const bootstrap = window.kakao
      if (!bootstrap?.maps) {
        reject(new Error('Kakao Maps SDK did not initialize'))
        return
      }
      bootstrap.maps.load(() => {
        const { Map, LatLng, Marker, InfoWindow, event } = bootstrap.maps
        resolve({ Map, LatLng, Marker, InfoWindow, event })
      })
    }
    if (existing) {
      if (window.kakao?.maps) finish()
      else existing.addEventListener('load', finish, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = `${SDK_BASE}?appkey=${encodeURIComponent(appKey)}&autoload=false`
    script.async = true
    script.defer = true
    script.dataset.kakaoMap = 'true'
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Kakao Maps SDK')))
    document.head.appendChild(script)
  })

  return cached
}
