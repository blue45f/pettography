import { describe, expect, it } from 'vitest'

import {
  checklistProgress,
  expectedRemainingYears,
  isSeniorStage,
  lifeProgressPct,
  lifeStage,
  monthsToYears,
  yearsToMonths,
} from './engine'

// Reference species: lifespan 10–20 years (e.g. leopard gecko).
// juvenile < 2.5y, senior >= 7.5y, geriatric >= 20y.
const MIN = 10
const MAX = 20

describe('monthsToYears / yearsToMonths', () => {
  it('round-trips whole years', () => {
    expect(monthsToYears(24)).toBe(2)
    expect(yearsToMonths(2)).toBe(24)
  })
  it('rounds fractional years to whole months', () => {
    expect(yearsToMonths(4.5)).toBe(54)
    expect(yearsToMonths(1.04)).toBe(12) // 12.48 -> 12
  })
  it('converts months to fractional years', () => {
    expect(monthsToYears(54)).toBe(4.5)
  })
})

describe('lifeStage thresholds', () => {
  it('classifies juvenile below 25% of min lifespan', () => {
    expect(lifeStage(0, MIN, MAX)).toBe('juvenile')
    expect(lifeStage(2.49, MIN, MAX)).toBe('juvenile')
  })
  it('classifies adult in the middle band', () => {
    expect(lifeStage(2.5, MIN, MAX)).toBe('adult') // exactly 25% -> no longer juvenile
    expect(lifeStage(5, MIN, MAX)).toBe('adult')
    expect(lifeStage(7.49, MIN, MAX)).toBe('adult')
  })
  it('classifies senior at/above 75% of min lifespan', () => {
    expect(lifeStage(7.5, MIN, MAX)).toBe('senior') // boundary inclusive
    expect(lifeStage(12, MIN, MAX)).toBe('senior')
    expect(lifeStage(19.99, MIN, MAX)).toBe('senior')
  })
  it('classifies geriatric at/above max lifespan', () => {
    expect(lifeStage(20, MIN, MAX)).toBe('geriatric') // boundary inclusive
    expect(lifeStage(35, MIN, MAX)).toBe('geriatric')
  })
})

describe('lifeStage fallbacks', () => {
  it('returns null for missing lifespan data', () => {
    expect(lifeStage(5, null, null)).toBeNull()
    expect(lifeStage(5, undefined, undefined)).toBeNull()
    expect(lifeStage(5, 0, 0)).toBeNull()
    expect(lifeStage(5, 0, 20)).toBeNull()
  })
  it('returns null when max < min (incoherent range)', () => {
    expect(lifeStage(5, 20, 10)).toBeNull()
  })
  it('returns null for negative age', () => {
    expect(lifeStage(-1, MIN, MAX)).toBeNull()
  })
  it('treats min === max as a single point (geriatric at that age)', () => {
    // min === max === 10: juvenile < 2.5, senior >= 7.5, geriatric >= 10
    expect(lifeStage(2, 10, 10)).toBe('juvenile')
    expect(lifeStage(4, 10, 10)).toBe('adult')
    expect(lifeStage(8, 10, 10)).toBe('senior')
    expect(lifeStage(10, 10, 10)).toBe('geriatric')
  })
})

describe('isSeniorStage', () => {
  it('is true only for senior and geriatric', () => {
    expect(isSeniorStage('senior')).toBe(true)
    expect(isSeniorStage('geriatric')).toBe(true)
    expect(isSeniorStage('adult')).toBe(false)
    expect(isSeniorStage('juvenile')).toBe(false)
    expect(isSeniorStage(null)).toBe(false)
  })
})

describe('lifeProgressPct', () => {
  it('computes percentage of max lifespan', () => {
    expect(lifeProgressPct(10, MAX)).toBe(50)
    expect(lifeProgressPct(5, MAX)).toBe(25)
  })
  it('clamps to 0..100', () => {
    expect(lifeProgressPct(0, MAX)).toBe(0)
    expect(lifeProgressPct(-5, MAX)).toBe(0)
    expect(lifeProgressPct(40, MAX)).toBe(100)
  })
  it('returns null without usable max lifespan', () => {
    expect(lifeProgressPct(5, null)).toBeNull()
    expect(lifeProgressPct(5, 0)).toBeNull()
    expect(lifeProgressPct(5, undefined)).toBeNull()
  })
})

describe('expectedRemainingYears', () => {
  it('measures against the midpoint of the range', () => {
    // midpoint of 10..20 is 15
    expect(expectedRemainingYears(5, MIN, MAX)).toBe(10)
    expect(expectedRemainingYears(15, MIN, MAX)).toBe(0)
  })
  it('clamps at zero for old animals', () => {
    expect(expectedRemainingYears(25, MIN, MAX)).toBe(0)
  })
  it('rounds to one decimal', () => {
    // midpoint of 10..21 is 15.5; remaining at age 4 is 11.5
    expect(expectedRemainingYears(4, 10, 21)).toBe(11.5)
  })
  it('treats negative age as zero', () => {
    expect(expectedRemainingYears(-3, MIN, MAX)).toBe(15)
  })
  it('returns null without usable lifespan data', () => {
    expect(expectedRemainingYears(5, null, null)).toBeNull()
    expect(expectedRemainingYears(5, 0, 20)).toBeNull()
    expect(expectedRemainingYears(5, 20, 10)).toBeNull()
  })
})

describe('checklistProgress', () => {
  const ids = ['a', 'b', 'c', 'd'] as const
  it('counts completed items and percentage', () => {
    expect(checklistProgress(ids, { a: true, c: true })).toEqual({ done: 2, total: 4, pct: 50 })
  })
  it('ignores unknown ids and falsy values', () => {
    expect(checklistProgress(ids, { a: false, z: true })).toEqual({ done: 0, total: 4, pct: 0 })
  })
  it('handles all complete', () => {
    expect(checklistProgress(ids, { a: true, b: true, c: true, d: true })).toEqual({
      done: 4,
      total: 4,
      pct: 100,
    })
  })
  it('empty item list yields 0% without dividing by zero', () => {
    expect(checklistProgress([], { a: true })).toEqual({ done: 0, total: 0, pct: 0 })
  })
})
