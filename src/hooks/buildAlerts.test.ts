import { describe, expect, it } from 'vitest'

import { buildAlerts, type BuildAlertsInput } from './useAggregatedAlerts'

import type { BcsEntry } from '@features/bcs'
import type { CleaningLog, CleanType } from '@features/cleaning'
import type { GearItem, GearType } from '@features/gear'
import type { VaccinationEntry } from '@features/health'
import type { DustingLog, SupplementType } from '@features/supplements'
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

function dustingLog(type: SupplementType, dustedAt: string): DustingLog {
  return {
    id: `d-${type}-${dustedAt}`,
    petId: 'pet-1',
    speciesId: 'sp-1',
    type,
    dustedAt,
    note: '',
    createdAt: `${dustedAt}T00:00:00.000Z`,
  }
}

function cleaningLog(type: CleanType, cleanedAt: string): CleaningLog {
  return {
    id: `c-${type}-${cleanedAt}`,
    petId: 'pet-1',
    speciesId: 'sp-1',
    type,
    cleanedAt,
    note: '',
    createdAt: `${cleanedAt}T00:00:00.000Z`,
  }
}

function gearItem(
  typeId: GearType,
  name: string,
  installedAt: string,
  intervalMonths: number,
): GearItem {
  return {
    id: `g-${typeId}`,
    petId: 'pet-1',
    typeId,
    name,
    installedAt,
    intervalMonths,
    notes: '',
    createdAt: `${installedAt}T00:00:00.000Z`,
  }
}

/** `nextDueAt` far in the past keeps the verdict deterministic vs the real clock. */
function vaccinationEntry(nextDueAt: string): VaccinationEntry {
  return {
    id: `vac-${nextDueAt}`,
    petId: 'pet-1',
    kind: 'vaccine',
    name: 'Rabies',
    administeredAt: '2019-12-01',
    nextDueAt,
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

  it('flags an overdue supplement dusting (schedule override) as due', () => {
    const alerts = buildAlerts(
      emptyInput({ dustings: [dustingLog('calcium', '2024-05-01')], supSchedule: { calcium: 2 } }),
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'supplement-calcium',
      source: 'supplements',
      severity: 'due',
      titleKey: 'alerts.items.supplementDue',
      route: '/supplements',
      params: { type: 'supplements.types.calcium' },
    })
  })

  it('flags an overdue routine clean as due (and ignores never-cleaned types)', () => {
    const alerts = buildAlerts(emptyInput({ cleanings: [cleaningLog('spot', '2024-01-01')] }))
    expect(alerts.map((a) => a.id)).toEqual(['cleaning-spot'])
    expect(alerts[0]).toMatchObject({
      source: 'cleaning',
      severity: 'due',
      titleKey: 'alerts.items.cleaningDue',
      route: '/cleaning',
      params: { type: 'cleaning.types.spot' },
    })
  })

  it('flags an overdue gear replacement, carrying the item id into the alert id', () => {
    const alerts = buildAlerts(emptyInput({ gear: [gearItem('uvbBulb', 'UVB', '2024-01-01', 1)] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'gear-g-uvbBulb',
      source: 'gear',
      severity: 'overdue',
      titleKey: 'alerts.items.gearOverdue',
      route: '/gear',
      params: { name: 'UVB' },
    })
  })

  it('flags an overdue vaccination booster', () => {
    const alerts = buildAlerts(emptyInput({ vaccinations: [vaccinationEntry('2020-01-01')] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      source: 'health',
      severity: 'overdue',
      titleKey: 'alerts.items.vaccinationOverdue',
      route: '/health',
      params: { name: 'Rabies' },
    })
  })

  it('sorts the merged alerts by urgency: overdue, then due, then soon', () => {
    const alerts = buildAlerts(
      emptyInput({
        bcs: [bcsEntry(5)], // soon
        dustings: [dustingLog('calcium', '2024-05-01')], // due
        supSchedule: { calcium: 2 },
        vaccinations: [vaccinationEntry('2020-01-01')], // overdue
      }),
    )
    expect(alerts.map((a) => a.severity)).toEqual(['overdue', 'due', 'soon'])
  })
})
