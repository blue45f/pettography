import { describe, expect, it } from 'vitest'

import { ALL_SAFETY_ITEM_IDS, categoryRisks, SAFETY_ITEMS } from './data'
import { auditProgress, groupProgress, safetyLevel } from './engine'

describe('auditProgress', () => {
  const items = ['a', 'b', 'c', 'd']

  it('reports 0% when nothing is checked', () => {
    expect(auditProgress({}, items)).toEqual({ done: 0, total: 4, pct: 0 })
  })

  it('reports partial progress and rounds the percentage', () => {
    // 1 of 3 → 33%
    const r = auditProgress({ a: true }, ['a', 'b', 'c'])
    expect(r.done).toBe(1)
    expect(r.total).toBe(3)
    expect(r.pct).toBe(33)
  })

  it('reports 100% when every item is checked', () => {
    const checked = { a: true, b: true, c: true, d: true }
    expect(auditProgress(checked, items)).toEqual({ done: 4, total: 4, pct: 100 })
  })

  it('ignores unknown keys in the checked map', () => {
    const checked = { a: true, zzz: true, unknown: true }
    const r = auditProgress(checked, items)
    expect(r.done).toBe(1)
    expect(r.total).toBe(4)
    expect(r.pct).toBe(25)
  })

  it('treats explicitly false (unchecked) items as not done', () => {
    expect(auditProgress({ a: true, b: false }, items).done).toBe(1)
  })

  it('returns 0% (not NaN) for an empty item set', () => {
    expect(auditProgress({ a: true }, [])).toEqual({ done: 0, total: 0, pct: 0 })
  })

  it('clamps to 100 and never exceeds total', () => {
    const r = auditProgress({ a: true, b: true, c: true, d: true, extra: true }, items)
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
    for (const id of ALL_SAFETY_ITEM_IDS) checked[id] = true
    const overall = auditProgress(checked, ALL_SAFETY_ITEM_IDS)
    const summedDone = SAFETY_ITEMS.reduce(
      (acc, g) => acc + groupProgress(checked, g.itemIds).done,
      0,
    )
    expect(summedDone).toBe(overall.done)
    expect(overall.pct).toBe(100)
  })
})

describe('safetyLevel', () => {
  it('is low below 50%', () => {
    expect(safetyLevel(0)).toBe('low')
    expect(safetyLevel(49)).toBe('low')
  })

  it('is medium from 50% up to (but not including) 85%', () => {
    expect(safetyLevel(50)).toBe('medium')
    expect(safetyLevel(84)).toBe('medium')
  })

  it('is high at 85% and above', () => {
    expect(safetyLevel(85)).toBe('high')
    expect(safetyLevel(100)).toBe('high')
  })

  it('clamps out-of-range input', () => {
    expect(safetyLevel(-20)).toBe('low')
    expect(safetyLevel(250)).toBe('high')
  })
})

describe('SAFETY_ITEMS catalog', () => {
  it('exposes the four expected hazard groups', () => {
    expect(SAFETY_ITEMS.map((g) => g.id)).toEqual(['escape', 'thermal', 'electrical', 'physical'])
  })

  it('ALL_SAFETY_ITEM_IDS is the flattened, unique union of every group', () => {
    const flat = SAFETY_ITEMS.flatMap((g) => g.itemIds)
    expect(ALL_SAFETY_ITEM_IDS).toEqual(flat)
    expect(new Set(ALL_SAFETY_ITEM_IDS).size).toBe(ALL_SAFETY_ITEM_IDS.length)
  })
})

describe('categoryRisks', () => {
  it('returns category-specific risk keys for every known category', () => {
    for (const category of ['reptile', 'amphibian', 'arthropod', 'bird', 'mammal'] as const) {
      const risks = categoryRisks(category)
      expect(risks.length).toBeGreaterThan(0)
      expect(risks.every((k) => k.startsWith('safety.risks.'))).toBe(true)
    }
  })

  it('falls back to the generic set when no category is set', () => {
    expect(categoryRisks(null)).toContain('safety.risks.generic')
    expect(categoryRisks(undefined)).toContain('safety.risks.generic')
  })

  it('surfaces drowning depth for amphibians and toxic fumes for birds', () => {
    expect(categoryRisks('amphibian')).toContain('safety.risks.waterDepth')
    expect(categoryRisks('bird')).toContain('safety.risks.toxicFumes')
  })
})
