import { describe, expect, it } from 'vitest'

import {
  avgCalmness,
  calmnessTrend,
  handlingGuidanceCode,
  latestSession,
  progressDelta,
  sortByDate,
} from './engine'

import type { HandlingSession, StressSign } from './schema'

let seq = 0
function s(sessionAt: string, calmness: number, stressSigns: StressSign[] = []): HandlingSession {
  seq += 1
  return {
    id: `s${seq}`,
    petId: null,
    speciesId: null,
    sessionAt,
    durationMin: 5,
    calmness,
    stressSigns,
    note: '',
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('sortByDate', () => {
  it('sorts descending (newest first) and does not mutate the input', () => {
    const input = [s('2024-01-01', 3), s('2024-03-01', 3), s('2024-02-01', 3)]
    const sorted = sortByDate(input)
    expect(sorted.map((e) => e.sessionAt)).toEqual(['2024-03-01', '2024-02-01', '2024-01-01'])
    expect(input.map((e) => e.sessionAt)).toEqual(['2024-01-01', '2024-03-01', '2024-02-01'])
  })
})

describe('latestSession', () => {
  it('is null when there are no sessions', () => {
    expect(latestSession([])).toBeNull()
  })

  it('returns the most recent session by date', () => {
    const sessions = [s('2024-01-01', 2), s('2024-04-10', 5), s('2024-02-01', 3)]
    expect(latestSession(sessions)?.sessionAt).toBe('2024-04-10')
  })
})

describe('avgCalmness', () => {
  it('is null for an empty list', () => {
    expect(avgCalmness([])).toBeNull()
  })

  it('returns the single value for one session', () => {
    expect(avgCalmness([s('2024-01-01', 4)])).toBe(4)
  })

  it('rounds the mean to one decimal place', () => {
    // (1 + 2 + 4) / 3 = 2.333... -> 2.3
    expect(avgCalmness([s('2024-01-01', 1), s('2024-01-02', 2), s('2024-01-03', 4)])).toBe(2.3)
  })
})

describe('calmnessTrend', () => {
  it('is empty for no sessions', () => {
    expect(calmnessTrend([])).toEqual([])
  })

  it('orders oldest -> newest regardless of input order', () => {
    const sessions = [s('2024-03-01', 5), s('2024-01-01', 1), s('2024-02-01', 3)]
    expect(calmnessTrend(sessions)).toEqual([1, 3, 5])
  })
})

describe('progressDelta', () => {
  it('is null with fewer than two sessions', () => {
    expect(progressDelta([])).toBeNull()
    expect(progressDelta([s('2024-01-01', 3)])).toBeNull()
  })

  it('is positive when recent calmness improves on earlier sessions', () => {
    // chronological calmness: [1, 2, 4, 5] -> earlier [1,2]=1.5, recent [4,5]=4.5 -> +3
    const sessions = [
      s('2024-01-01', 1),
      s('2024-02-01', 2),
      s('2024-03-01', 4),
      s('2024-04-01', 5),
    ]
    expect(progressDelta(sessions)).toBe(3)
  })

  it('is negative when recent calmness declines from earlier sessions', () => {
    // chronological: [5, 4, 2, 1] -> earlier [5,4]=4.5, recent [2,1]=1.5 -> -3
    const sessions = [
      s('2024-01-01', 5),
      s('2024-02-01', 4),
      s('2024-03-01', 2),
      s('2024-04-01', 1),
    ]
    expect(progressDelta(sessions)).toBe(-3)
  })

  it('puts the extra session into the earlier half on an odd count', () => {
    // chronological: [1, 2, 3] -> earlier [1,2]=1.5 (splitAt=1 -> earlier has 1), recent [2,3]
    // splitAt = floor(3/2) = 1, earlier=[1], recent=[2,3]=2.5 -> +1.5
    const sessions = [s('2024-01-01', 1), s('2024-02-01', 2), s('2024-03-01', 3)]
    expect(progressDelta(sessions)).toBe(1.5)
  })

  it('is zero when calmness is flat', () => {
    const sessions = [s('2024-01-01', 3), s('2024-02-01', 3)]
    expect(progressDelta(sessions)).toBe(0)
  })
})

describe('handlingGuidanceCode', () => {
  it('returns noData when nothing is logged (any tolerance)', () => {
    expect(handlingGuidanceCode('low', [])).toBe('noData')
    expect(handlingGuidanceCode('high', [])).toBe('noData')
    expect(handlingGuidanceCode(null, [])).toBe('noData')
  })

  it('flags highStress when recent sessions accumulate many stress signs', () => {
    // 4 signs across the recent window -> high stress even at high tolerance
    const sessions = [s('2024-03-01', 4, ['hissing', 'biting', 'gaping', 'tailRattle'])]
    expect(handlingGuidanceCode('high', sessions)).toBe('highStress')
  })

  it('flags highStress when most recent sessions are low calmness', () => {
    const sessions = [s('2024-03-03', 1), s('2024-03-02', 2), s('2024-03-01', 5)]
    // recent window [1,2,5]: two of three <= 2 -> high stress
    expect(handlingGuidanceCode('medium', sessions)).toBe('highStress')
  })

  it('warns for low tolerance once there is calm data and no acute stress', () => {
    const sessions = [s('2024-03-01', 5), s('2024-02-01', 5)]
    expect(handlingGuidanceCode('low', sessions)).toBe('lowTolerance')
  })

  it('prioritises highStress over lowTolerance', () => {
    const sessions = [s('2024-03-01', 1, ['biting', 'hissing', 'fleeing'])]
    expect(handlingGuidanceCode('low', sessions)).toBe('highStress')
  })

  it('reports goodProgress when a tolerant species is clearly improving', () => {
    const sessions = [
      s('2024-01-01', 2),
      s('2024-02-01', 3),
      s('2024-03-01', 4),
      s('2024-04-01', 5),
    ]
    expect(handlingGuidanceCode('high', sessions)).toBe('goodProgress')
  })

  it('reports declining when calmness drops without acute stress signs', () => {
    // calmness 4,4 then 3,3 -> delta -1, but no recent low-calmness/sign spike
    const sessions = [
      s('2024-01-01', 4),
      s('2024-02-01', 4),
      s('2024-03-01', 3),
      s('2024-04-01', 3),
    ]
    expect(handlingGuidanceCode('medium', sessions)).toBe('declining')
  })

  it('reports steady when a tolerant species is holding flat', () => {
    const sessions = [s('2024-03-01', 4), s('2024-02-01', 4)]
    expect(handlingGuidanceCode('high', sessions)).toBe('steady')
  })
})
