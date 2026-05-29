import { describe, expect, it } from 'vitest'

import {
  addDays,
  anchorEvents,
  averageCycleDays,
  completedIntervalsDays,
  daysBetween,
  medianCycleDays,
  moltStats,
  predictNext,
  sortByDate,
} from './engine'

import type { MoltEvent, MoltKind } from './schema'

let seq = 0
function ev(occurredAt: string, kind: MoltKind = 'complete'): MoltEvent {
  seq += 1
  return {
    id: `e${seq}`,
    petId: null,
    speciesId: null,
    occurredAt,
    kind,
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('daysBetween / addDays', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30)
  })

  it('returns negative when b precedes a', () => {
    expect(daysBetween('2024-02-01', '2024-01-01')).toBe(-31)
  })

  it('is zero for the same day and tolerates timestamps', () => {
    expect(daysBetween('2024-03-10', '2024-03-10')).toBe(0)
    expect(daysBetween('2024-03-10T18:00:00Z', '2024-03-11T02:00:00Z')).toBe(1)
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    // US spring-forward weekend — would be 29 or 31 with naive local math.
    expect(daysBetween('2024-03-09', '2024-04-08')).toBe(30)
  })

  it('addDays round-trips with daysBetween', () => {
    expect(addDays('2024-01-01', 45)).toBe('2024-02-15')
    expect(daysBetween('2024-01-01', addDays('2024-01-01', 45))).toBe(45)
  })
})

describe('sortByDate', () => {
  it('sorts ascending and does not mutate the input', () => {
    const input = [ev('2024-03-01'), ev('2024-01-01'), ev('2024-02-01')]
    const sorted = sortByDate(input)
    expect(sorted.map((e) => e.occurredAt)).toEqual(['2024-01-01', '2024-02-01', '2024-03-01'])
    expect(input.map((e) => e.occurredAt)).toEqual(['2024-03-01', '2024-01-01', '2024-02-01'])
  })
})

describe('anchorEvents', () => {
  it('excludes in_progress events and keeps every other kind', () => {
    const events = [
      ev('2024-01-01', 'complete'),
      ev('2024-02-01', 'in_progress'),
      ev('2024-03-01', 'incomplete'),
      ev('2024-04-01', 'stuck'),
    ]
    expect(anchorEvents(events).map((e) => e.occurredAt)).toEqual([
      '2024-01-01',
      '2024-03-01',
      '2024-04-01',
    ])
  })
})

describe('completedIntervalsDays', () => {
  it('returns [] for 0 events', () => {
    expect(completedIntervalsDays([])).toEqual([])
  })

  it('returns [] for a single event', () => {
    expect(completedIntervalsDays([ev('2024-01-01')])).toEqual([])
  })

  it('computes gaps between two anchors', () => {
    expect(completedIntervalsDays([ev('2024-01-01'), ev('2024-01-31')])).toEqual([30])
  })

  it('computes gaps across several irregular intervals regardless of input order', () => {
    const events = [ev('2024-03-10'), ev('2024-01-01'), ev('2024-01-31'), ev('2024-02-20')]
    // sorted anchors: 01-01, 01-31 (30), 02-20 (20), 03-10 (19)
    expect(completedIntervalsDays(events)).toEqual([30, 20, 19])
  })

  it('ignores in_progress events when measuring intervals', () => {
    const events = [
      ev('2024-01-01', 'complete'),
      ev('2024-01-15', 'in_progress'),
      ev('2024-01-31', 'complete'),
    ]
    expect(completedIntervalsDays(events)).toEqual([30])
  })

  it('treats a stuck shed as an anchor', () => {
    const events = [ev('2024-01-01', 'complete'), ev('2024-02-10', 'stuck')]
    expect(completedIntervalsDays(events)).toEqual([40])
  })
})

describe('averageCycleDays', () => {
  it('is null for 0 and 1 events', () => {
    expect(averageCycleDays([])).toBeNull()
    expect(averageCycleDays([ev('2024-01-01')])).toBeNull()
  })

  it('equals the single interval for two events', () => {
    expect(averageCycleDays([ev('2024-01-01'), ev('2024-01-31')])).toBe(30)
  })

  it('rounds the mean of multiple intervals', () => {
    // intervals 30, 20, 19 -> mean 23
    const events = [ev('2024-01-01'), ev('2024-01-31'), ev('2024-02-20'), ev('2024-03-10')]
    expect(averageCycleDays(events)).toBe(23)
  })
})

