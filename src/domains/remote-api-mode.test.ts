import { afterEach, describe, expect, it, vi } from 'vitest'

import { hospitalsMock } from './hospitals/mockData'
import { speciesMock } from './species/mockData'

function getRequestUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  const input = fetchMock.mock.calls[0]?.[0]
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  if (input instanceof Request) return input.url
  return ''
}

function stubRemoteApi(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubEnv('VITE_API_URL', 'https://api.pettography.test/api')
  vi.stubGlobal('fetch', fetchMock)
  vi.resetModules()
}

describe('remote API mode', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('routes species queries to VITE_API_URL and validates the remote response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([speciesMock[0]]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    )
    stubRemoteApi(fetchMock)
    const { listSpecies } = await import('./species/api')

    const result = await listSpecies({ category: 'reptile', q: 'gecko' })

    expect(result).toEqual([speciesMock[0]])
    const url = new URL(getRequestUrl(fetchMock))
    expect(url.origin).toBe('https://api.pettography.test')
    expect(url.pathname).toBe('/api/species')
    expect(url.searchParams.get('category')).toBe('reptile')
    expect(url.searchParams.get('q')).toBe('gecko')
  })

  it('rejects species responses that drift from the frontend schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ ...speciesMock[0], category: 'dog' }]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    )
    stubRemoteApi(fetchMock)
    const { listSpecies } = await import('./species/api')

    await expect(listSpecies()).rejects.toThrow()
  })

  it('routes hospital geo filters to VITE_API_URL and preserves backend distance fields', async () => {
    const remoteHospital = { ...hospitalsMock[0], distanceKm: 1.25 }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([remoteHospital]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    )
    stubRemoteApi(fetchMock)
    const { listHospitals } = await import('./hospitals/api')

    const result = await listHospitals({
      category: 'reptile',
      origin: { lat: 37.5145, lng: 127.106 },
      radiusKm: 5,
    })

    expect(result).toEqual([remoteHospital])
    const url = new URL(getRequestUrl(fetchMock))
    expect(url.pathname).toBe('/api/hospitals')
    expect(url.searchParams.get('category')).toBe('reptile')
    expect(url.searchParams.get('lat')).toBe('37.5145')
    expect(url.searchParams.get('lng')).toBe('127.106')
    expect(url.searchParams.get('radiusKm')).toBe('5')
  })
})
