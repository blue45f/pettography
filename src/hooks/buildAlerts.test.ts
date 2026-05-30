import { describe, expect, it } from 'vitest'

import { buildAlerts, type BuildAlertsInput } from './useAggregatedAlerts'

import type { BcsEntry } from '@features/bcs'
import type { TFunction } from 'i18next'

/** Identity stub: returns the key so we can assert which i18n key was chosen. */
const t = ((key: string) => key) as unknown as TFunction

function emptyInput(overrides: Partial<BuildAlertsInput> = {}): BuildAlertsInput {
  return {
    meds: [],
    quarantines: [],
    gear: [],
    clutches: [],
    molts: [],
    readings: [],
    plans: [],
    bcs: [],
    dustings: [],
    cleanings: [],
    vaccinations: [],
    supSchedule: {},
    category: null,
    speciesList: [],
    today: '2024-06-01',
    t,
    ...overrides,
  }
}

function bcsEntry(score: number, assessedAt = '2024-06-01'): BcsEntry {
  return {
    id: `bcs-${score}-${assessedAt}`,
    petId: 'pet-1',
    speciesId: 'sp-1',
    assessedAt,
    score,
    note: '',
    createdAt: `${assessedAt}T00:00:00.000Z`,
  }
}

describe('buildAlerts', () => {
  it('returns no alerts for all-empty input', () => {
    expect(buildAlerts(emptyInput())).toEqual([])
  })

  it('flags a latest BCS outside the ideal band as a welfare alert', () => {
    const alerts = buildAlerts(emptyInput({ bcs: [bcsEntry(5)] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'bcs-off',
      source: 'bcs',
      severity: 'soon',
      titleKey: 'alerts.items.bcsOff',
      route: '/bcs',
      params: { status: 'bcs.status.over' },
    })
  })

  it('does not flag an ideal BCS', () => {
    expect(buildAlerts(emptyInput({ bcs: [bcsEntry(3)] }))).toEqual([])
  })

  it('uses the latest BCS entry by date for the welfare flag', () => {
    const alerts = buildAlerts(
      emptyInput({ bcs: [bcsEntry(3, '2024-05-01'), bcsEntry(1, '2024-06-01')] }),
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].params).toEqual({ status: 'bcs.status.under' })
  })
})
