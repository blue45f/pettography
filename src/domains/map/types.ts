/**
 * 카카오맵 JavaScript SDK의 최소 타입 정의.
 * 전체 타입을 따라가지 않고 우리가 실제로 호출하는 멤버만 선언한다.
 */
export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void
}

export interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void
  close(): void
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void
  setLevel(level: number): void
  relayout(): void
}

export interface KakaoMapsApi {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Marker: new (options: { map?: KakaoMap; position: KakaoLatLng; title?: string }) => KakaoMarker
  InfoWindow: new (options: { content: string; removable?: boolean }) => KakaoInfoWindow
  event: {
    addListener: (target: unknown, type: string, handler: () => void) => void
  }
}

export interface KakaoMapsBootstrap {
  maps: {
    load: (cb: () => void) => void
  } & KakaoMapsApi
}

declare global {
  interface Window {
    kakao?: KakaoMapsBootstrap
  }
  // SDK 는 전역에 kakao 를 붙인다 — window.kakao 와 globalThis.kakao 양쪽에서 접근 가능하도록 선언.
  var kakao: KakaoMapsBootstrap | undefined
}
