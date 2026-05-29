import { describe, expect, it } from 'vitest'

import { currentSeason, orderedSeasonsFrom } from './engine'
import { SEASONS, type Season } from './schema'

describe('currentSeason', () => {
  it('maps every 0-based month to the expected season', () => {
    const expected: Season[] = [
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
      expect(currentSeason(m)).toBe(expected[m])
    }
  })

  it('places the season boundaries correctly', () => {
    // Feb (1) is winter, Mar (2) flips to spring.
    expect(currentSeason(1)).toBe('winter')
    expect(currentSeason(2)).toBe('spring')
    // Aug (7) is summer, Sep (8) flips to autumn.
    expect(currentSeason(7)).toBe('summer')
    expect(currentSeason(8)).toBe('autumn')
    // Nov (10) is autumn, Dec (11) flips to winter.
    expect(currentSeason(10)).toBe('autumn')
    expect(currentSeason(11)).toBe('winter')
  })

  it('wraps out-of-range and negative month indices into 0..11', () => {
    expect(currentSeason(12)).toBe('winter') // 12 % 12 = 0 → Jan
    expect(currentSeason(14)).toBe('spring') // 14 % 12 = 2 → Mar
    expect(currentSeason(-1)).toBe('winter') // wraps to Dec
    expect(currentSeason(-10)).toBe('spring') // wraps to Mar
  })

  it('truncates fractional month indices', () => {
    expect(currentSeason(2.9)).toBe('spring')
  })
})

describe('orderedSeasonsFrom', () => {
  it('puts the current season first, then continues in calendar order', () => {
    expect(orderedSeasonsFrom('spring')).toEqual(['spring', 'summer', 'autumn', 'winter'])
    expect(orderedSeasonsFrom('summer')).toEqual(['summer', 'autumn', 'winter', 'spring'])
    expect(orderedSeasonsFrom('autumn')).toEqual(['autumn', 'winter', 'spring', 'summer'])
    expect(orderedSeasonsFrom('winter')).toEqual(['winter', 'spring', 'summer', 'autumn'])
  })

  it('always returns all four seasons exactly once', () => {
    for (const start of SEASONS) {
      const ordered = orderedSeasonsFrom(start)
      expect(ordered).toHaveLength(4)
      expect(new Set(ordered).size).toBe(4)
      expect(ordered[0]).toBe(start)
    }
  })
})
