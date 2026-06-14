import { describe, expect, it } from 'vitest'

import { READINESS_ITEMS } from './data'
import { daysUntil, experienceMatch, readinessPct, sortWishlist } from './engine'

import type { WishlistItem } from './schema'

function makeItem(overrides: Partial<WishlistItem> = {}): WishlistItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    speciesId: overrides.speciesId ?? 'sp-leopard-gecko',
    priority: overrides.priority ?? 'someday',
    targetDate: overrides.targetDate ?? null,
    notes: overrides.notes ?? '',
    readiness: overrides.readiness ?? {},
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  }
}

const TOTAL = READINESS_ITEMS.length // 7

describe('readinessPct', () => {
  it('is 0 for an empty readiness map', () => {
    expect(readinessPct(makeItem({ readiness: {} }), TOTAL)).toBe(0)
  })

  it('is 100 when every item is checked', () => {
    const readiness = Object.fromEntries(READINESS_ITEMS.map((id) => [id, true]))
    expect(readinessPct(makeItem({ readiness }), TOTAL)).toBe(100)
  })

  it('rounds a partial completion', () => {
    // 3 of 7 -> 42.857 -> 43
    expect(
      readinessPct(makeItem({ readiness: { space: true, budget: true, vet: true } }), TOTAL)
    ).toBe(43)
  })

  it('ignores falsy values and unknown keys', () => {
    expect(readinessPct(makeItem({ readiness: { space: false, mystery: true } }), TOTAL)).toBe(0)
  })

  it('caps at the declared total even with extra true keys', () => {
    const readiness: Record<string, boolean> = Object.fromEntries(
      READINESS_ITEMS.map((id) => [id, true])
    )
    readiness.extra = true
    expect(readinessPct(makeItem({ readiness }), TOTAL)).toBe(100)
  })

  it('returns 0 without dividing by zero when total is 0', () => {
    expect(readinessPct(makeItem({ readiness: { space: true } }), 0)).toBe(0)
  })
})

describe('experienceMatch', () => {
  it('flags advanced species as caution', () => {
    expect(experienceMatch('advanced')).toBe('caution')
  })

  it('treats beginner and intermediate as ok', () => {
    expect(experienceMatch('beginner')).toBe('ok')
    expect(experienceMatch('intermediate')).toBe('ok')
  })
})

describe('sortWishlist', () => {
  it('orders next → soon → someday', () => {
    const items = [
      makeItem({ id: 'a', priority: 'someday' }),
      makeItem({ id: 'b', priority: 'next' }),
      makeItem({ id: 'c', priority: 'soon' }),
    ]
    expect(sortWishlist(items).map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties by createdAt ascending (oldest first)', () => {
    const items = [
      makeItem({ id: 'new', priority: 'next', createdAt: '2026-03-01T00:00:00.000Z' }),
      makeItem({ id: 'old', priority: 'next', createdAt: '2026-01-01T00:00:00.000Z' }),
    ]
    expect(sortWishlist(items).map((i) => i.id)).toEqual(['old', 'new'])
  })

  it('does not mutate the input array', () => {
    const items = [
      makeItem({ id: 'a', priority: 'someday' }),
      makeItem({ id: 'b', priority: 'next' }),
    ]
    const snapshot = items.map((i) => i.id)
    sortWishlist(items)
    expect(items.map((i) => i.id)).toEqual(snapshot)
  })

  it('returns an empty array for empty input', () => {
    expect(sortWishlist([])).toEqual([])
  })
})

describe('daysUntil', () => {
  it('is positive for a future target', () => {
    expect(daysUntil('2026-06-10', '2026-06-01')).toBe(9)
  })

  it('is 0 for today', () => {
    expect(daysUntil('2026-06-01', '2026-06-01')).toBe(0)
  })

  it('is negative for a past target', () => {
    expect(daysUntil('2026-05-20', '2026-06-01')).toBe(-12)
  })

  it('counts whole days across a month boundary in UTC', () => {
    expect(daysUntil('2026-02-01', '2026-01-31')).toBe(1)
  })
})
