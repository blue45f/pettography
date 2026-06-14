import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { KakaoMapsBootstrap } from './types'

function installKakaoBootstrap() {
  class FakeLatLng {
    constructor(
      public lat: number,
      public lng: number
    ) {}

    getLat() {
      return this.lat
    }

    getLng() {
      return this.lng
    }
  }

  const bootstrap = {
    maps: {
      load: vi.fn((callback: () => void) => callback()),
      Map: class {
        setCenter() {}
        setLevel() {}
        relayout() {}
      },
      LatLng: FakeLatLng,
      Marker: class {
        setMap() {}
      },
      InfoWindow: class {
        open() {}
        close() {}
      },
      event: {
        addListener: vi.fn(),
      },
    },
  } satisfies KakaoMapsBootstrap

  window.kakao = bootstrap

  return bootstrap
}

describe('loadKakaoMap', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_KAKAO_MAP_KEY', 'test-key')
    document.head.innerHTML = ''
    delete window.kakao
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete window.kakao
    document.head.innerHTML = ''
  })

  it('allows retrying after the Kakao Maps SDK script fails to load', async () => {
    const { loadKakaoMap } = await import('./loadKakaoMap')

    const failedAttempt = loadKakaoMap()
    const failedScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map]')
    expect(failedScript).toBeTruthy()

    failedScript?.dispatchEvent(new Event('error'))
    await expect(failedAttempt).rejects.toThrow('Failed to load Kakao Maps SDK')

    failedScript?.remove()
    const successfulAttempt = loadKakaoMap()
    const retryScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map]')

    expect(retryScript).toBeTruthy()
    expect(retryScript).not.toBe(failedScript)

    const bootstrap = installKakaoBootstrap()
    retryScript?.dispatchEvent(new Event('load'))

    await expect(successfulAttempt).resolves.toEqual({
      Map: bootstrap.maps.Map,
      LatLng: bootstrap.maps.LatLng,
      Marker: bootstrap.maps.Marker,
      InfoWindow: bootstrap.maps.InfoWindow,
      event: bootstrap.maps.event,
    })
  })

  it('rejects instead of hanging when an existing Kakao Maps SDK script fails', async () => {
    const existingScript = document.createElement('script')
    existingScript.dataset.kakaoMap = 'true'
    document.head.appendChild(existingScript)

    const { loadKakaoMap } = await import('./loadKakaoMap')
    const attempt = loadKakaoMap()

    existingScript.dispatchEvent(new Event('error'))

    await expect(
      Promise.race([
        attempt.then(
          () => 'resolved',
          () => 'rejected'
        ),
        new Promise<'pending'>((resolve) => window.setTimeout(() => resolve('pending'), 0)),
      ])
    ).resolves.toBe('rejected')
  })
})
