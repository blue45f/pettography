import { describe, expect, it } from 'vitest'

import {
  addDays,
  daysBetween,
  daysUntil,
  dustingStats,
  dustingStatus,
  latestByType,
  nextDusting,
} from './engine'

import type { DustingLog, SupplementType } from './schema'

let seq = 0
function log(type: SupplementType, dustedAt: string, createdAt?: string): DustingLog {
  seq += 1
  return {
    id: `d${seq}`,
    petId: null,
    speciesId: null,
    type,
    dustedAt,
    note: '',
    createdAt: createdAt ?? `2024-01-01T00:00:0${seq % 10}.000Z`,
  }
}

describe('daysBetween / addDays', () => {
  it('counts whole days forward and backward', () => {
    expect(daysBetween('2024-01-01', '2024-01-08')).toBe(7)
    expect(daysBetween('2024-01-08', '2024-01-01')).toBe(-7)
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    expect(daysBetween('2024-03-09', '2024-04-08')).toBe(30)
  })

  it('addDays round-trips with daysBetween', () => {
    expect(addDays('2024-01-01', 7)).toBe('2024-01-08')
    expect(daysBetween('2024-01-01', addDays('2024-01-01', 7))).toBe(7)
  })
})

describe('nextDusting', () => {
  it('adds the cadence to the last dusting date', () => {
    expect(nextDusting('2024-01-01', 2)).toBe('2024-01-03')
    expect(nextDusting('2024-01-31', 7)).toBe('2024-02-07')
  })

  it('tolerates a full ISO timestamp by using the day part', () => {
    expect(nextDusting('2024-01-01T18:30:00.000Z', 7)).toBe('2024-01-08')
  })
})

describe('daysUntil', () => {
  it('is positive before the date', () => {
    expect(daysUntil('2024-01-10', '2024-01-07')).toBe(3)
  })

  it('is zero on the day', () => {
    expect(daysUntil('2024-01-07', '2024-01-07')).toBe(0)
  })

  it('goes negative once past', () => {
    expect(daysUntil('2024-01-05', '2024-01-09')).toBe(-4)
  })
})

describe('dustingStatus', () => {
  it('reports never when there is no last dusting', () => {
    expect(dustingStatus(null, 2, '2024-01-10')).toBe('never')
    expect(dustingStatus(undefined, 7, '2024-01-10')).toBe('never')
    expect(dustingStatus('', 7, '2024-01-10')).toBe('never')
  })

  it('reports due on the due day', () => {
    // dusted 01-01, interval 2 → due 01-03
    expect(dustingStatus('2024-01-01', 2, '2024-01-03')).toBe('due')
  })

  it('reports due once overdue', () => {
    expect(dustingStatus('2024-01-01', 2, '2024-01-09')).toBe('due')
  })

  it('reports soon within the soon window', () => {
    // due 01-03, today 01-02 → 1 day out → soon
    expect(dustingStatus('2024-01-01', 2, '2024-01-02')).toBe('soon')
  })

  it('reports ok comfortably ahead', () => {
    // due 01-08, today 01-02 → 6 days out → ok
    expect(dustingStatus('2024-01-01', 7, '2024-01-02')).toBe('ok')
  })
})

describe('latestByType', () => {
  it('returns null when no logs of that type exist', () => {
    expect(latestByType([log('calcium', '2024-01-01')], 'multivitamin')).toBeNull()
    expect(latestByType([], 'calcium')).toBeNull()
  })

  it('returns the most recent log of the requested type', () => {
    const logs = [
      log('calcium', '2024-01-01'),
      log('calcium', '2024-03-01'),
      log('calciumD3', '2024-04-01'),
      log('calcium', '2024-02-01'),
    ]
    expect(latestByType(logs, 'calcium')?.dustedAt).toBe('2024-03-01')
    expect(latestByType(logs, 'calciumD3')?.dustedAt).toBe('2024-04-01')
  })

  it('breaks same-day ties by the later createdAt', () => {
    const earlier = log('multivitamin', '2024-05-01', '2024-05-01T08:00:00.000Z')
    const later = log('multivitamin', '2024-05-01', '2024-05-01T20:00:00.000Z')
    expect(latestByType([earlier, later], 'multivitamin')?.id).toBe(later.id)
    // Order of the input array must not change the winner.
    expect(latestByType([later, earlier], 'multivitamin')?.id).toBe(later.id)
  })
})

describe('dustingStats', () => {
  it('returns zeros and a null lastDusted for no logs', () => {
    expect(dustingStats([])).toEqual({
      total: 0,
      byType: { calcium: 0, calciumD3: 0, multivitamin: 0 },
      lastDusted: null,
    })
  })

  it('counts per type and reports the latest dusting date', () => {
    const logs = [
      log('calcium', '2024-01-01'),
      log('calcium', '2024-03-05'),
      log('calciumD3', '2024-02-10'),
      log('multivitamin', '2024-01-20'),
    ]
    const stats = dustingStats(logs)
    expect(stats.total).toBe(4)
    expect(stats.byType).toEqual({ calcium: 2, calciumD3: 1, multivitamin: 1 })
    expect(stats.lastDusted).toBe('2024-03-05')
  })
})
