import { sortAlerts, type AlertItem } from '@features/alerts'
import { latestBcs, statusForScore, useActivePetBcs } from '@features/bcs'
import { clutchStatusLabelCode, useActivePetClutches } from '@features/breeding'
import { currentPhase, useActivePetPlans } from '@features/brumation'
import { dueDate, gearStatus, useActivePetGear } from '@features/gear'
import {
  doseStatusCode,
  nextDoseDate,
  quarantineDoneCode,
  useActivePetMeds,
  useActivePetQuarantines,
} from '@features/meds'
import { predictNext, useActivePetMolts } from '@features/molt'
import { useSpeciesList } from '@features/species'
import { cycleStatus, useActivePetReadings } from '@features/water'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Cross-feature alert aggregator. Reads the active pet's meds, quarantines, gear,
 * clutches, molts, water readings, and brumation plans, and folds the per-feature
 * engine verdicts into a single sorted `AlertItem[]`.
 *
 * Shared by the Alerts center page and the dashboard "attention" widget so the
 * aggregation logic lives in exactly one place.
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

  const today = todayIso()

  return useMemo<AlertItem[]>(() => {
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

    // Water — toxic cycle on the latest reading
    if (readings.length > 0) {
      const latest = [...readings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0]
      if (cycleStatus(latest) === 'toxic') {
        out.push({
          id: 'water-toxic',
          source: 'water',
          severity: 'overdue',
          titleKey: 'alerts.items.waterToxic',
          dateISO: latest.measuredAt,
          route: '/water',
        })
      }
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

    return sortAlerts(out)
  }, [meds, quarantines, gear, clutches, molts, readings, plans, bcs, speciesList, today, t])
}
