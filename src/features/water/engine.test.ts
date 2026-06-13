import { describe, it, expect } from 'vitest'

import { cycleStatus, latestReading, paramFlags, sortByDate, trend } from './engine'

import type { WaterReading } from './schema'

let seq = 0
function reading(overrides: Partial<WaterReading> = {}): WaterReading {
  seq += 1
  return {
    id: `r${seq}`,
    petId: null,
    speciesId: null,
    measuredAt: '2024-01-01',
    tempC: null,
    ph: null,
    ammoniaPpm: null,
    nitritePpm: null,
    nitratePpm: null,
    note: '',
    createdAt: `2024-01-01T00:00:0${seq % 10}.000Z`,
    ...overrides,
  }
}

describe('cycleStatus', () => {
  it('flags toxic when ammonia exceeds the danger threshold', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0.5, nitritePpm: 0, nitratePpm: 0 }))).toBe('toxic')
  })

  it('flags toxic when nitrite exceeds the danger threshold', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0, nitritePpm: 1, nitratePpm: 5 }))).toBe('toxic')
  })

  it('reports cycled when ammonia & nitrite read ~0 and nitrate is present', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0, nitritePpm: 0, nitratePpm: 20 }))).toBe('cycled')
  })

  it('treats trace toxin readings as zero for the cycled decision', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0.05, nitritePpm: 0.05, nitratePpm: 10 }))).toBe(
      'cycled'
    )
  })

  it('reports cycling when toxins remain detectable but below the danger line', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0.2, nitritePpm: 0, nitratePpm: 0 }))).toBe('cycling')
  })

  it('still reports cycling when some nitrate exists alongside leftover toxins', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0, nitritePpm: 0.2, nitratePpm: 5 }))).toBe('cycling')
  })

  it('is unknown when ammonia & nitrite read clear but nitrate is missing', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0, nitritePpm: 0, nitratePpm: null }))).toBe('unknown')
  })

  it('is unknown when a toxin reading is missing entirely', () => {
    expect(cycleStatus(reading({ ammoniaPpm: 0, nitritePpm: null, nitratePpm: 20 }))).toBe(
      'unknown'
    )
  })

  it('is unknown for an empty reading', () => {
    expect(cycleStatus(reading())).toBe('unknown')
  })
})

describe('paramFlags', () => {
  it('marks any detectable ammonia/nitrite as warn and high amounts as danger', () => {
    const flags = paramFlags(reading({ ammoniaPpm: 0.2, nitritePpm: 0.5 }))
    expect(flags.ammoniaPpm).toBe('warn')
    expect(flags.nitritePpm).toBe('danger')
  })

  it('treats trace and missing toxins as ok', () => {
    const flags = paramFlags(reading({ ammoniaPpm: 0.05, nitritePpm: null }))
    expect(flags.ammoniaPpm).toBe('ok')
    expect(flags.nitritePpm).toBe('ok')
  })

  it('bands nitrate: ok / warn (>40) / danger (>80)', () => {
    expect(paramFlags(reading({ nitratePpm: 20 })).nitratePpm).toBe('ok')
    expect(paramFlags(reading({ nitratePpm: 50 })).nitratePpm).toBe('warn')
    expect(paramFlags(reading({ nitratePpm: 90 })).nitratePpm).toBe('danger')
  })

  it('warns on pH outside the 6.5–8 band', () => {
    expect(paramFlags(reading({ ph: 7.2 })).ph).toBe('ok')
    expect(paramFlags(reading({ ph: 6.0 })).ph).toBe('warn')
    expect(paramFlags(reading({ ph: 8.5 })).ph).toBe('warn')
  })

  it('warns on temperature outside the generic band', () => {
    expect(paramFlags(reading({ tempC: 18 })).tempC).toBe('ok')
    expect(paramFlags(reading({ tempC: 5 })).tempC).toBe('warn')
    expect(paramFlags(reading({ tempC: 30 })).tempC).toBe('warn')
  })
})

describe('sortByDate / latestReading', () => {
  it('orders readings newest day first', () => {
    const a = reading({ measuredAt: '2024-01-01' })
    const b = reading({ measuredAt: '2024-03-01' })
    const c = reading({ measuredAt: '2024-02-01' })
    expect(sortByDate([a, b, c]).map((r) => r.measuredAt)).toEqual([
      '2024-03-01',
      '2024-02-01',
      '2024-01-01',
    ])
  })

  it('returns the newest reading, or null when empty', () => {
    const older = reading({ measuredAt: '2024-01-01' })
    const newer = reading({ measuredAt: '2024-05-01' })
    expect(latestReading([older, newer])?.measuredAt).toBe('2024-05-01')
    expect(latestReading([])).toBeNull()
  })
})

describe('trend', () => {
  it('returns chronological points for a parameter, skipping unmeasured readings', () => {
    const points = trend(
      [
        reading({ measuredAt: '2024-01-03', nitratePpm: 30 }),
        reading({ measuredAt: '2024-01-01', nitratePpm: 10 }),
        reading({ measuredAt: '2024-01-02', nitratePpm: null }),
      ],
      'nitratePpm'
    )
    expect(points.map((p) => p.y)).toEqual([10, 30])
    expect(points.map((p) => p.measuredAt)).toEqual(['2024-01-01', '2024-01-03'])
    expect(points[0].x).toBeLessThan(points[1].x)
  })

  it('returns an empty list when the parameter was never measured', () => {
    expect(trend([reading({ ph: 7 }), reading({ ph: 7.5 })], 'ammoniaPpm')).toEqual([])
  })
})
