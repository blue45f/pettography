import { describe, expect, it } from 'vitest'

import { scaleFor, scoreLabel } from './data'
import { bcsStats, bcsTrend, latestBcs, sortByDate, statusForScore } from './engine'

import type { BcsEntry } from './schema'

function entry(
  assessedAt: string,
  score: number,
  createdAt = `${assessedAt}T00:00:00.000Z`,
): BcsEntry {
  return {
    id: `${assessedAt}-${score}`,
    petId: null,
    speciesId: 'sp-x',
    assessedAt,
    score,
    note: '',
    createdAt,
  }
}

describe('sortByDate', () => {
  it('orders ascending by date then creation time', () => {
    const e = [entry('2026-03-01', 3), entry('2026-01-01', 1), entry('2026-02-01', 2)]
    expect(sortByDate(e).map((x) => x.assessedAt)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ])
  })
  it('breaks same-day ties by createdAt', () => {
    const later = entry('2026-01-01', 5, '2026-01-01T10:00:00.000Z')
    const earlier = entry('2026-01-01', 2, '2026-01-01T08:00:00.000Z')
    expect(sortByDate([later, earlier]).map((x) => x.score)).toEqual([2, 5])
  })
  it('does not mutate the input array', () => {
    const e = [entry('2026-02-01', 2), entry('2026-01-01', 1)]
    const snapshot = e.map((x) => x.assessedAt)
    sortByDate(e)
    expect(e.map((x) => x.assessedAt)).toEqual(snapshot)
  })
})

describe('latestBcs', () => {
  it('returns the most recent assessment', () => {
    const e = [entry('2026-01-01', 1), entry('2026-03-01', 4), entry('2026-02-01', 3)]
    expect(latestBcs(e)?.score).toBe(4)
    expect(latestBcs(e)?.assessedAt).toBe('2026-03-01')
  })
  it('returns null for no entries', () => {
    expect(latestBcs([])).toBeNull()
  })
})

describe('bcsTrend', () => {
  it('returns score values oldest-first', () => {
    const e = [entry('2026-03-01', 3), entry('2026-01-01', 1), entry('2026-02-01', 2)]
    expect(bcsTrend(e)).toEqual([1, 2, 3])
  })
  it('is empty when there are no entries', () => {
    expect(bcsTrend([])).toEqual([])
  })
})

describe('statusForScore', () => {
  it('maps 1 and 2 to under', () => {
    expect(statusForScore(1)).toBe('under')
    expect(statusForScore(2)).toBe('under')
  })
  it('maps 3 to ideal', () => {
    expect(statusForScore(3)).toBe('ideal')
  })
  it('maps 4 and 5 to over', () => {
    expect(statusForScore(4)).toBe('over')
    expect(statusForScore(5)).toBe('over')
  })
  it('clamps out-of-range scores to the nearest bucket', () => {
    expect(statusForScore(0)).toBe('under')
    expect(statusForScore(6)).toBe('over')
  })
})

describe('bcsStats', () => {
  it('aggregates total, latest, status and rounded average', () => {
    const e = [entry('2026-01-01', 2), entry('2026-02-01', 4), entry('2026-03-01', 3)]
    const s = bcsStats(e)
    expect(s.total).toBe(3)
    expect(s.latestScore).toBe(3)
    expect(s.latestStatus).toBe('ideal')
    expect(s.averageScore).toBe(3)
  })
  it('rounds the average to one decimal place', () => {
    const e = [entry('2026-01-01', 1), entry('2026-02-01', 2)]
    // (1 + 2) / 2 = 1.5
    expect(bcsStats(e).averageScore).toBe(1.5)
    const e2 = [entry('2026-01-01', 1), entry('2026-02-01', 1), entry('2026-03-01', 2)]
    // (1 + 1 + 2) / 3 = 1.333 -> 1.3
    expect(bcsStats(e2).averageScore).toBe(1.3)
  })
  it('reflects an over status when the latest entry is high', () => {
    const e = [entry('2026-01-01', 3), entry('2026-02-01', 5)]
    expect(bcsStats(e).latestStatus).toBe('over')
  })
  it('empty entries yield zero total and null latest/average values', () => {
    expect(bcsStats([])).toEqual({
      total: 0,
      latestScore: null,
      latestStatus: null,
      averageScore: null,
    })
  })
})

describe('scaleFor', () => {
  it('returns five level keys for a known category', () => {
    const levels = scaleFor('reptile')
    expect(levels).toHaveLength(5)
    expect(levels.map((l) => l.score)).toEqual([1, 2, 3, 4, 5])
    expect(levels[0].descKey).toBe('bcs.scale.reptile.1')
    expect(levels[4].descKey).toBe('bcs.scale.reptile.5')
  })
  it('returns category-specific keys for arthropod and bird', () => {
    expect(scaleFor('arthropod')[2].descKey).toBe('bcs.scale.arthropod.3')
    expect(scaleFor('bird')[4].descKey).toBe('bcs.scale.bird.5')
  })
  it('falls back to the unknown scale for null/undefined category', () => {
    expect(scaleFor(null)[0].descKey).toBe('bcs.scale.unknown.1')
    expect(scaleFor(undefined)[2].descKey).toBe('bcs.scale.unknown.3')
  })
})

describe('scoreLabel', () => {
  it('maps each score to its label key', () => {
    expect(scoreLabel(1)).toBe('bcs.scoreLabels.1')
    expect(scoreLabel(3)).toBe('bcs.scoreLabels.3')
    expect(scoreLabel(5)).toBe('bcs.scoreLabels.5')
  })
  it('clamps and rounds out-of-range scores', () => {
    expect(scoreLabel(0)).toBe('bcs.scoreLabels.1')
    expect(scoreLabel(7)).toBe('bcs.scoreLabels.5')
    expect(scoreLabel(2.6)).toBe('bcs.scoreLabels.3')
  })
})
