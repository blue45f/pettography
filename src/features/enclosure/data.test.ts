import { describe, it, expect } from 'vitest'

import { CATEGORY_FALLBACK, MIN_ENCLOSURE, minEnclosure } from './data'

describe('minEnclosure', () => {
  it('returns the species-specific minimum for a known slug', () => {
    const r = minEnclosure('ball-python', 'reptile')
    expect(r.source).toBe('species')
    expect(r).toMatchObject({ lengthCm: 120, widthCm: 60, heightCm: 60, rule: 'lengthEqualsSnake' })
  })

  it('uses the arboreal tall rule for crested gecko (height > length)', () => {
    const r = minEnclosure('crested-gecko', 'reptile')
    expect(r.rule).toBe('tallPriority')
    expect(r.heightCm).toBeGreaterThan(r.lengthCm)
  })

  it('falls back to the category floor when the slug is unknown', () => {
    const r = minEnclosure('made-up-species', 'mammal')
    expect(r.source).toBe('category')
    expect(r).toMatchObject(CATEGORY_FALLBACK.mammal)
  })

  it('falls back to the category floor when the slug is null', () => {
    const r = minEnclosure(null, 'bird')
    expect(r.source).toBe('category')
    expect(r).toMatchObject(CATEGORY_FALLBACK.bird)
  })

  it('falls back to the reptile default when both slug and category are missing', () => {
    const r = minEnclosure(null, null)
    expect(r.source).toBe('category')
    expect(r).toMatchObject(CATEGORY_FALLBACK.reptile)
  })

  it('every catalog entry carries a positive footprint and a rule key', () => {
    for (const entry of Object.values(MIN_ENCLOSURE)) {
      expect(entry.lengthCm).toBeGreaterThan(0)
      expect(entry.widthCm).toBeGreaterThan(0)
      expect(entry.heightCm).toBeGreaterThan(0)
      expect(entry.rule).toBeTruthy()
    }
  })
})
