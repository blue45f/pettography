import { describe, expect, it } from 'vitest'

import { cleanStatus, cleaningStats, daysUntil, latestByType, nextDue } from './engine'

import type { CleaningLog, CleanType } from './schema'

let seq = 0
function log(type: CleanType, cleanedAt: string): CleaningLog {
  seq += 1
  return {
    id: `c${seq}`,
    petId: null,
    speciesId: null,
    type,
    cleanedAt,
    note: '',
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('latestByType', () => {
  it('returns null when no log of that type exists', () => {
    expect(latestByType([], 'spot')).toBeNull()
    expect(latestByType([log('full', '2024-03-01')], 'spot')).toBeNull()
  })

  it('returns the most recent log of the requested type, ignoring others', () => {
    const logs = [
      log('spot', '2024-03-01'),
      log('full', '2024-04-01'),
      log('spot', '2024-03-15'),
      log('spot', '2024-02-01'),
    ]
    const latest = latestByType(logs, 'spot')
    expect(latest?.cleanedAt).toBe('2024-03-15')
  })

  it('is order-independent', () => {
    const logs = [
      log('water', '2024-01-10'),
      log('water', '2024-05-20'),
      log('water', '2024-03-03'),
    ]
    expect(latestByType(logs, 'water')?.cleanedAt).toBe('2024-05-20')
  })
})

describe('nextDue', () => {
  it('adds the interval to the last clean date', () => {
    expect(nextDue('2024-01-01', 7)).toBe('2024-01-08')
    expect(nextDue('2024-01-31', 30)).toBe('2024-03-01')
  })

  it('tolerates a full ISO timestamp by using the day part', () => {
    expect(nextDue('2024-01-01T18:30:00.000Z', 14)).toBe('2024-01-15')
  })

  it('crosses a DST boundary without drift (UTC math)', () => {
    expect(nextDue('2024-03-09', 30)).toBe('2024-04-08')
  })
})

describe('daysUntil', () => {
  it('is positive for a future date', () => {
    expect(daysUntil('2024-01-08', '2024-01-05')).toBe(3)
  })

  it('is zero for today', () => {
    expect(daysUntil('2024-01-08', '2024-01-08')).toBe(0)
  })

  it('goes negative for a past date', () => {
    expect(daysUntil('2024-01-08', '2024-01-12')).toBe(-4)
  })
})

describe('cleanStatus', () => {
  it('is never when nothing has been logged', () => {
    expect(cleanStatus(null, 7, '2024-01-10')).toBe('never')
  })

  it('is due on the due day and once overdue', () => {
    // last 2024-01-01 + 7 = due 2024-01-08
    expect(cleanStatus('2024-01-01', 7, '2024-01-08')).toBe('due')
    expect(cleanStatus('2024-01-01', 7, '2024-01-20')).toBe('due')
  })

  it('is soon within the soon window', () => {
    // due 2024-01-08; one and two days out are soon (window = 2)
    expect(cleanStatus('2024-01-01', 7, '2024-01-07')).toBe('soon')
    expect(cleanStatus('2024-01-01', 7, '2024-01-06')).toBe('soon')
  })

  it('is ok when comfortably ahead of due', () => {
    expect(cleanStatus('2024-01-01', 7, '2024-01-02')).toBe('ok')
    expect(cleanStatus('2024-01-01', 7, '2024-01-05')).toBe('ok')
  })
})

describe('cleaningStats', () => {
  it('returns zeros and a null lastCleaned for no logs', () => {
    expect(cleaningStats([])).toEqual({
      total: 0,
      byType: { spot: 0, full: 0, substrate: 0, water: 0 },
      lastCleaned: null,
    })
  })

  it('counts each type and reports the latest clean date across types', () => {
    const logs = [
      log('spot', '2024-01-01'),
      log('spot', '2024-02-10'),
      log('full', '2024-03-01'),
      log('water', '2024-02-20'),
    ]
    const stats = cleaningStats(logs)
    expect(stats.total).toBe(4)
    expect(stats.byType).toEqual({ spot: 2, full: 1, substrate: 0, water: 1 })
    expect(stats.lastCleaned).toBe('2024-03-01')
  })
})
