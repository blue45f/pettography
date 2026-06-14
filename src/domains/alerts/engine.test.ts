import { describe, expect, it } from 'vitest'

import { actionableCount, countBySeverity, severityRank, sortAlerts } from './engine'

import type { AlertItem } from './schema'

function item(id: string, severity: AlertItem['severity'], dateISO?: string | null): AlertItem {
  return { id, source: 's', severity, titleKey: 't', dateISO, route: '/x' }
}

describe('severityRank', () => {
  it('orders overdue < due < soon < info', () => {
    expect(severityRank('overdue')).toBeLessThan(severityRank('due'))
    expect(severityRank('due')).toBeLessThan(severityRank('soon'))
    expect(severityRank('soon')).toBeLessThan(severityRank('info'))
  })
})

describe('sortAlerts', () => {
  it('sorts by severity first', () => {
    const out = sortAlerts([item('a', 'info'), item('b', 'overdue'), item('c', 'soon')])
    expect(out.map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('within a tier, earlier date first', () => {
    const out = sortAlerts([item('a', 'due', '2026-03-10'), item('b', 'due', '2026-02-01')])
    expect(out.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('dated items come before undated within a tier', () => {
    const out = sortAlerts([item('a', 'due', null), item('b', 'due', '2026-02-01')])
    expect(out.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('does not mutate the input', () => {
    const input = [item('a', 'info'), item('b', 'overdue')]
    const copy = [...input]
    sortAlerts(input)
    expect(input).toEqual(copy)
  })
})

describe('countBySeverity / actionableCount', () => {
  it('counts each severity', () => {
    const c = countBySeverity([item('a', 'overdue'), item('b', 'overdue'), item('c', 'info')])
    expect(c).toEqual({ overdue: 2, due: 0, soon: 0, info: 1 })
  })

  it('actionableCount excludes info', () => {
    expect(actionableCount([item('a', 'overdue'), item('b', 'soon'), item('c', 'info')])).toBe(2)
  })

  it('empty → all zero / 0', () => {
    expect(countBySeverity([])).toEqual({ overdue: 0, due: 0, soon: 0, info: 0 })
    expect(actionableCount([])).toBe(0)
  })
})
