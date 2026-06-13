import { describe, expect, it } from 'vitest'

import { buildAlerts, type BuildAlertsInput } from './useAggregatedAlerts'

import type { BcsEntry } from '@domains/bcs'
import type { Clutch } from '@domains/breeding'
import type { BrumationPlan } from '@domains/brumation'
import type { CleaningLog, CleanType } from '@domains/cleaning'
import type { GearItem, GearType } from '@domains/gear'
import type { VaccinationEntry } from '@domains/health'
import type { Medication, Quarantine } from '@domains/meds'
import type { MoltEvent } from '@domains/molt'
import type { DustingLog, SupplementType } from '@domains/supplements'
import type { WaterReading } from '@domains/water'
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

/** Started long ago with no clearedAt → past its duration, so ready to clear. */
function quarantine(startedAt: string, durationDays: number): Quarantine {
  return {
    id: 'q1',
    petId: 'pet-1',
    animalName: 'New gecko',
    startedAt,
    durationDays,
    reasonCode: 'newArrival',
    clearedAt: null,
    notes: '',
    createdAt: `${startedAt}T00:00:00.000Z`,
  }
}

function completeMolt(occurredAt: string): MoltEvent {
  return {
    id: `molt-${occurredAt}`,
    petId: 'pet-1',
    speciesId: 'sp-1',
    occurredAt,
    kind: 'complete',
    notes: '',
    createdAt: `${occurredAt}T00:00:00.000Z`,
  }
}

/** `incubationRef` falls back for an unknown species, so no slug data is needed. */
function clutch(laidAt: string): Clutch {
  return {
    id: 'c1',
    petId: 'pet-1',
    pairingId: null,
    speciesId: null,
    laidAt,
    eggCount: 3,
    fertileCount: null,
    incubationTempC: null,
    status: 'incubating',
    notes: '',
    createdAt: `${laidAt}T00:00:00.000Z`,
  }
}

/** Phase overrides empty → the engine uses template defaults for the schedule. */
function brumationPlan(startDate: string): BrumationPlan {
  return {
    id: 'b1',
    petId: 'pet-1',
    speciesId: 'sp-1',
    startDate,
    phaseDays: {},
    targetTempC: null,
    notes: '',
    createdAt: `${startDate}T00:00:00.000Z`,
  }
}

/** Open-ended course with no doses logged → the first scheduled dose is overdue. */
function medication(startedAt: string, frequencyDays: number): Medication {
  return {
    id: 'm1',
    petId: 'pet-1',
    name: 'Baytril',
    reason: 'infection',
    dosage: '0.1ml',
    startedAt,
    frequencyDays,
    durationDays: null,
    notes: '',
    doses: [],
    createdAt: `${startedAt}T00:00:00.000Z`,
  }
}

function waterReading(measuredAt: string, ammoniaPpm: number): WaterReading {
  return {
    id: `w-${measuredAt}`,
    petId: 'pet-1',
    speciesId: 'sp-1',
    measuredAt,
    tempC: null,
    ph: null,
    ammoniaPpm,
    nitritePpm: null,
    nitratePpm: null,
    note: '',
    createdAt: `${measuredAt}T00:00:00.000Z`,
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

  it('flags a clutch overdue to hatch (incubation window past)', () => {
    const alerts = buildAlerts(emptyInput({ clutches: [clutch('2024-01-01')] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'clutch-c1',
      source: 'breeding',
      severity: 'overdue',
      titleKey: 'alerts.items.clutchOverdue',
      route: '/breeding',
    })
  })

  it('flags a quarantine that is ready to clear', () => {
    const alerts = buildAlerts(emptyInput({ quarantines: [quarantine('2024-01-01', 30)] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'quarantine-q1',
      source: 'meds',
      severity: 'due',
      titleKey: 'alerts.items.quarantineReady',
      route: '/meds',
      params: { name: 'New gecko' },
    })
  })

  it('flags an overdue molt prediction from the logged cadence', () => {
    const alerts = buildAlerts(
      emptyInput({
        molts: [completeMolt('2024-01-01'), completeMolt('2024-02-01'), completeMolt('2024-03-01')],
      }),
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'molt-overdue',
      source: 'molt',
      severity: 'overdue',
      titleKey: 'alerts.items.moltOverdue',
      route: '/molt',
    })
  })

  it('flags an in-progress brumation phase as an info alert', () => {
    const alerts = buildAlerts(emptyInput({ plans: [brumationPlan('2024-05-25')] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'brumation-b1',
      source: 'brumation',
      severity: 'info',
      titleKey: 'alerts.items.brumationPhase',
      route: '/brumation',
    })
  })

  it('flags an overdue, un-given medication dose', () => {
    const alerts = buildAlerts(emptyInput({ meds: [medication('2024-01-01', 7)] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'med-m1',
      source: 'meds',
      severity: 'overdue',
      titleKey: 'alerts.items.medOverdue',
      route: '/meds',
      params: { name: 'Baytril' },
    })
  })

  it('flags a toxic water reading as an overdue alert', () => {
    const alerts = buildAlerts(emptyInput({ readings: [waterReading('2024-06-01', 8)] }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      id: 'water-toxic',
      source: 'water',
      severity: 'overdue',
      titleKey: 'alerts.items.waterToxic',
      route: '/water',
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
