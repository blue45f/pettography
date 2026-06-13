import { describe, expect, it } from 'vitest'

import {
  ACHIEVEMENTS,
  computeMetrics,
  evaluateAchievements,
  passportNumber,
  unlockedCount,
} from './engine'

import type { MetricKey, PassportMetricInput } from './schema'

/** Build a metric input, defaulting every list to empty. */
function input(overrides: Partial<PassportMetricInput> = {}): PassportMetricInput {
  return {
    petCreatedAt: null,
    diary: [],
    molts: [],
    feedings: [],
    clutches: [],
    weights: [],
    bcs: [],
    vitals: [],
    water: [],
    growth: [],
    ...overrides,
  }
}

const ZERO_METRICS: Record<MetricKey, number> = {
  daysTogether: 0,
  diaryCount: 0,
  moltCount: 0,
  completeShedCount: 0,
  feedingCount: 0,
  feedingAcceptedStreak: 0,
  clutchCount: 0,
  weightCount: 0,
  bcsCount: 0,
  vitalsCount: 0,
  waterCount: 0,
  growthCount: 0,
}

describe('computeMetrics', () => {
  it('returns all-zero metrics for empty input', () => {
    expect(computeMetrics(input(), '2024-06-01')).toEqual(ZERO_METRICS)
  })

  it('counts daysTogether as whole days from createdAt to today (UTC)', () => {
    const metrics = computeMetrics(
      input({ petCreatedAt: '2024-01-01T09:30:00.000Z' }),
      '2024-01-31'
    )
    expect(metrics.daysTogether).toBe(30)
  })

  it('crosses a DST boundary without drift', () => {
    // US spring-forward weekend — naive local math would give 29 or 31.
    const metrics = computeMetrics(input({ petCreatedAt: '2024-03-09' }), '2024-04-08')
    expect(metrics.daysTogether).toBe(30)
  })

  it('clamps daysTogether to 0 when createdAt is in the future', () => {
    const metrics = computeMetrics(input({ petCreatedAt: '2024-12-01' }), '2024-06-01')
    expect(metrics.daysTogether).toBe(0)
  })

  it('is 0 days together on the same day, and 0 when createdAt is null', () => {
    expect(computeMetrics(input({ petCreatedAt: '2024-06-01' }), '2024-06-01').daysTogether).toBe(0)
    expect(computeMetrics(input({ petCreatedAt: null }), '2024-06-01').daysTogether).toBe(0)
  })

  it('counts diary, molt, feeding and clutch totals', () => {
    const metrics = computeMetrics(
      input({
        diary: [{ occurredAt: '2024-01-01' }, { occurredAt: '2024-01-02' }],
        molts: [
          { kind: 'complete', occurredAt: '2024-01-01' },
          { kind: 'stuck', occurredAt: '2024-02-01' },
        ],
        feedings: [
          { fedAt: '2024-01-01', accepted: true },
          { fedAt: '2024-01-08', accepted: false },
          { fedAt: '2024-01-15', accepted: true },
        ],
        clutches: [{ laidAt: '2024-03-01' }],
      }),
      '2024-06-01'
    )
    expect(metrics.diaryCount).toBe(2)
    expect(metrics.moltCount).toBe(2)
    expect(metrics.feedingCount).toBe(3)
    expect(metrics.clutchCount).toBe(1)
  })

  it('counts the precision-care tracker totals (weight, bcs, vitals, water, growth)', () => {
    const metrics = computeMetrics(
      input({
        weights: [{}, {}, {}],
        bcs: [{}],
        vitals: [{}, {}],
        water: [{}, {}, {}, {}],
        growth: [{}, {}, {}, {}, {}],
      }),
      '2024-06-01'
    )
    expect(metrics.weightCount).toBe(3)
    expect(metrics.bcsCount).toBe(1)
    expect(metrics.vitalsCount).toBe(2)
    expect(metrics.waterCount).toBe(4)
    expect(metrics.growthCount).toBe(5)
  })

  it('counts only complete sheds for completeShedCount', () => {
    const metrics = computeMetrics(
      input({
        molts: [
          { kind: 'complete', occurredAt: '2024-01-01' },
          { kind: 'complete', occurredAt: '2024-02-01' },
          { kind: 'incomplete', occurredAt: '2024-03-01' },
          { kind: 'stuck', occurredAt: '2024-04-01' },
          { kind: 'in_progress', occurredAt: '2024-05-01' },
        ],
      }),
      '2024-06-01'
    )
    expect(metrics.moltCount).toBe(5)
    expect(metrics.completeShedCount).toBe(2)
  })

  describe('feedingAcceptedStreak', () => {
    it('counts the most recent run of accepted feedings, regardless of input order', () => {
      const metrics = computeMetrics(
        input({
          feedings: [
            { fedAt: '2024-01-01', accepted: true },
            { fedAt: '2024-01-20', accepted: true },
            { fedAt: '2024-01-10', accepted: true },
          ],
        }),
        '2024-06-01'
      )
      expect(metrics.feedingAcceptedStreak).toBe(3)
    })

    it('breaks the streak at the most recent refusal', () => {
      const metrics = computeMetrics(
        input({
          feedings: [
            { fedAt: '2024-01-01', accepted: true },
            { fedAt: '2024-01-10', accepted: false },
            { fedAt: '2024-01-20', accepted: true },
            { fedAt: '2024-01-30', accepted: true },
          ],
        }),
        '2024-06-01'
      )
      // sorted desc: 01-30 ✓, 01-20 ✓, 01-10 ✗ → streak 2
      expect(metrics.feedingAcceptedStreak).toBe(2)
    })

    it('is 0 when the latest feeding was refused', () => {
      const metrics = computeMetrics(
        input({
          feedings: [
            { fedAt: '2024-01-01', accepted: true },
            { fedAt: '2024-01-10', accepted: false },
          ],
        }),
        '2024-06-01'
      )
      expect(metrics.feedingAcceptedStreak).toBe(0)
    })
  })
})

