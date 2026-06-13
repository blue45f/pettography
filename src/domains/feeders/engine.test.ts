import { describe, expect, it } from 'vitest'

import {
  FEED_OVERDUE_DAYS,
  FEED_RECENTLY_DAYS,
  colonyAgeDays,
  daysSince,
  feedStatus,
  sortColonies,
} from './engine'

import type { FeederColony } from './schema'

let seq = 0
function colony(over: Partial<FeederColony> = {}): FeederColony {
  seq += 1
  return {
    id: over.id ?? `c${seq}`,
    type: over.type ?? 'dubia',
    name: over.name ?? `colony-${seq}`,
    startedAt: over.startedAt ?? '2024-01-01',
    estimateCount: over.estimateCount ?? null,
    lastFedAt: over.lastFedAt ?? null,
    notes: over.notes ?? '',
    createdAt: over.createdAt ?? '2024-01-01T00:00:00.000Z',
  }
}

describe('daysSince', () => {
  it('is zero on the same day', () => {
    expect(daysSince('2024-01-10', '2024-01-10')).toBe(0)
  })

  it('counts whole days forward', () => {
    expect(daysSince('2024-01-01', '2024-01-31')).toBe(30)
  })

  it('is negative when the date is in the future relative to today', () => {
    expect(daysSince('2024-02-01', '2024-01-01')).toBe(-31)
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    expect(daysSince('2024-03-09', '2024-04-08')).toBe(30)
  })

  it('tolerates a full ISO timestamp by using the day part', () => {
    expect(daysSince('2024-01-01T18:30:00.000Z', '2024-01-11')).toBe(10)
  })
})

describe('colonyAgeDays', () => {
  it('is 1 on the start day (1-based N일차)', () => {
    expect(colonyAgeDays(colony({ startedAt: '2024-05-01' }), '2024-05-01')).toBe(1)
  })

  it('counts the start day plus elapsed days', () => {
    expect(colonyAgeDays(colony({ startedAt: '2024-05-01' }), '2024-05-10')).toBe(10)
  })
})

describe('feedStatus', () => {
  it('is "never" when there is no last-fed date', () => {
    expect(feedStatus(null, '2024-01-10')).toBe('never')
  })

  it('is "fedRecently" on the same day', () => {
    expect(feedStatus('2024-01-10', '2024-01-10')).toBe('fedRecently')
  })

  it('is "fedRecently" up to and including the recent window', () => {
    expect(feedStatus('2024-01-01', `2024-01-0${1 + FEED_RECENTLY_DAYS}`)).toBe('fedRecently')
  })

  it('is "feedSoon" just past the recent window', () => {
    // 4 days after with FEED_RECENTLY_DAYS = 3
    expect(feedStatus('2024-01-01', '2024-01-05')).toBe('feedSoon')
  })

  it('is "feedSoon" on the overdue boundary (still not overdue)', () => {
    // exactly FEED_OVERDUE_DAYS days later
    expect(feedStatus('2024-01-01', '2024-01-08')).toBe('feedSoon')
  })

  it('is "overdue" once past the overdue window', () => {
    // FEED_OVERDUE_DAYS + 1 days later
    expect(feedStatus('2024-01-01', '2024-01-09')).toBe('overdue')
    expect(feedStatus('2024-01-01', '2024-02-01')).toBe('overdue')
  })

  it('clamps a future last-fed date to "fedRecently"', () => {
    expect(feedStatus('2024-02-01', '2024-01-01')).toBe('fedRecently')
  })

  it('uses sane window constants', () => {
    expect(FEED_RECENTLY_DAYS).toBeLessThan(FEED_OVERDUE_DAYS)
  })
})

describe('sortColonies', () => {
  it('orders by gut-load urgency: overdue, never, feedSoon, fedRecently', () => {
    const today = '2024-01-20'
    const overdue = colony({ id: 'o', name: 'Zeta', lastFedAt: '2024-01-01' })
    const never = colony({ id: 'n', name: 'Alpha', lastFedAt: null })
    const soon = colony({ id: 's', name: 'Mid', lastFedAt: '2024-01-14' })
    const recent = colony({ id: 'r', name: 'Beta', lastFedAt: '2024-01-19' })
    const sorted = sortColonies([recent, soon, never, overdue], today)
    expect(sorted.map((c) => c.id)).toEqual(['o', 'n', 's', 'r'])
  })

  it('breaks ties within a status by name then id', () => {
    const today = '2024-01-20'
    const a = colony({ id: 'z-id', name: 'Same', lastFedAt: null })
    const b = colony({ id: 'a-id', name: 'Same', lastFedAt: null })
    const c = colony({ id: 'c-id', name: 'Earlier', lastFedAt: null })
    const sorted = sortColonies([a, b, c], today)
    // "Earlier" < "Same"; within "Same", id "a-id" < "z-id"
    expect(sorted.map((x) => x.id)).toEqual(['c-id', 'a-id', 'z-id'])
  })

  it('does not mutate the input array', () => {
    const today = '2024-01-20'
    const input = [
      colony({ id: '1', lastFedAt: '2024-01-19' }),
      colony({ id: '2', lastFedAt: '2024-01-01' }),
    ]
    const before = input.map((c) => c.id)
    sortColonies(input, today)
    expect(input.map((c) => c.id)).toEqual(before)
  })

  it('returns an empty array unchanged', () => {
    expect(sortColonies([], '2024-01-20')).toEqual([])
  })
})
