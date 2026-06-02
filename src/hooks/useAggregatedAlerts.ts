import { sortAlerts, type AlertItem } from '@features/alerts'
import { latestBcs, statusForScore, useActivePetBcs } from '@features/bcs'
import { clutchStatusLabelCode, useActivePetClutches } from '@features/breeding'
import { currentPhase, useActivePetPlans } from '@features/brumation'
import {
  CLEAN_TYPES,
  cleanStatus,
  defaultIntervalDays as defaultCleanInterval,
  latestByType as latestCleanByType,
  useActivePetCleanings,
} from '@features/cleaning'
import { dueDate, gearStatus, useActivePetGear } from '@features/gear'
import { upcomingDues, useActivePetHealth, type VaccinationEntry } from '@features/health'
import {
  doseStatusCode,
  nextDoseDate,
  quarantineDoneCode,
  useActivePetMeds,
  useActivePetQuarantines,
} from '@features/meds'
import { predictNext, useActivePetMolts } from '@features/molt'
import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList, type SpeciesCategory } from '@features/species'
import {
  defaultIntervalDays,
  dustingStatus,
  latestByType,
  SUPPLEMENT_TYPES,
  useActivePetDustings,
  useSupplementsStore,
  type ScheduleConfig,
} from '@features/supplements'
import { cycleStatus, latestReading, useActivePetReadings } from '@features/water'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { TFunction } from 'i18next'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Everything `buildAlerts` needs, already scoped to the active pet. Kept as a
 * plain data bag (no hooks) so the aggregation stays a pure, unit-testable
 * function; `useAggregatedAlerts` is the thin hook that gathers it.
 */
export interface BuildAlertsInput {
  meds: ReturnType<typeof useActivePetMeds>
  quarantines: ReturnType<typeof useActivePetQuarantines>
  gear: ReturnType<typeof useActivePetGear>
  clutches: ReturnType<typeof useActivePetClutches>
  molts: ReturnType<typeof useActivePetMolts>
  readings: ReturnType<typeof useActivePetReadings>
  plans: ReturnType<typeof useActivePetPlans>
  bcs: ReturnType<typeof useActivePetBcs>
  dustings: ReturnType<typeof useActivePetDustings>
  cleanings: ReturnType<typeof useActivePetCleanings>
  vaccinations: VaccinationEntry[]
  supSchedule: ScheduleConfig
  category: SpeciesCategory | null
  speciesList: ReadonlyArray<{ id: string; slug: string }>
  today: string
  t: TFunction
}

/**
 * Pure cross-feature alert aggregation: folds each feature's engine verdict for
 * the active pet into a single sorted `AlertItem[]`. No hooks, no side effects,
 * so the threshold/severity rules are exhaustively testable. Used only by
 * `useAggregatedAlerts`.
 */
