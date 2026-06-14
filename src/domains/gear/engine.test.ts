import { describe, expect, it } from 'vitest'

import { addMonths, daysUntilDue, dueDate, gearStatus, lifePct, sortByUrgency } from './engine'

import type { GearItem, GearType } from './schema'

let seq = 0
function item(installedAt: string, intervalMonths: number, typeId: GearType = 'uvbBulb'): GearItem {
  seq += 1
  return {
    id: `g${seq}`,
    petId: null,
    typeId,
    name: `gear-${seq}`,
    installedAt,
    intervalMonths,
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('addMonths', () => {
  it('adds whole months within the same year', () => {
    expect(addMonths('2024-01-15', 6)).toBe('2024-07-15')
  })

  it('rolls over the year boundary', () => {
    expect(addMonths('2024-10-10', 6)).toBe('2025-04-10')
    expect(addMonths('2024-12-31', 1)).toBe('2025-01-31')
  })

  it('clamps the day when the target month is shorter (Jan 31 + 1mo)', () => {
    // 2024 is a leap year -> Feb 29
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    // 2023 is not -> Feb 28
    expect(addMonths('2023-01-31', 1)).toBe('2023-02-28')
  })

  it('clamps into a 30-day month (Aug 31 + 1mo -> Sep 30)', () => {
    expect(addMonths('2024-08-31', 1)).toBe('2024-09-30')
  })

  it('ignores any time component on the input', () => {
    expect(addMonths('2024-01-31T18:30:00Z', 1)).toBe('2024-02-29')
  })
})

describe('dueDate', () => {
  it('is installedAt + intervalMonths', () => {
    expect(dueDate(item('2024-01-01', 6))).toBe('2024-07-01')
  })

  it('applies day-of-month clamping (UVB installed Jan 31, 1mo)', () => {
    expect(dueDate(item('2024-01-31', 1))).toBe('2024-02-29')
  })

  it('returns null for an interval of 0 (monitor-only)', () => {
    expect(dueDate(item('2024-01-01', 0, 'thermostat'))).toBeNull()
  })
})

describe('daysUntilDue', () => {
  it('counts whole days to the due date', () => {
    // installed 2024-01-01, 6mo -> due 2024-07-01; today 2024-06-01 -> 30 days
    expect(daysUntilDue(item('2024-01-01', 6), '2024-06-01')).toBe(30)
  })

  it('is zero exactly on the due date', () => {
    expect(daysUntilDue(item('2024-01-01', 6), '2024-07-01')).toBe(0)
  })

  it('goes negative once overdue', () => {
    expect(daysUntilDue(item('2024-01-01', 6), '2024-07-15')).toBe(-14)
  })

  it('is null for monitor-only items', () => {
    expect(daysUntilDue(item('2024-01-01', 0, 'thermostat'), '2024-06-01')).toBeNull()
  })
})

describe('gearStatus', () => {
  it('is monitor when the interval is 0', () => {
    expect(gearStatus(item('2024-01-01', 0, 'thermostat'), '2030-01-01')).toBe('monitor')
  })

  it('is overdue when today is past the due date', () => {
    expect(gearStatus(item('2024-01-01', 6), '2024-07-02')).toBe('overdue')
  })

  it('is soon within 14 days (inclusive at the boundary)', () => {
    // due 2024-07-01; 14 days before is 2024-06-17
    expect(gearStatus(item('2024-01-01', 6), '2024-06-17')).toBe('soon')
    expect(gearStatus(item('2024-01-01', 6), '2024-06-30')).toBe('soon')
  })

  it('is soon on the due date itself (0 days)', () => {
    expect(gearStatus(item('2024-01-01', 6), '2024-07-01')).toBe('soon')
  })

  it('is ok when due more than 14 days out', () => {
    // 15 days before due 2024-07-01 is 2024-06-16
    expect(gearStatus(item('2024-01-01', 6), '2024-06-16')).toBe('ok')
  })
})

describe('lifePct', () => {
  it('is 0 on the install date', () => {
    expect(lifePct(item('2024-01-01', 6), '2024-01-01')).toBe(0)
  })

  it('is ~50 at the interval midpoint', () => {
    // installed 2024-01-01, due 2024-07-01 (182 days); halfway ~ 2024-04-01 (91 days)
    const pct = lifePct(item('2024-01-01', 6), '2024-04-01')
    expect(pct).not.toBeNull()
    expect(pct).toBeGreaterThan(45)
    expect(pct).toBeLessThan(55)
  })

  it('clamps to 100 past the due date', () => {
    expect(lifePct(item('2024-01-01', 6), '2025-01-01')).toBe(100)
  })

  it('clamps to 0 before the install date', () => {
    expect(lifePct(item('2024-01-01', 6), '2023-12-01')).toBe(0)
  })

  it('is null for monitor-only items', () => {
    expect(lifePct(item('2024-01-01', 0, 'thermostat'), '2024-06-01')).toBeNull()
  })
})

describe('sortByUrgency', () => {
  it('orders overdue -> soon -> ok -> monitor', () => {
    const today = '2024-06-20'
    const overdue = item('2024-01-01', 1) // due 2024-02-01 -> overdue
    const soon = item('2024-01-01', 6) // due 2024-07-01 -> 11 days -> soon
    const ok = item('2024-06-01', 6) // due 2024-12-01 -> ok
    const monitor = item('2024-01-01', 0, 'thermostat') // monitor

    const sorted = sortByUrgency([ok, monitor, soon, overdue], today)
    expect(sorted.map((g) => gearStatus(g, today))).toEqual(['overdue', 'soon', 'ok', 'monitor'])
  })

  it('breaks ties within a status by soonest due date', () => {
    const today = '2024-06-01'
    const dueLater = item('2024-01-01', 6) // due 2024-07-01
    const dueSooner = item('2023-12-01', 6) // due 2024-06-01
    const sorted = sortByUrgency([dueLater, dueSooner], today)
    expect(sorted.map((g) => dueDate(g))).toEqual(['2024-06-01', '2024-07-01'])
  })

  it('does not mutate the input array', () => {
    const today = '2024-06-20'
    const input = [item('2024-06-01', 6), item('2024-01-01', 1)]
    const before = input.map((g) => g.id)
    sortByUrgency(input, today)
    expect(input.map((g) => g.id)).toEqual(before)
  })
})
