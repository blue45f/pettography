import { describe, expect, it } from 'vitest'

import { recommendedDayLength, type SeasonId } from './data'
import { compareToRecommended, dayLengthHours, recommendedRange, seasonForMonth } from './engine'

describe('dayLengthHours', () => {
  it('is the plain difference when lights go off the same day', () => {
    // on 07:00 → off 19:00 = 12h
    expect(dayLengthHours(7, 19)).toBe(12)
    expect(dayLengthHours(6, 18)).toBe(12)
    expect(dayLengthHours(8, 20)).toBe(12)
  })

  it('wraps past midnight when off precedes on', () => {
    // on 20:00 → off 06:00 = 10h
    expect(dayLengthHours(20, 6)).toBe(10)
    // on 22:00 → off 02:00 = 4h
    expect(dayLengthHours(22, 2)).toBe(4)
    // on 23:00 → off 00:00 = 1h
    expect(dayLengthHours(23, 0)).toBe(1)
  })

  it('treats equal on/off as an always-on 24h day', () => {
    expect(dayLengthHours(8, 8)).toBe(24)
    expect(dayLengthHours(0, 0)).toBe(24)
  })

  it('covers the full-day and one-hour extremes', () => {
    expect(dayLengthHours(0, 23)).toBe(23)
    expect(dayLengthHours(0, 1)).toBe(1)
  })

  it('normalises out-of-range and negative / fractional hours', () => {
    // 25 → 1, so 1 → 13 = 12h
    expect(dayLengthHours(25, 13)).toBe(12)
    // -4 → 20, off 6 → 10h (same as the 20→6 wrap case)
    expect(dayLengthHours(-4, 6)).toBe(10)
    // fractional hours are truncated: 7.9 → 7, 19.9 → 19 = 12h
    expect(dayLengthHours(7.9, 19.9)).toBe(12)
  })
})

describe('seasonForMonth', () => {
  it('maps every 0-based month to the expected season', () => {
    const expected: SeasonId[] = [
      'winter', // 0 Jan
      'winter', // 1 Feb
      'spring', // 2 Mar
      'spring', // 3 Apr
      'spring', // 4 May
      'summer', // 5 Jun
      'summer', // 6 Jul
      'summer', // 7 Aug
      'autumn', // 8 Sep
      'autumn', // 9 Oct
      'autumn', // 10 Nov
      'winter', // 11 Dec
    ]
    for (let m = 0; m < 12; m += 1) {
      expect(seasonForMonth(m)).toBe(expected[m])
    }
  })

  it('places the season boundaries correctly', () => {
    expect(seasonForMonth(1)).toBe('winter') // Feb
    expect(seasonForMonth(2)).toBe('spring') // Mar
    expect(seasonForMonth(7)).toBe('summer') // Aug
    expect(seasonForMonth(8)).toBe('autumn') // Sep
    expect(seasonForMonth(10)).toBe('autumn') // Nov
    expect(seasonForMonth(11)).toBe('winter') // Dec
  })

  it('wraps out-of-range and negative month indices into 0..11', () => {
    expect(seasonForMonth(12)).toBe('winter') // → Jan
    expect(seasonForMonth(14)).toBe('spring') // → Mar
    expect(seasonForMonth(-1)).toBe('winter') // → Dec
    expect(seasonForMonth(-10)).toBe('spring') // → Mar
  })
})

describe('recommendedRange', () => {
  it('returns the table window for a category + season', () => {
    expect(recommendedRange('reptile', 'summer')).toEqual({ min: 13, max: 14 })
    expect(recommendedRange('reptile', 'winter')).toEqual({ min: 10, max: 11 })
  })

  it('keeps summer longer than winter for every category', () => {
    const categories = ['reptile', 'bird', 'amphibian', 'arthropod', 'mammal'] as const
    for (const c of categories) {
      const summer = recommendedRange(c, 'summer')
      const winter = recommendedRange(c, 'winter')
      expect(summer.max).toBeGreaterThanOrEqual(winter.max)
      expect(summer.min).toBeGreaterThanOrEqual(winter.min)
    }
  })

  it('falls back to a default category when none is given', () => {
    // null/undefined fall back to reptile.
    expect(recommendedRange(null, 'summer')).toEqual(recommendedDayLength('reptile', 'summer'))
    expect(recommendedRange(undefined, 'winter')).toEqual(recommendedDayLength('reptile', 'winter'))
  })
})

describe('compareToRecommended', () => {
  const range = { min: 12, max: 14 }

  it('flags a short photoperiod as low', () => {
    expect(compareToRecommended(10, range)).toBe('low')
    expect(compareToRecommended(11, range)).toBe('low')
  })

  it('flags a long photoperiod as high', () => {
    expect(compareToRecommended(15, range)).toBe('high')
    expect(compareToRecommended(24, range)).toBe('high')
  })

  it('is ok inside the window, inclusive of both bounds', () => {
    expect(compareToRecommended(12, range)).toBe('ok') // lower bound
    expect(compareToRecommended(13, range)).toBe('ok')
    expect(compareToRecommended(14, range)).toBe('ok') // upper bound
  })
})