export function buildAlerts(input: BuildAlertsInput): AlertItem[] {
  const {
    meds,
    quarantines,
    gear,
    clutches,
    molts,
    readings,
    plans,
    bcs,
    dustings,
    cleanings,
    vaccinations,
    supSchedule,
    category,
    speciesList,
    today,
    t,
  } = input

  const out: AlertItem[] = []

  // Medications — overdue / due today
  for (const m of meds) {
    const code = doseStatusCode(m, today)
    if (code === 'overdue') {
      out.push({
        id: `med-${m.id}`,
        source: 'meds',
        severity: 'overdue',
        titleKey: 'alerts.items.medOverdue',
        params: { name: m.name },
        dateISO: nextDoseDate(m, today),
        route: '/meds',
      })
    } else if (code === 'dueToday') {
      out.push({
        id: `med-${m.id}`,
        source: 'meds',
        severity: 'due',
        titleKey: 'alerts.items.medDue',
        params: { name: m.name },
        dateISO: today,
        route: '/meds',
      })
    }
  }

  // Quarantine — ready to clear
  for (const q of quarantines) {
    if (quarantineDoneCode(q, today) === 'readyToClear') {
      out.push({
        id: `quarantine-${q.id}`,
        source: 'meds',
        severity: 'due',
        titleKey: 'alerts.items.quarantineReady',
        params: { name: q.animalName },
        route: '/meds',
      })
    }
  }

  // Gear — replacement overdue / soon
  for (const g of gear) {
    const status = gearStatus(g, today)
    if (status === 'overdue') {
      out.push({
        id: `gear-${g.id}`,
        source: 'gear',
        severity: 'overdue',
        titleKey: 'alerts.items.gearOverdue',
        params: { name: g.name },
        dateISO: dueDate(g),
        route: '/gear',
      })
    } else if (status === 'soon') {
      out.push({
        id: `gear-${g.id}`,
        source: 'gear',
        severity: 'soon',
        titleKey: 'alerts.items.gearSoon',
        params: { name: g.name },
        dateISO: dueDate(g),
        route: '/gear',
      })
    }
  }

  // Breeding — clutch due / overdue to hatch
  for (const c of clutches) {
    const slug = speciesList.find((s) => s.id === c.speciesId)?.slug ?? null
    const code = clutchStatusLabelCode(c, today, slug)
    if (code === 'overdue') {
      out.push({
        id: `clutch-${c.id}`,
        source: 'breeding',
        severity: 'overdue',
        titleKey: 'alerts.items.clutchOverdue',
        dateISO: c.laidAt,
        route: '/breeding',
      })
    } else if (code === 'due') {
      out.push({
        id: `clutch-${c.id}`,
        source: 'breeding',
        severity: 'due',
        titleKey: 'alerts.items.clutchDue',
        dateISO: c.laidAt,
        route: '/breeding',
      })
    }
  }

  // Molt — overdue prediction
  const prediction = predictNext(molts, today)
  if (prediction?.overdue) {
    out.push({
      id: 'molt-overdue',
      source: 'molt',
      severity: 'overdue',
      titleKey: 'alerts.items.moltOverdue',
      dateISO: prediction.predictedDate,
      route: '/molt',
    })
  }

  // Water — toxic cycle on the latest reading (createdAt tiebreaker, matching the Water page)
  const latestWater = latestReading(readings)
  if (latestWater && cycleStatus(latestWater) === 'toxic') {
    out.push({
      id: 'water-toxic',
      source: 'water',
      severity: 'overdue',
      titleKey: 'alerts.items.waterToxic',
      dateISO: latestWater.measuredAt,
      route: '/water',
    })
  }

  // Brumation — a plan is currently in an active phase
  for (const p of plans) {
    const phase = currentPhase(p, today)
    if (phase) {
      out.push({
        id: `brumation-${p.id}`,
        source: 'brumation',
        severity: 'info',
        titleKey: 'alerts.items.brumationPhase',
        params: { phase: t(`brumation.phases.${phase}.title`) },
        route: '/brumation',
      })
    }
  }

  // Body condition — the latest score sits outside the ideal band (welfare flag)
  const latestBcsEntry = latestBcs(bcs)
  if (latestBcsEntry) {
    const status = statusForScore(latestBcsEntry.score)
    if (status !== 'ideal') {
      out.push({
        id: 'bcs-off',
        source: 'bcs',
        severity: 'soon',
        titleKey: 'alerts.items.bcsOff',
        params: { status: t(`bcs.status.${status}`) },
        dateISO: latestBcsEntry.assessedAt,
        route: '/bcs',
      })
    }
  }

  // Vaccinations — a booster is overdue or coming up within the horizon
  for (const due of upcomingDues(vaccinations, 30)) {
    const overdue = due.daysLeft < 0
    out.push({
      id: `vaccination-${due.vaccination.id}`,
      source: 'health',
      severity: overdue ? 'overdue' : 'soon',
      titleKey: overdue ? 'alerts.items.vaccinationOverdue' : 'alerts.items.vaccinationSoon',
      params: { name: due.vaccination.name },
      dateISO: due.vaccination.nextDueAt ?? undefined,
      route: '/health',
    })
  }

  // Cleaning — a routine clean (spot/full/substrate/water) is due or coming up
  for (const type of CLEAN_TYPES) {
    const last = latestCleanByType(cleanings, type)?.cleanedAt ?? null
    const status = cleanStatus(last, defaultCleanInterval(type, category), today)
    if (status === 'due' || status === 'soon') {
      out.push({
        id: `cleaning-${type}`,
        source: 'cleaning',
        severity: status,
        titleKey: status === 'due' ? 'alerts.items.cleaningDue' : 'alerts.items.cleaningSoon',
        params: { type: t(`cleaning.types.${type}`) },
        route: '/cleaning',
      })
    }
  }

  // Supplements — a routine dusting is due or coming up soon (MBD prevention)
  for (const type of SUPPLEMENT_TYPES) {
    const interval = supSchedule[type] ?? defaultIntervalDays(category, type)
    if (interval == null) continue
    const status = dustingStatus(latestByType(dustings, type)?.dustedAt, interval, today)
    if (status === 'due' || status === 'soon') {
      out.push({
        id: `supplement-${type}`,
        source: 'supplements',
        severity: status,
        titleKey: status === 'due' ? 'alerts.items.supplementDue' : 'alerts.items.supplementSoon',
        params: { type: t(`supplements.types.${type}`) },
        route: '/supplements',
      })
    }
  }

  return sortAlerts(out)
}

/**
 * Cross-feature alert aggregator hook. Gathers the active pet's care data from
 * every feature store and folds it into a single sorted `AlertItem[]` via the
 * pure `buildAlerts`. Shared by the Alerts page, the dashboard "attention"
 * widget and the header bell so the rules live in exactly one place.
 */
export function useAggregatedAlerts(): AlertItem[] {
  const { t } = useTranslation()
  const { data: speciesList = [] } = useSpeciesList({})

  const meds = useActivePetMeds()
  const quarantines = useActivePetQuarantines()
  const gear = useActivePetGear()
  const clutches = useActivePetClutches()
  const molts = useActivePetMolts()
  const readings = useActivePetReadings()
  const plans = useActivePetPlans()
  const bcs = useActivePetBcs()
  const category = useOnboardingStore((s) => s.profile.category)
  const dustings = useActivePetDustings()
  const supSchedule = useSupplementsStore((s) => s.schedule)
  const { vaccinations } = useActivePetHealth()
  const cleanings = useActivePetCleanings()

  const today = todayIso()

  return useMemo<AlertItem[]>(
    () =>
      buildAlerts({
        meds,
        quarantines,
        gear,
        clutches,
        molts,
        readings,
        plans,
        bcs,
        dustings,
        cleanings,
        vaccinations,
        supSchedule,
        category,
        speciesList,
        today,
        t,
      }),
    [
      meds,
      quarantines,
      gear,
      clutches,
      molts,
      readings,
      plans,
      bcs,
      category,
      cleanings,
      dustings,
      supSchedule,
      vaccinations,
      speciesList,
      today,
      t,
    ],
  )
}