describe('ACHIEVEMENTS catalogue', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least 10 definitions with positive goals and valid metrics', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10)
    for (const def of ACHIEVEMENTS) {
      expect(def.goal).toBeGreaterThan(0)
      expect(ZERO_METRICS).toHaveProperty(def.metric)
    }
  })
})

describe('evaluateAchievements', () => {
  it('locks every achievement at 0% for empty/zero metrics', () => {
    const rows = evaluateAchievements(ZERO_METRICS)
    expect(rows).toHaveLength(ACHIEVEMENTS.length)
    expect(rows.every((r) => !r.unlocked)).toBe(true)
    expect(rows.every((r) => r.progress === 0)).toBe(true)
    expect(rows.every((r) => r.current === 0)).toBe(true)
    expect(unlockedCount(rows)).toBe(0)
  })

  it('unlocks an achievement when current meets the goal exactly', () => {
    const rows = evaluateAchievements({ ...ZERO_METRICS, diaryCount: 1 })
    const diary1 = rows.find((r) => r.def.id === 'diary1')
    expect(diary1?.unlocked).toBe(true)
    expect(diary1?.progress).toBe(100)
    expect(diary1?.current).toBe(1)
  })

  it('computes partial progress for a locked achievement', () => {
    const rows = evaluateAchievements({ ...ZERO_METRICS, diaryCount: 5 })
    const diary10 = rows.find((r) => r.def.id === 'diary10')
    expect(diary10?.unlocked).toBe(false)
    expect(diary10?.progress).toBe(50) // 5 / 10
    expect(diary10?.current).toBe(5)
  })

  it('clamps progress to 100 when current exceeds the goal but keeps raw current', () => {
    const rows = evaluateAchievements({ ...ZERO_METRICS, daysTogether: 365 })
    const bond100 = rows.find((r) => r.def.id === 'bond100')
    expect(bond100?.unlocked).toBe(true)
    expect(bond100?.progress).toBe(100)
    expect(bond100?.current).toBe(365)
  })

  it('rounds fractional progress', () => {
    // feed50 goal 50, current 1 → 2%
    const rows = evaluateAchievements({ ...ZERO_METRICS, feedingCount: 1 })
    expect(rows.find((r) => r.def.id === 'feed50')?.progress).toBe(2)
  })

  it('sorts unlocked achievements before locked ones', () => {
    const rows = evaluateAchievements({ ...ZERO_METRICS, diaryCount: 1, daysTogether: 7 })
    const firstLockedIndex = rows.findIndex((r) => !r.unlocked)
    const lastUnlockedIndex = [...rows].map((r) => r.unlocked).lastIndexOf(true)
    expect(lastUnlockedIndex).toBeLessThan(firstLockedIndex)
    expect(rows.filter((r) => r.unlocked).map((r) => r.def.id)).toEqual(
      expect.arrayContaining(['diary1', 'bond7'])
    )
  })

  it('returns one row per definition and never mutates the catalogue order', () => {
    const before = ACHIEVEMENTS.map((a) => a.id)
    evaluateAchievements({ ...ZERO_METRICS, diaryCount: 100 })
    expect(ACHIEVEMENTS.map((a) => a.id)).toEqual(before)
  })
})

describe('passportNumber', () => {
  it('is deterministic for the same id', () => {
    expect(passportNumber('abc-123')).toBe(passportNumber('abc-123'))
  })

  it('matches the PG-XXXX format', () => {
    expect(passportNumber('any-pet-id')).toMatch(/^PG-[0-9A-Z]{4}$/)
  })

  it('differs for different ids (no collisions on a small sample)', () => {
    const ids = ['a', 'b', 'pet-1', 'pet-2', 'd290f1ee-6c54-4b01-90e6-d701748f0851']
    const numbers = ids.map(passportNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('falls back to PG-0000 for empty or nullish ids', () => {
    expect(passportNumber('')).toBe('PG-0000')
    expect(passportNumber(null)).toBe('PG-0000')
    expect(passportNumber(undefined)).toBe('PG-0000')
  })
})