describe('medianCycleDays', () => {
  it('is null with fewer than two anchors', () => {
    expect(medianCycleDays([])).toBeNull()
    expect(medianCycleDays([ev('2024-01-01')])).toBeNull()
  })

  it('returns the middle value for an odd count of intervals', () => {
    // intervals 30, 20, 19 -> sorted 19,20,30 -> median 20
    const events = [ev('2024-01-01'), ev('2024-01-31'), ev('2024-02-20'), ev('2024-03-10')]
    expect(medianCycleDays(events)).toBe(20)
  })

  it('averages the two middle values for an even count of intervals', () => {
    // four anchors 10 days apart -> intervals 10,10,10? build uneven instead
    // intervals: 10, 20 -> median (10+20)/2 = 15
    const events = [ev('2024-01-01'), ev('2024-01-11'), ev('2024-01-31')]
    expect(medianCycleDays(events)).toBe(15)
  })
})

describe('predictNext', () => {
  it('returns null with no events', () => {
    expect(predictNext([], '2024-06-01')).toBeNull()
  })

  it('returns null with a single event (no average yet)', () => {
    expect(predictNext([ev('2024-01-01')], '2024-06-01')).toBeNull()
  })

  it('projects last anchor + average and reports days until (low confidence at 1 interval)', () => {
    const events = [ev('2024-01-01'), ev('2024-01-31')] // avg 30, last 01-31
    const result = predictNext(events, '2024-02-10')
    expect(result).not.toBeNull()
    expect(result?.predictedDate).toBe('2024-03-01') // 01-31 + 30 days
    expect(result?.intervalDays).toBe(30)
    expect(result?.daysUntil).toBe(20) // 02-10 -> 03-01
    expect(result?.confidence).toBe('low')
    expect(result?.overdue).toBe(false)
  })

  it('flags overdue with a negative daysUntil once today passes the prediction', () => {
    const events = [ev('2024-01-01'), ev('2024-01-31')] // predicted 2024-03-01
    const result = predictNext(events, '2024-03-15')
    expect(result?.overdue).toBe(true)
    expect(result?.daysUntil).toBe(-14)
  })

  it('uses medium confidence for 2-3 intervals', () => {
    const events = [ev('2024-01-01'), ev('2024-01-31'), ev('2024-03-01')] // 2 intervals
    expect(predictNext(events, '2024-03-02')?.confidence).toBe('medium')
  })

  it('uses high confidence for 4+ intervals', () => {
    const events = [
      ev('2024-01-01'),
      ev('2024-01-31'),
      ev('2024-03-01'),
      ev('2024-03-31'),
      ev('2024-04-30'),
    ] // 4 intervals
    expect(predictNext(events, '2024-05-01')?.confidence).toBe('high')
  })

  it('ignores an in_progress event when anchoring the projection', () => {
    const events = [
      ev('2024-01-01', 'complete'),
      ev('2024-01-31', 'complete'),
      ev('2024-02-05', 'in_progress'),
    ]
    // last anchor is 01-31, avg 30 -> 03-01 (not anchored to the in_progress 02-05)
    expect(predictNext(events, '2024-02-10')?.predictedDate).toBe('2024-03-01')
  })

  it('still predicts when the latest cycle ended in a stuck shed', () => {
    const events = [ev('2024-01-01', 'complete'), ev('2024-01-31', 'stuck')]
    const result = predictNext(events, '2024-02-01')
    expect(result?.predictedDate).toBe('2024-03-01')
  })
})

describe('moltStats', () => {
  it('returns zeros and null date for no events', () => {
    expect(moltStats([])).toEqual({ total: 0, completeCount: 0, stuckCount: 0, lastDate: null })
  })

  it('counts by kind and reports the latest anchor date', () => {
    const events = [
      ev('2024-01-01', 'complete'),
      ev('2024-02-01', 'stuck'),
      ev('2024-03-01', 'complete'),
      ev('2024-03-15', 'in_progress'),
    ]
    const stats = moltStats(events)
    expect(stats.total).toBe(4)
    expect(stats.completeCount).toBe(2)
    expect(stats.stuckCount).toBe(1)
    // in_progress is not an anchor, so the latest anchor is 2024-03-01
    expect(stats.lastDate).toBe('2024-03-01')
  })
})
