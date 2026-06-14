import { isKakaoMapConfigured, loadKakaoMap } from '@domains/map'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './KakaoMap.module.css'

import type { KakaoMap as KakaoMapInstance, KakaoMapsApi } from '@domains/map'

export interface KakaoMapMarker {
  id: string
  lat: number
  lng: number
  title?: string
  popupHtml?: string
}

interface KakaoMapProps {
  center: { lat: number; lng: number }
  markers?: KakaoMapMarker[]
  level?: number
  height?: number
  placeholder?: string
}

function KakaoMap({ center, markers = [], level = 6, height = 320, placeholder }: KakaoMapProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<KakaoMapInstance | null>(null)
  const [apiState, setApiState] = useState<
    | { status: 'idle' | 'loading' }
    | { status: 'ready'; api: KakaoMapsApi }
    | { status: 'unavailable' }
    | { status: 'error'; message: string }
  >(() => (isKakaoMapConfigured() ? { status: 'loading' } : { status: 'unavailable' }))

  useEffect(() => {
    if (apiState.status !== 'loading') return
    let cancelled = false
    loadKakaoMap()
      .then((api) => {
        if (cancelled) return
        if (!api) setApiState({ status: 'unavailable' })
        else setApiState({ status: 'ready', api })
      })
      .catch((err: Error) => {
        if (!cancelled) setApiState({ status: 'error', message: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [apiState.status])

  useEffect(() => {
    if (apiState.status !== 'ready' || !containerRef.current) return
    const { api } = apiState
    const centerLatLng = new api.LatLng(center.lat, center.lng)
    const map = new api.Map(containerRef.current, { center: centerLatLng, level })
    mapRef.current = map
    for (const m of markers) {
      const marker = new api.Marker({
        map,
        position: new api.LatLng(m.lat, m.lng),
        title: m.title,
      })
      if (m.popupHtml) {
        const info = new api.InfoWindow({ content: m.popupHtml, removable: true })
        api.event.addListener(marker, 'click', () => info.open(map, marker))
      }
    }
    return () => {
      mapRef.current = null
    }
  }, [apiState, center.lat, center.lng, level, markers])

  const placeholderText = placeholder ?? t('hospitals.mapPlaceholder')
  const wrapperStyle = useMemo(() => ({ height: `${height}px` }), [height])

  if (apiState.status === 'unavailable') {
    return (
      <div className={styles.placeholder} style={wrapperStyle} aria-hidden="true">
        🗺️ {placeholderText}
      </div>
    )
  }
  if (apiState.status === 'error') {
    return (
      <div className={styles.placeholder} style={wrapperStyle} role="alert">
        🗺️ {apiState.message}
      </div>
    )
  }
  return <div ref={containerRef} className={styles.map} style={wrapperStyle} role="presentation" />
}

export default KakaoMap
