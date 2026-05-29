import { describe, expect, it } from 'vitest'

import { TRANSPORT_CHECKLIST } from './data'
import { checklistProgress, daysUntil, sortTrips, tripStatusCode } from './engine'

import type { Trip } from './schema'

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    petId: overrides.petId ?? null,
    speciesId: overrides.speciesId ?? null,
    purpose: overrides.purpose ?? 'vet',
    date: overrides.date ?? '2026-06-01',
    durationHours: overrides.durationHours ?? null,
    notes: overrides.notes ?? '',
    checklist: overrides.checklist ?? {},
    createdAt: overrides.createdAt ?? '2026-05-01T00:00:00.000Z',
  }
}

describe('checklistProgress', () => {
  const items = ['a', 'b', 'c', 'd']

  it('reports 0% when nothing is checked', () => {
    expect(checklistProgress({ checklist: {} }, items)).toEqual({ done: 0, total: 4, pct: 0 })
  })

  it('reports partial progress and rounds the percentage', () => {
    // 1 of 3 → 33%
    const r = checklistProgress({ checklist: { a: true } }, ['a', 'b', 'c'])
    expect(r).toEqual({ done: 1, total: 3, pct: 33 })
  })

  it('reports 100% when every item is checked', () => {
    const checklist = { a: true, b: true, c: true, d: true }
    expect(checklistProgress({ checklist }, items)).toEqual({ done: 4, total: 4, pct: 100 })
  })

  it('ignores unknown keys in the checklist map', () => {
    const r = checklistProgress({ checklist: { a: true, zzz: true } }, items)
    expect(r).toEqual({ done: 1, total: 4, pct: 25 })
  })

  it('treats explicitly false items as not done', () => {
    expect(checklistProgress({ checklist: { a: true, b: false } }, items).done).toBe(1)
  })

  it('returns 0% (not NaN) for an empty item set', () => {
    expect(checklistProgress({ checklist: { a: true } }, [])).toEqual({ done: 0, total: 0, pct: 0 })
  })

  it('clamps to 100 and never exceeds total', () => {
    const checklist = { a: true, b: true, c: true, d: true, extra: true }
    const r = checklistProgress({ checklist }, items)
    expect(r.pct).toBe(100)
    expect(r.done).toBeLessThanOrEqual(r.total)
  })

  it('works against the real catalog', () => {
    const checklist: Record<string, boolean> = {}
    for (const id of TRANSPORT_CHECKLIST) checklist[id] = true
    const r = checklistProgress({ checklist }, TRANSPORT_CHECKLIST)
    expect(r.done).toBe(TRANSPORT_CHECKLIST.length)
    expect(r.pct).toBe(100)
  })
})

describe('daysUntil', () => {
  it('returns 0 for the same day', () => {
    expect(daysUntil('2026-06-01', '2026-06-01')).toBe(0)
  })

  it('returns a positive count for a future date', () => {
    expect(daysUntil('2026-06-10', '2026-06-01')).toBe(9)
  })

  it('returns a negative count for a past date', () => {
    expect(daysUntil('2026-05-25', '2026-06-01')).toBe(-7)
  })

  it('counts across a month boundary correctly', () => {
    expect(daysUntil('2026-07-01', '2026-06-29')).toBe(2)
  })

  it('is timezone-stable (uses UTC midnight)', () => {
    // Across a DST-ish boundary the whole-day delta must stay exact.
    expect(daysUntil('2026-03-30', '2026-03-29')).toBe(1)
  })

  it('tolerates full ISO timestamps by slicing to the day', () => {
    expect(daysUntil('2026-06-05T18:30:00.000Z', '2026-06-01T09:00:00.000Z')).toBe(4)
  })
})

describe('tripStatusCode', () => {
  it('classifies a future date as upcoming', () => {
    expect(tripStatusCode({ date: '2026-06-10' }, '2026-06-01')).toBe('upcoming')
  })

  it('classifies the same day as today', () => {
    expect(tripStatusCode({ date: '2026-06-01' }, '2026-06-01')).toBe('today')
  })

  it('classifies a passed date as past', () => {
    expect(tripStatusCode({ date: '2026-05-20' }, '2026-06-01')).toBe('past')
  })
})

describe('sortTrips', () => {
  const today = '2026-06-01'

  it('orders upcoming trips soonest first', () => {
    const far = makeTrip({ id: 'far', date: '2026-06-20' })
    const soon = makeTrip({ id: 'soon', date: '2026-06-03' })
    const ids = sortTrips([far, soon], today).map((t) => t.id)
    expect(ids).toEqual(['soon', 'far'])
  })

  it('puts upcoming and today trips before past trips', () => {
    const past = makeTrip({ id: 'past', date: '2026-05-10' })
    const todayTrip = makeTrip({ id: 'today', date: today })
    const upcoming = makeTrip({ id: 'upcoming', date: '2026-06-15' })
    const ids = sortTrips([past, todayTrip, upcoming], today).map((t) => t.id)
    expect(ids).toEqual(['today', 'upcoming', 'past'])
  })

  it('orders past trips most-recent first', () => {
    const old = makeTrip({ id: 'old', date: '2026-04-01' })
    const recent = makeTrip({ id: 'recent', date: '2026-05-28' })
    const ids = sortTrips([old, recent], today).map((t) => t.id)
    expect(ids).toEqual(['recent', 'old'])
  })

  it('breaks ties on createdAt (newest first) without mutating input', () => {
    const a = makeTrip({ id: 'a', date: '2026-06-05', createdAt: '2026-05-01T00:00:00.000Z' })
    const b = makeTrip({ id: 'b', date: '2026-06-05', createdAt: '2026-05-02T00:00:00.000Z' })
    const input = [a, b]
    const ids = sortTrips(input, today).map((t) => t.id)
    expect(ids).toEqual(['b', 'a'])
    // input array stays in original order
    expect(input.map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('returns an empty array unchanged', () => {
    expect(sortTrips([], today)).toEqual([])
  })
})
