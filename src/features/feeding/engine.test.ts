import { describe, expect, it } from 'vitest'

import {
  addDays,
  daysBetween,
  daysUntilFeeding,
  feedingStats,
  nextFeedingDate,
  recommendFrequencyDays,
  recommendPreyForSnake,
  refusalStreak,
  sortByFedDesc,
} from './engine'

import type { FeedingRule } from './data'
import type { FeedLog } from './schema'

const RULE: FeedingRule = {
  preySizeRuleCode: 'girthMatch',
  frequencyDaysJuvenile: 7,
  frequencyDaysAdult: 14,
  note: 'feeding.rules.ball-python.note',
}

let seq = 0
function log(fedAt: string, accepted = true): FeedLog {
  seq += 1
  return {
    id: `f${seq}`,
    petId: null,
    speciesId: null,
    fedAt,
    item: 'mouse',
    quantity: 1,
    accepted,
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('daysBetween / addDays', () => {
  it('counts whole days forward and backward', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30)
    expect(daysBetween('2024-02-01', '2024-01-01')).toBe(-31)
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    expect(daysBetween('2024-03-09', '2024-04-08')).toBe(30)
  })

  it('addDays round-trips with daysBetween', () => {
    expect(addDays('2024-01-01', 45)).toBe('2024-02-15')
    expect(daysBetween('2024-01-01', addDays('2024-01-01', 45))).toBe(45)
  })
})

describe('recommendFrequencyDays', () => {
  it('uses the juvenile cadence for juveniles', () => {
    expect(recommendFrequencyDays(RULE, 'juvenile')).toBe(7)
  })

  it('uses the adult cadence for adults', () => {
    expect(recommendFrequencyDays(RULE, 'adult')).toBe(14)
  })
})

describe('nextFeedingDate', () => {
  it('adds the cadence to the last feeding date', () => {
    expect(nextFeedingDate('2024-01-01', 7)).toBe('2024-01-08')
    expect(nextFeedingDate('2024-01-31', 14)).toBe('2024-02-14')
  })

  it('tolerates a full ISO timestamp by using the day part', () => {
    expect(nextFeedingDate('2024-01-01T18:30:00.000Z', 10)).toBe('2024-01-11')
  })
})

describe('daysUntilFeeding', () => {
  it('is positive before the next feeding is due', () => {
    expect(daysUntilFeeding('2024-01-01', 7, '2024-01-05')).toBe(3)
  })

  it('is zero on the due day', () => {
    expect(daysUntilFeeding('2024-01-01', 7, '2024-01-08')).toBe(0)
  })

  it('goes negative once overdue', () => {
    expect(daysUntilFeeding('2024-01-01', 7, '2024-01-12')).toBe(-4)
  })
})

describe('recommendPreyForSnake', () => {
  it('returns 10–15% of body weight rounded to whole grams', () => {
    expect(recommendPreyForSnake(1000)).toEqual({ minPreyG: 100, maxPreyG: 150 })
  })

  it('rounds fractional grams for odd body weights', () => {
    // 350g -> 35g .. 52.5g -> rounds to 53
    expect(recommendPreyForSnake(350)).toEqual({ minPreyG: 35, maxPreyG: 53 })
  })

  it('clamps non-positive or invalid weights to a zero range', () => {
    expect(recommendPreyForSnake(0)).toEqual({ minPreyG: 0, maxPreyG: 0 })
    expect(recommendPreyForSnake(-200)).toEqual({ minPreyG: 0, maxPreyG: 0 })
    expect(recommendPreyForSnake(Number.NaN)).toEqual({ minPreyG: 0, maxPreyG: 0 })
  })
})

describe('sortByFedDesc', () => {
  it('sorts most-recent-first and does not mutate the input', () => {
    const input = [log('2024-01-01'), log('2024-03-01'), log('2024-02-01')]
    const sorted = sortByFedDesc(input)
    expect(sorted.map((l) => l.fedAt)).toEqual(['2024-03-01', '2024-02-01', '2024-01-01'])
    expect(input.map((l) => l.fedAt)).toEqual(['2024-01-01', '2024-03-01', '2024-02-01'])
  })
})

describe('refusalStreak', () => {
  it('is zero with no logs', () => {
    expect(refusalStreak([])).toBe(0)
  })

  it('is zero when the most recent feeding was accepted', () => {
    const logs = [log('2024-03-01', true), log('2024-02-01', false), log('2024-01-01', false)]
    expect(refusalStreak(logs)).toBe(0)
  })

  it('counts consecutive recent refusals from the latest feeding', () => {
    const logs = [log('2024-03-01', false), log('2024-02-01', false), log('2024-01-01', true)]
    expect(refusalStreak(logs)).toBe(2)
  })

  it('breaks the streak at the first accepted feeding, regardless of input order', () => {
    // Most recent two refused, then accepted, then an older refusal that must not count.
    const logs = [
      log('2024-01-01', false),
      log('2024-04-01', false),
      log('2024-02-01', true),
      log('2024-03-01', false),
    ]
    // sorted desc: 04-01(F), 03-01(F), 02-01(T) -> streak 2
    expect(refusalStreak(logs)).toBe(2)
  })

  it('counts every log when all recent feedings were refused', () => {
    const logs = [log('2024-03-01', false), log('2024-02-01', false)]
    expect(refusalStreak(logs)).toBe(2)
  })
})

describe('feedingStats', () => {
  it('returns zeros and a null lastFed for no logs', () => {
    expect(feedingStats([])).toEqual({
      total: 0,
      acceptedCount: 0,
      refusedCount: 0,
      lastFed: null,
    })
  })

  it('counts accepted/refused and reports the latest feeding date', () => {
    const logs = [log('2024-01-01', true), log('2024-03-01', false), log('2024-02-01', true)]
    const stats = feedingStats(logs)
    expect(stats.total).toBe(3)
    expect(stats.acceptedCount).toBe(2)
    expect(stats.refusedCount).toBe(1)
    expect(stats.lastFed).toBe('2024-03-01')
  })
})
