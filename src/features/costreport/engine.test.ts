import { describe, it, expect } from 'vitest'

import {
  annualTotal,
  grandTotal,
  monthlyAverage,
  projectedAnnual,
  recordedMonthCount,
  totalsByCategory,
  totalsByMonth,
  totalsByPet,
  type ReportExpense,
} from './engine'

const sample: ReportExpense[] = [
  { amountKrw: 10000, category: 'feeding', month: '2025-01', petId: 'pet-a' },
  { amountKrw: 5000, category: 'feeding', month: '2025-02', petId: 'pet-a' },
  { amountKrw: 30000, category: 'gear', month: '2025-01', petId: 'pet-b' },
  { amountKrw: 2000, category: 'medical', month: '2025-03', petId: null },
  { amountKrw: 8000, category: 'gear', month: '2024-12', petId: 'pet-a' },
]

describe('totalsByCategory', () => {
  it('sums per category sorted descending', () => {
    expect(totalsByCategory(sample)).toEqual([
      { category: 'gear', totalKrw: 38000 },
      { category: 'feeding', totalKrw: 15000 },
      { category: 'medical', totalKrw: 2000 },
    ])
  })

  it('returns [] for empty input', () => {
    expect(totalsByCategory([])).toEqual([])
  })
})

describe('totalsByMonth', () => {
  it('sums per month ascending', () => {
    expect(totalsByMonth(sample)).toEqual([
      { month: '2024-12', totalKrw: 8000 },
      { month: '2025-01', totalKrw: 40000 },
      { month: '2025-02', totalKrw: 5000 },
      { month: '2025-03', totalKrw: 2000 },
    ])
  })

  it('returns [] for empty input', () => {
    expect(totalsByMonth([])).toEqual([])
  })
})

describe('totalsByPet', () => {
  it('sums per pet sorted descending, keeping null bucket', () => {
    expect(totalsByPet(sample)).toEqual([
      { petId: 'pet-b', totalKrw: 30000 },
      { petId: 'pet-a', totalKrw: 23000 },
      { petId: null, totalKrw: 2000 },
    ])
  })

  it('returns [] for empty input', () => {
    expect(totalsByPet([])).toEqual([])
  })
})

describe('grandTotal', () => {
  it('sums every expense', () => {
    expect(grandTotal(sample)).toBe(55000)
  })

  it('is 0 for empty input', () => {
    expect(grandTotal([])).toBe(0)
  })
})

describe('annualTotal', () => {
  it('sums only the requested year (UTC)', () => {
    expect(annualTotal(sample, 2025)).toBe(47000)
    expect(annualTotal(sample, 2024)).toBe(8000)
  })

  it('is 0 for a year with no expenses', () => {
    expect(annualTotal(sample, 2023)).toBe(0)
    expect(annualTotal([], 2025)).toBe(0)
  })
})

describe('monthlyAverage', () => {
  it('averages across months that have records and rounds', () => {
    // 55000 across 4 distinct months -> 13750
    expect(monthlyAverage(sample)).toBe(13750)
  })

  it('is 0 for empty input (no divide by zero)', () => {
    expect(monthlyAverage([])).toBe(0)
  })
})

describe('recordedMonthCount', () => {
  it('counts distinct months', () => {
    expect(recordedMonthCount(sample)).toBe(4)
  })

  it('is 0 for empty input', () => {
    expect(recordedMonthCount([])).toBe(0)
  })
})

describe('projectedAnnual', () => {
  it('extrapolates current-year spend over elapsed months to 12', () => {
    // In 2025, 47000 spent. As of end of March (month index 2 -> 3 elapsed):
    // 47000 / 3 * 12 = 188000
    expect(projectedAnnual(sample, '2025-03-15')).toBe(188000)
  })

  it('uses the full year by December', () => {
    // 12 elapsed months -> projection equals annual total
    expect(projectedAnnual(sample, '2025-12-31')).toBe(47000)
  })

  it('is 0 when the current year has no spend', () => {
    expect(projectedAnnual(sample, '2026-06-01')).toBe(0)
    expect(projectedAnnual([], '2025-06-01')).toBe(0)
  })

  it('handles a longer ISO timestamp by slicing to the day', () => {
    expect(projectedAnnual(sample, '2025-03-15T08:30:00.000Z')).toBe(188000)
  })
})
