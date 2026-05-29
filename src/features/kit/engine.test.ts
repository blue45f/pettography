import { describe, expect, it } from 'vitest'

import { ALL_KIT_ITEM_IDS, KIT_ITEMS } from './data'
import { groupProgress, kitProgress } from './engine'

describe('kitProgress', () => {
  const items = ['a', 'b', 'c', 'd']

  it('reports 0% when nothing is checked', () => {
    const r = kitProgress({}, items)
    expect(r).toEqual({ done: 0, total: 4, pct: 0 })
  })

  it('reports partial progress and rounds the percentage', () => {
    // 1 of 3 → 33%
    const r = kitProgress({ a: true }, ['a', 'b', 'c'])
    expect(r.done).toBe(1)
    expect(r.total).toBe(3)
    expect(r.pct).toBe(33)
  })

  it('reports 100% when every item is checked', () => {
    const checked = { a: true, b: true, c: true, d: true }
    const r = kitProgress(checked, items)
    expect(r).toEqual({ done: 4, total: 4, pct: 100 })
  })

  it('ignores unknown keys in the checked map', () => {
    const checked = { a: true, zzz: true, unknown: true }
    const r = kitProgress(checked, items)
    expect(r.done).toBe(1)
    expect(r.total).toBe(4)
    expect(r.pct).toBe(25)
  })

  it('treats explicitly false (unchecked) items as not done', () => {
    const checked = { a: true, b: false }
    const r = kitProgress(checked, items)
    expect(r.done).toBe(1)
  })

  it('returns 0% (not NaN) for an empty item set', () => {
    const r = kitProgress({ a: true }, [])
    expect(r).toEqual({ done: 0, total: 0, pct: 0 })
  })

  it('clamps to 100 and never exceeds total', () => {
    const r = kitProgress({ a: true, b: true, c: true, d: true, extra: true }, items)
    expect(r.pct).toBe(100)
    expect(r.done).toBeLessThanOrEqual(r.total)
  })
})

describe('groupProgress', () => {
  it('counts only the group items that are checked', () => {
    const group = ['x', 'y', 'z', 'w']
    const checked = { x: true, y: true, other: true }
    const r = groupProgress(checked, group)
    expect(r.done).toBe(2)
    expect(r.total).toBe(4)
    expect(r.pct).toBe(50)
  })

  it('is empty-safe', () => {
    expect(groupProgress({}, [])).toEqual({ done: 0, total: 0, pct: 0 })
  })

  it('matches the overall progress when every group is summed', () => {
    const checked: Record<string, boolean> = {}
    for (const id of ALL_KIT_ITEM_IDS) checked[id] = true
    const overall = kitProgress(checked, ALL_KIT_ITEM_IDS)
    const summedDone = KIT_ITEMS.reduce((acc, g) => acc + groupProgress(checked, g.itemIds).done, 0)
    expect(summedDone).toBe(overall.done)
    expect(overall.pct).toBe(100)
  })
})

describe('KIT_ITEMS catalog', () => {
  it('exposes the four expected groups', () => {
    expect(KIT_ITEMS.map((g) => g.id)).toEqual(['power', 'transport', 'firstAid', 'info'])
  })

  it('ALL_KIT_ITEM_IDS is the flattened, unique union of every group', () => {
    const flat = KIT_ITEMS.flatMap((g) => g.itemIds)
    expect(ALL_KIT_ITEM_IDS).toEqual(flat)
    expect(new Set(ALL_KIT_ITEM_IDS).size).toBe(ALL_KIT_ITEM_IDS.length)
  })
})
