import { describe, expect, it } from 'vitest'

import {
  clutchStatusLabelCode,
  daysUntil,
  estimateHatchWindow,
  fertilityRate,
  incubationProgress,
} from './engine'

import type { Clutch, ClutchStatus } from './schema'

function clutch(overrides: Partial<Clutch> = {}): Clutch {
  return {
    id: 'c1',
    petId: null,
    pairingId: null,
    speciesId: 'sp-ball-python',
    laidAt: '2024-01-01',
    eggCount: 6,
    fertileCount: null,
    incubationTempC: null,
    status: 'incubating',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('estimateHatchWindow', () => {
  it('adds the species min/max days to the laid date', () => {
    // ball-python: 55–60 days
    const w = estimateHatchWindow('2024-01-01', 'ball-python')
    expect(w.earliest).toBe('2024-02-25') // +55
    expect(w.latest).toBe('2024-03-01') // +60
    expect(w.midpoint).toBe('2024-02-28') // +round((55+60)/2)=+58 (2024 leap year)
  })

  it('uses the generic fallback (45–70) for an unknown species', () => {
    const w = estimateHatchWindow('2024-01-01', 'no-such-species')
    expect(w.earliest).toBe('2024-02-15') // +45
    expect(w.latest).toBe('2024-03-11') // +70
    expect(w.midpoint).toBe('2024-02-28') // +round((45+70)/2)=+58 (2024 leap year)
  })

  it('falls back when the slug is null or undefined', () => {
    expect(estimateHatchWindow('2024-01-01', null).latest).toBe('2024-03-11')
    expect(estimateHatchWindow('2024-01-01', undefined).earliest).toBe('2024-02-15')
  })

  it('tolerates a full ISO timestamp by slicing to the day', () => {
    expect(estimateHatchWindow('2024-01-01T18:30:00.000Z', 'ball-python').earliest).toBe(
      '2024-02-25',
    )
  })
})

describe('daysUntil', () => {
  it('is positive in the future and negative in the past', () => {
    expect(daysUntil('2024-03-01', '2024-02-20')).toBe(10)
    expect(daysUntil('2024-02-20', '2024-03-01')).toBe(-10)
  })

  it('is zero on the same day', () => {
    expect(daysUntil('2024-05-05', '2024-05-05')).toBe(0)
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    expect(daysUntil('2024-04-08', '2024-03-09')).toBe(30)
  })
})

describe('incubationProgress', () => {
  it('is 0 on the day the eggs are laid', () => {
    expect(incubationProgress('2024-01-01', 'ball-python', '2024-01-01')).toBe(0)
  })

  it('scales linearly against maxDays', () => {
    // ball-python maxDays = 60; 30 days elapsed -> 50%
    expect(incubationProgress('2024-01-01', 'ball-python', '2024-01-31')).toBe(50)
  })

  it('clamps to 100 past the end of the window', () => {
    expect(incubationProgress('2024-01-01', 'ball-python', '2024-06-01')).toBe(100)
  })

  it('clamps to 0 when today precedes the laid date', () => {
    expect(incubationProgress('2024-01-01', 'ball-python', '2023-12-01')).toBe(0)
  })

  it('uses the fallback maxDays (70) for an unknown species', () => {
    // 35 of 70 days -> 50%
    expect(incubationProgress('2024-01-01', 'mystery', '2024-02-05')).toBe(50)
  })
})

describe('clutchStatusLabelCode', () => {
  it('returns the user-set hatched status regardless of dates', () => {
    expect(clutchStatusLabelCode(clutch({ status: 'hatched' }), '2024-01-02', 'ball-python')).toBe(
      'hatched',
    )
  })

  it('returns the user-set failed status regardless of dates', () => {
    expect(clutchStatusLabelCode(clutch({ status: 'failed' }), '2024-01-02', 'ball-python')).toBe(
      'failed',
    )
  })

  it('is incubating before the earliest hatch date', () => {
    // window 02-25 .. 03-01; today well before
    expect(clutchStatusLabelCode(clutch(), '2024-02-01', 'ball-python')).toBe('incubating')
  })

  it('is due inside the earliest→latest window', () => {
    expect(clutchStatusLabelCode(clutch(), '2024-02-27', 'ball-python')).toBe('due')
  })

  it('is due exactly on the earliest day', () => {
    expect(clutchStatusLabelCode(clutch(), '2024-02-25', 'ball-python')).toBe('due')
  })

  it('is overdue once today passes the latest hatch date', () => {
    expect(clutchStatusLabelCode(clutch(), '2024-03-05', 'ball-python')).toBe('overdue')
  })

  it('honours the species window via the slug, not the stored id', () => {
    // axolotl: 14–21 days from 2024-01-01 -> 01-15 .. 01-22
    const egg = clutch({ speciesId: 'sp-axolotl' })
    expect(clutchStatusLabelCode(egg, '2024-01-18', 'axolotl')).toBe('due')
    expect(clutchStatusLabelCode(egg, '2024-02-01', 'axolotl')).toBe('overdue')
  })
})

describe('fertilityRate', () => {
  it('returns null when fertileCount is not set', () => {
    expect(fertilityRate(clutch({ fertileCount: null }))).toBeNull()
  })

  it('computes fertileCount / eggCount as a percentage', () => {
    expect(fertilityRate(clutch({ eggCount: 8, fertileCount: 6 }))).toBe(75)
  })

  it('is 0 when no eggs are fertile', () => {
    expect(fertilityRate(clutch({ eggCount: 5, fertileCount: 0 }))).toBe(0)
  })

  it('can exceed nothing — 100 when all eggs are fertile', () => {
    expect(fertilityRate(clutch({ eggCount: 4, fertileCount: 4 }))).toBe(100)
  })

  it('returns null for a zero egg count to avoid divide-by-zero', () => {
    const status: ClutchStatus = 'incubating'
    expect(fertilityRate(clutch({ eggCount: 0, fertileCount: 0, status }))).toBeNull()
  })
})
