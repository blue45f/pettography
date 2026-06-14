import type { Coordinates } from './utils'

export interface LocationPreset {
  id: string
  label: string
  coords: Coordinates
}

export const SONGPA_CENTER: Coordinates = { lat: 37.5145, lng: 127.1058 }

export const LOCATION_PRESETS: readonly LocationPreset[] = [
  { id: 'songpa', label: '서울 송파구 (잠실)', coords: SONGPA_CENTER },
  { id: 'gangnam', label: '서울 강남구 (역삼)', coords: { lat: 37.5006, lng: 127.0364 } },
  { id: 'mapo', label: '서울 마포구 (홍대)', coords: { lat: 37.5547, lng: 126.9236 } },
  { id: 'bundang', label: '경기 성남시 분당구', coords: { lat: 37.3515, lng: 127.1086 } },
  { id: 'busan-hae', label: '부산 해운대구', coords: { lat: 35.1631, lng: 129.1635 } },
] as const

export function findPreset(id: string | undefined): LocationPreset | undefined {
  if (!id) return undefined
  return LOCATION_PRESETS.find((p) => p.id === id)
}
