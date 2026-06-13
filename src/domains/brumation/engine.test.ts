import { describe, expect, it } from 'vitest'

import {
  currentPhase,
  dayInPlan,
  endDate,
  phaseDuration,
  phaseSchedule,
  progressPct,
  totalDays,
} from './engine'

import type { BrumationPlan } from './schema'

/**
 * Default template totals 7+14+10+60+10+14 = 115 days. A plan with an empty
 * override map should fall back to those defaults everywhere.
 */
function plan(overrides: Partial<BrumationPlan> = {}): BrumationPlan {
  return {
    id: 'p1',
    petId: null,
    speciesId: 'sp-bearded-dragon',
    startDate: '2024-01-01',
    phaseDays: {},
    targetTempC: 12,
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('phaseDuration', () => {
  it('uses the template default when there is no override', () => {
    expect(phaseDuration(plan(), 'vetCheck')).toBe(7)
    expect(phaseDuration(plan(), 'dormancy')).toBe(60)
  })

  it('honours a positive override', () => {
    expect(phaseDuration(plan({ phaseDays: { dormancy: 90 } }), 'dormancy')).toBe(90)
  })

  it('ignores a non-positive or non-finite override and falls back to default', () => {
    expect(phaseDuration(plan({ phaseDays: { fasting: 0 } }), 'fasting')).toBe(14)
    expect(phaseDuration(plan({ phaseDays: { fasting: -5 } }), 'fasting')).toBe(14)
  })
})

describe('phaseSchedule', () => {
  it('lays phases out with cumulative, contiguous offsets', () => {
    const segs = phaseSchedule(plan())
    expect(segs.map((s) => s.id)).toEqual([
      'vetCheck',
      'fasting',
      'coolDown',
      'dormancy',
      'warmUp',
      'recovery',
    ])
    // startOffsetDay is the running sum of prior durations.
    expect(segs.map((s) => s.startOffsetDay)).toEqual([0, 7, 21, 31, 91, 101])
    // endOffsetDay is inclusive: startOffset + duration - 1.
    expect(segs.map((s) => s.endOffsetDay)).toEqual([6, 20, 30, 90, 100, 114])
  })

  it('each phase starts the day after the previous one ends', () => {
    const segs = phaseSchedule(plan())
    for (let i = 1; i < segs.length; i += 1) {
      expect(segs[i].startOffsetDay).toBe(segs[i - 1].endOffsetDay + 1)
    }
  })

  it('computes correct calendar dates from the start date', () => {
    const segs = phaseSchedule(plan())
    // vetCheck: 2024-01-01 .. +6 = 2024-01-07
    expect(segs[0]).toMatchObject({ startDate: '2024-01-01', endDate: '2024-01-07' })
    // fasting starts at offset 7 -> 2024-01-08, ends offset 20 -> 2024-01-21
    expect(segs[1]).toMatchObject({ startDate: '2024-01-08', endDate: '2024-01-21' })
    // dormancy starts at offset 31 -> 2024-02-01 (2024 is a leap year)
    expect(segs[3].startDate).toBe('2024-02-01')
    // recovery ends at offset 114 -> 2024-04-24
    expect(segs[5].endDate).toBe('2024-04-24')
  })

  it('reflects per-phase overrides in the offsets', () => {
    const segs = phaseSchedule(plan({ phaseDays: { vetCheck: 10 } }))
    expect(segs[0].endOffsetDay).toBe(9)
    // fasting now shifts to start at offset 10.
    expect(segs[1].startOffsetDay).toBe(10)
  })

  it('tolerates a full ISO timestamp by slicing to the day', () => {
    expect(phaseSchedule(plan({ startDate: '2024-01-01T18:30:00.000Z' }))[0].startDate).toBe(
      '2024-01-01',
    )
  })
})

describe('totalDays', () => {
  it('sums the template defaults', () => {
    expect(totalDays(plan())).toBe(115)
  })

  it('reflects overrides', () => {
    expect(totalDays(plan({ phaseDays: { dormancy: 90 } }))).toBe(145) // 115 - 60 + 90
  })
})

describe('endDate', () => {
  it('is the final day of the last phase', () => {
    // 115-day plan from 2024-01-01 -> last day is +114 = 2024-04-24
    expect(endDate(plan())).toBe('2024-04-24')
  })
})

describe('dayInPlan', () => {
  it('is 0 on the start day and grows by whole days', () => {
    expect(dayInPlan(plan(), '2024-01-01')).toBe(0)
    expect(dayInPlan(plan(), '2024-01-08')).toBe(7)
  })

  it('is negative before the start date', () => {
    expect(dayInPlan(plan(), '2023-12-25')).toBe(-7)
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    expect(dayInPlan(plan({ startDate: '2024-03-09' }), '2024-04-08')).toBe(30)
  })
})

describe('currentPhase', () => {
  it('is null before the plan starts', () => {
    expect(currentPhase(plan(), '2023-12-31')).toBeNull()
  })

  it('is the first phase on the start day', () => {
    expect(currentPhase(plan(), '2024-01-01')).toBe('vetCheck')
  })

  it('resolves a mid-plan day to the right phase', () => {
    // dormancy spans offsets 31..90 -> 2024-02-01 .. 2024-04-01
    expect(currentPhase(plan(), '2024-02-15')).toBe('dormancy')
  })

  it('is correct on a phase boundary (last day of fasting vs first of coolDown)', () => {
    // fasting ends offset 20 (2024-01-21), coolDown starts offset 21 (2024-01-22)
    expect(currentPhase(plan(), '2024-01-21')).toBe('fasting')
    expect(currentPhase(plan(), '2024-01-22')).toBe('coolDown')
  })

  it('is the last phase on the final day', () => {
    // recovery ends offset 114 -> 2024-04-24
    expect(currentPhase(plan(), '2024-04-24')).toBe('recovery')
  })

  it('is null the day after the plan ends', () => {
    // day 115 is past endOffsetDay 114
    expect(currentPhase(plan(), '2024-04-25')).toBeNull()
  })
})

describe('progressPct', () => {
  it('is 0 on the start day', () => {
    expect(progressPct(plan(), '2024-01-01')).toBe(0)
  })

  it('clamps to 0 before the plan starts', () => {
    expect(progressPct(plan(), '2023-12-01')).toBe(0)
  })

  it('scales linearly against the total length', () => {
    // total 115 days; 23 days elapsed (2024-01-24) -> 20%
    expect(progressPct(plan(), '2024-01-24')).toBeCloseTo(20, 5)
  })

  it('clamps to 100 past the end of the plan', () => {
    expect(progressPct(plan(), '2024-12-01')).toBe(100)
  })
})
