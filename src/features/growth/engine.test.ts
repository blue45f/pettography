import { describe, expect, it } from 'vitest'

import {
  chartPoints,
  daysSpan,
  growthRatePerWeek,
  growthStats,
  latestEntry,
  sortByDate,
  statusVsNorm,
  weightChange,
} from './engine'

import type { GrowthEntry, GrowthNorm } from './schema'

function entry(
  measuredAt: string,
  weightGram: number,
  lengthCm: number | null = null,
): GrowthEntry {
  return {
    id: measuredAt,
    petId: null,
    speciesId: 'sp-x',
    measuredAt,
    weightGram,
    lengthCm,
    note: '',
    createdAt: `${measuredAt}T00:00:00.000Z`,
  }
}

const norm: GrowthNorm = { adultWeightMinG: 45, adultWeightMaxG: 90, monthsToAdult: 18 }

describe('sortByDate / latestEntry', () => {
  it('sorts ascending and returns the latest', () => {
    const e = [entry('2026-03-01', 50), entry('2026-01-01', 20), entry('2026-02-01', 35)]
    expect(sortByDate(e).map((x) => x.measuredAt)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ])
    expect(latestEntry(e)?.weightGram).toBe(50)
  })
  it('latestEntry of empty is null', () => {
    expect(latestEntry([])).toBeNull()
  })
})

describe('daysSpan / weightChange / growthRatePerWeek', () => {
  it('computes span in days', () => {
    expect(daysSpan([entry('2026-01-01', 10), entry('2026-01-15', 20)])).toBe(14)
  })
  it('single entry has no span/change/rate', () => {
    const one = [entry('2026-01-01', 10)]
    expect(daysSpan(one)).toBe(0)
    expect(weightChange(one)).toBeNull()
    expect(growthRatePerWeek(one)).toBeNull()
  })
  it('weight change delta + percent', () => {
    const c = weightChange([entry('2026-01-01', 20), entry('2026-02-01', 30)])
    expect(c).toEqual({ deltaG: 10, pct: 50 })
  })
  it('growth rate per week over 14 days of +14g is 7g/week', () => {
    expect(growthRatePerWeek([entry('2026-01-01', 10), entry('2026-01-15', 24)])).toBe(7)
  })
  it('handles weight loss (negative delta)', () => {
    const c = weightChange([entry('2026-01-01', 80), entry('2026-02-01', 60)])
    expect(c?.deltaG).toBe(-20)
    expect(c?.pct).toBe(-25)
  })
})

describe('statusVsNorm', () => {
  it('classifies below / normal / above', () => {
    expect(statusVsNorm(30, norm)).toBe('below')
    expect(statusVsNorm(60, norm)).toBe('normal')
    expect(statusVsNorm(120, norm)).toBe('above')
  })
  it('boundaries are inclusive of normal', () => {
    expect(statusVsNorm(45, norm)).toBe('normal')
    expect(statusVsNorm(90, norm)).toBe('normal')
  })
  it('null norm → null status', () => {
    expect(statusVsNorm(60, null)).toBeNull()
  })
})

describe('growthStats', () => {
  it('aggregates latest weight, change, rate, status', () => {
    const e = [entry('2026-01-01', 30, 12), entry('2026-02-01', 50, 16)]
    const s = growthStats(e, norm)
    expect(s.count).toBe(2)
    expect(s.latestWeight).toBe(50)
    expect(s.latestLength).toBe(16)
    expect(s.change?.deltaG).toBe(20)
    expect(s.status).toBe('normal')
  })
  it('empty → all null/zero', () => {
    const s = growthStats([], norm)
    expect(s).toEqual({
      count: 0,
      latestWeight: null,
      latestLength: null,
      change: null,
      ratePerWeek: null,
      status: null,
    })
  })
})

describe('chartPoints', () => {
  it('returns null for no entries', () => {
    expect(chartPoints([], norm)).toBeNull()
  })
  it('normalizes x/y into [0,1] and includes the norm band in range', () => {
    const e = [entry('2026-01-01', 45), entry('2026-02-01', 90)]
    const c = chartPoints(e, norm)
    expect(c).not.toBeNull()
    expect(c!.minW).toBe(45)
    expect(c!.maxW).toBe(90)
    expect(c!.points[0]).toMatchObject({ x: 0, y: 0 })
    expect(c!.points[1]).toMatchObject({ x: 1, y: 1 })
  })
  it('single entry yields one point without dividing by zero', () => {
    const c = chartPoints([entry('2026-01-01', 50)], null)
    expect(c!.points).toHaveLength(1)
    expect(Number.isFinite(c!.points[0].x)).toBe(true)
    expect(Number.isFinite(c!.points[0].y)).toBe(true)
  })
})
