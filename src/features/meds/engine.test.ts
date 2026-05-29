import { describe, expect, it } from 'vitest'

import {
  addDays,
  courseEndDate,
  courseProgress,
  daysBetween,
  doseStatusCode,
  givenDoses,
  isDoseGiven,
  nextDoseDate,
  quarantineDaysRemaining,
  quarantineDoneCode,
  quarantineEndDate,
  quarantineProgress,
  scheduledDoseDates,
} from './engine'

import type { DoseRecord, Medication, Quarantine } from './schema'

function med(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'm1',
    petId: null,
    name: 'Panacur',
    reason: '구충',
    dosage: '0.1ml',
    startedAt: '2024-01-01',
    frequencyDays: 3,
    durationDays: 10,
    notes: '',
    doses: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function given(...dates: string[]): DoseRecord[] {
  return dates.map((date) => ({ date, given: true }))
}

function quarantine(overrides: Partial<Quarantine> = {}): Quarantine {
  return {
    id: 'q1',
    petId: null,
    animalName: '신규 레오파드게코',
    startedAt: '2024-01-01',
    durationDays: 30,
    reasonCode: 'newArrival',
    clearedAt: null,
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('daysBetween / addDays (UTC)', () => {
  it('counts whole days forward and back', () => {
    expect(daysBetween('2024-01-01', '2024-01-31')).toBe(30)
    expect(daysBetween('2024-02-01', '2024-01-01')).toBe(-31)
  })

  it('is zero for the same day and tolerates timestamps', () => {
    expect(daysBetween('2024-03-10', '2024-03-10')).toBe(0)
    expect(daysBetween('2024-03-10T18:00:00Z', '2024-03-11T02:00:00Z')).toBe(1)
  })

  it('crosses a DST boundary without drift', () => {
    expect(daysBetween('2024-03-09', '2024-04-08')).toBe(30)
  })

  it('addDays round-trips with daysBetween', () => {
    expect(addDays('2024-01-01', 45)).toBe('2024-02-15')
    expect(daysBetween('2024-01-01', addDays('2024-01-01', 45))).toBe(45)
  })
})

describe('courseEndDate', () => {
  it('is the inclusive final day for a bounded course', () => {
    // 10 calendar days starting Jan 1 → Jan 1..Jan 10.
    expect(courseEndDate(med({ durationDays: 10 }))).toBe('2024-01-10')
    expect(courseEndDate(med({ durationDays: 1 }))).toBe('2024-01-01')
  })

  it('is null for an open-ended course', () => {
    expect(courseEndDate(med({ durationDays: null }))).toBeNull()
  })
})

describe('scheduledDoseDates', () => {
  it('steps by frequency and stops at the course end', () => {
    expect(scheduledDoseDates(med({ frequencyDays: 3, durationDays: 10 }), '2024-01-20')).toEqual([
      '2024-01-01',
      '2024-01-04',
      '2024-01-07',
      '2024-01-10',
    ])
  })

  it('for an open-ended course returns past doses plus one upcoming', () => {
    const dates = scheduledDoseDates(med({ durationDays: null, frequencyDays: 7 }), '2024-01-10')
    // Doses on Jan 1 and Jan 8 are <= today; Jan 15 is the single upcoming one.
    expect(dates).toEqual(['2024-01-01', '2024-01-08', '2024-01-15'])
  })
})

describe('nextDoseDate stepping', () => {
  it('returns the first dose when today is on the start', () => {
    expect(nextDoseDate(med(), '2024-01-01')).toBe('2024-01-01')
  })

  it('returns the first dose when today precedes the start', () => {
    expect(nextDoseDate(med(), '2023-12-25')).toBe('2024-01-01')
  })

  it('advances to the next un-given dose once earlier doses are recorded', () => {
    const m = med({ doses: given('2024-01-01') })
    expect(nextDoseDate(m, '2024-01-04')).toBe('2024-01-04')
    expect(nextDoseDate(med({ doses: given('2024-01-01', '2024-01-04') }), '2024-01-05')).toBe(
      '2024-01-07',
    )
  })

  it('surfaces the earliest missed dose (overdue) when nothing is given', () => {
    // Today is between scheduled doses but the first was never recorded.
    expect(nextDoseDate(med(), '2024-01-02')).toBe('2024-01-01')
  })

  it('returns null once every scheduled dose is given', () => {
    const m = med({ doses: given('2024-01-01', '2024-01-04', '2024-01-07', '2024-01-10') })
    expect(nextDoseDate(m, '2024-01-10')).toBeNull()
  })

  it('returns null once the course end has passed', () => {
    expect(nextDoseDate(med({ durationDays: 10 }), '2024-02-01')).toBeNull()
  })

  it('keeps producing the next dose for an open-ended course', () => {
    const m = med({ durationDays: null, frequencyDays: 1, doses: given('2024-01-01') })
    expect(nextDoseDate(m, '2024-01-01')).toBe('2024-01-02')
  })
})

describe('doseStatusCode', () => {
  it('is dueToday when the next dose is today', () => {
    expect(doseStatusCode(med(), '2024-01-01')).toBe('dueToday')
  })

  it('is overdue when the next un-given dose is in the past', () => {
    expect(doseStatusCode(med(), '2024-01-02')).toBe('overdue')
  })

  it('is upcoming when the next dose is in the future', () => {
    expect(doseStatusCode(med({ doses: given('2024-01-01') }), '2024-01-02')).toBe('upcoming')
  })

  it('is done when the course is finished', () => {
    expect(doseStatusCode(med({ durationDays: 10 }), '2024-02-01')).toBe('done')
  })
})

describe('courseProgress', () => {
  it('grows from day one to 100% on the final day', () => {
    expect(courseProgress(med({ durationDays: 10 }), '2024-01-01')).toBe(10)
    expect(courseProgress(med({ durationDays: 10 }), '2024-01-05')).toBe(50)
    expect(courseProgress(med({ durationDays: 10 }), '2024-01-10')).toBe(100)
  })

  it('clamps past the end and before the start', () => {
    expect(courseProgress(med({ durationDays: 10 }), '2024-03-01')).toBe(100)
    expect(courseProgress(med({ durationDays: 10 }), '2023-12-01')).toBe(0)
  })

  it('is 0 for an open-ended course (no finish line)', () => {
    expect(courseProgress(med({ durationDays: null }), '2024-01-05')).toBe(0)
  })
})

describe('dose records', () => {
  it('isDoseGiven matches a recorded given date and tolerates timestamps', () => {
    const m = med({ doses: given('2024-01-04') })
    expect(isDoseGiven(m, '2024-01-04')).toBe(true)
    expect(isDoseGiven(m, '2024-01-04T09:00:00Z')).toBe(true)
    expect(isDoseGiven(m, '2024-01-05')).toBe(false)
  })

  it('givenDoses lists given dates newest-first', () => {
    const m = med({
      doses: [
        { date: '2024-01-01', given: true },
        { date: '2024-01-04', given: false },
        { date: '2024-01-07', given: true },
      ],
    })
    expect(givenDoses(m)).toEqual(['2024-01-07', '2024-01-01'])
  })
})

describe('quarantine end / remaining', () => {
  it('end date is the inclusive final day', () => {
    expect(quarantineEndDate(quarantine({ durationDays: 30 }))).toBe('2024-01-30')
  })

  it('reports the full duration on day one', () => {
    expect(quarantineDaysRemaining(quarantine({ durationDays: 30 }), '2024-01-01')).toBe(30)
  })

  it('counts down as days pass and never goes negative', () => {
    expect(quarantineDaysRemaining(quarantine({ durationDays: 30 }), '2024-01-15')).toBe(16)
    expect(quarantineDaysRemaining(quarantine({ durationDays: 30 }), '2024-01-31')).toBe(0)
    expect(quarantineDaysRemaining(quarantine({ durationDays: 30 }), '2024-03-01')).toBe(0)
  })
})

describe('quarantineProgress', () => {
  it('grows from day one toward 100%', () => {
    expect(quarantineProgress(quarantine({ durationDays: 30 }), '2024-01-01')).toBe(3)
    expect(quarantineProgress(quarantine({ durationDays: 30 }), '2024-01-30')).toBe(100)
    expect(quarantineProgress(quarantine({ durationDays: 30 }), '2024-02-15')).toBe(100)
  })
})

describe('quarantineDoneCode', () => {
  it('is active while days remain', () => {
    expect(quarantineDoneCode(quarantine(), '2024-01-15')).toBe('active')
  })

  it('is readyToClear once the duration has elapsed', () => {
    expect(quarantineDoneCode(quarantine({ durationDays: 30 }), '2024-01-31')).toBe('readyToClear')
  })

  it('is cleared whenever clearedAt is set, regardless of date', () => {
    expect(quarantineDoneCode(quarantine({ clearedAt: '2024-01-10' }), '2024-01-15')).toBe(
      'cleared',
    )
  })
})
