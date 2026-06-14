import { describe, expect, it } from 'vitest'

import { respGuidanceCategory } from './data'
import { bpm, latestByType, sortByDate, trend, vitalsStats } from './engine'

import type { VitalReading, VitalType } from './schema'

function reading(
  measuredAt: string,
  type: VitalType,
  bpmValue: number,
  createdAt = `${measuredAt}T00:00:00.000Z`
): VitalReading {
  return {
    id: `${measuredAt}-${type}-${bpmValue}`,
    petId: null,
    speciesId: 'sp-x',
    type,
    bpm: bpmValue,
    measuredAt,
    durationSec: 30,
    taps: Math.round((bpmValue / 60) * 30),
    note: '',
    createdAt,
  }
}

describe('bpm', () => {
  it('converts taps over a window to per-minute rate', () => {
    // 20 taps in 60s = 20 bpm
    expect(bpm(20, 60)).toBe(20)
    // 15 taps in 30s = 30 bpm
    expect(bpm(15, 30)).toBe(30)
    // 10 taps in 15s = 40 bpm
    expect(bpm(10, 15)).toBe(40)
  })
  it('rounds to the nearest whole breath/beat', () => {
    // 7 taps in 15s = 28 bpm exactly
    expect(bpm(7, 15)).toBe(28)
    // 8 taps in 30s = 16 bpm exactly
    expect(bpm(8, 30)).toBe(16)
    // 5 taps in 60s = 5 bpm
    expect(bpm(5, 60)).toBe(5)
    // 11 taps in 30s = 22 bpm
    expect(bpm(11, 30)).toBe(22)
    // rounding: 1 tap in 7s = 8.57.. -> 9
    expect(bpm(1, 7)).toBe(9)
    // rounding down: 2 taps in 9s = 13.33.. -> 13
    expect(bpm(2, 9)).toBe(13)
  })
  it('guards seconds <= 0 to 0 (no divide-by-zero / Infinity)', () => {
    expect(bpm(10, 0)).toBe(0)
    expect(bpm(10, -5)).toBe(0)
    expect(bpm(0, 0)).toBe(0)
  })
  it('zero taps is zero regardless of window', () => {
    expect(bpm(0, 30)).toBe(0)
  })
})

describe('sortByDate', () => {
  it('orders ascending by date then creation time', () => {
    const r = [
      reading('2026-03-01', 'respiration', 30),
      reading('2026-01-01', 'respiration', 10),
      reading('2026-02-01', 'respiration', 20),
    ]
    expect(sortByDate(r).map((x) => x.measuredAt)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ])
  })
  it('breaks same-day ties by createdAt', () => {
    const later = reading('2026-01-01', 'respiration', 99, '2026-01-01T10:00:00.000Z')
    const earlier = reading('2026-01-01', 'respiration', 11, '2026-01-01T08:00:00.000Z')
    expect(sortByDate([later, earlier]).map((x) => x.bpm)).toEqual([11, 99])
  })
  it('does not mutate the input array', () => {
    const r = [reading('2026-02-01', 'respiration', 20), reading('2026-01-01', 'respiration', 10)]
    const snapshot = r.map((x) => x.measuredAt)
    sortByDate(r)
    expect(r.map((x) => x.measuredAt)).toEqual(snapshot)
  })
})

describe('latestByType', () => {
  it('returns the most recent reading of the requested type only', () => {
    const r = [
      reading('2026-01-01', 'respiration', 10),
      reading('2026-03-01', 'heartrate', 120),
      reading('2026-02-01', 'respiration', 22),
    ]
    expect(latestByType(r, 'respiration')?.bpm).toBe(22)
    expect(latestByType(r, 'heartrate')?.bpm).toBe(120)
  })
  it('returns null when no reading of that type exists', () => {
    const r = [reading('2026-01-01', 'respiration', 10)]
    expect(latestByType(r, 'heartrate')).toBeNull()
    expect(latestByType([], 'respiration')).toBeNull()
  })
})

describe('trend', () => {
  it('returns bpm values oldest-first for the chosen type', () => {
    const r = [
      reading('2026-03-01', 'respiration', 30),
      reading('2026-01-01', 'respiration', 10),
      reading('2026-02-01', 'heartrate', 200),
      reading('2026-02-01', 'respiration', 20),
    ]
    expect(trend(r, 'respiration')).toEqual([10, 20, 30])
    expect(trend(r, 'heartrate')).toEqual([200])
  })
  it('is empty when no readings of the type exist', () => {
    expect(trend([], 'respiration')).toEqual([])
  })
})

describe('vitalsStats', () => {
  it('aggregates totals and latest values per type', () => {
    const r = [
      reading('2026-01-01', 'respiration', 10),
      reading('2026-02-01', 'respiration', 24),
      reading('2026-02-01', 'heartrate', 130),
    ]
    const s = vitalsStats(r)
    expect(s.total).toBe(3)
    expect(s.respirationCount).toBe(2)
    expect(s.heartrateCount).toBe(1)
    expect(s.latestRespiration).toBe(24)
    expect(s.latestHeartrate).toBe(130)
  })
  it('empty readings yield zero counts and null latest values', () => {
    expect(vitalsStats([])).toEqual({
      total: 0,
      latestRespiration: null,
      latestHeartrate: null,
      respirationCount: 0,
      heartrateCount: 0,
    })
  })
})

describe('respGuidanceCategory', () => {
  it('maps each category to its guidance key', () => {
    expect(respGuidanceCategory('reptile')).toBe('vitals.guidance.reptile')
    expect(respGuidanceCategory('amphibian')).toBe('vitals.guidance.amphibian')
    expect(respGuidanceCategory('bird')).toBe('vitals.guidance.bird')
    expect(respGuidanceCategory('mammal')).toBe('vitals.guidance.mammal')
    expect(respGuidanceCategory('arthropod')).toBe('vitals.guidance.arthropod')
  })
  it('falls back to the unknown key for null/undefined category', () => {
    expect(respGuidanceCategory(null)).toBe('vitals.guidance.unknown')
    expect(respGuidanceCategory(undefined)).toBe('vitals.guidance.unknown')
  })
})
