import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { actionableCount, sortAlerts, type AlertItem, type AlertSeverity } from '@features/alerts'
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
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import { useSpeciesList } from '@features/species'
import { cycleStatus, useActivePetReadings } from '@features/water'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Alerts.module.css'

const SOURCE_EMOJI: Record<string, string> = {
  meds: '💊',
  gear: '🔧',
  breeding: '🥚',
  molt: '🦎',
  water: '💧',
  brumation: '❄️',
}

const SEVERITY_VARIANT: Record<AlertSeverity, 'error' | 'warning' | 'primary' | 'default'> = {
  overdue: 'error',
  due: 'warning',
  soon: 'primary',
  info: 'default',
}

const SECTION_ORDER: readonly AlertSeverity[] = ['overdue', 'due', 'soon', 'info']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Alerts() {
  const { t } = useTranslation()
  useDocumentTitle(t('alerts.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const completed = isOnboardingComplete(profile)
  const { data: speciesList = [] } = useSpeciesList({})

  const meds = useActivePetMeds()
  const quarantines = useActivePetQuarantines()
  const gear = useActivePetGear()
  const clutches = useActivePetClutches()
  const molts = useActivePetMolts()
  const readings = useActivePetReadings()
  const plans = useActivePetPlans()

  const today = todayIso()

  const items = useMemo<AlertItem[]>(() => {
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

    return sortAlerts(out)
  }, [meds, quarantines, gear, clutches, molts, readings, plans, speciesList, today, t])

  const actionable = actionableCount(items)
  const grouped = SECTION_ORDER.map((sev) => ({
    severity: sev,
    rows: items.filter((i) => i.severity === sev),
  })).filter((g) => g.rows.length > 0)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('alerts.title')}</h1>
        <p className={styles.subtitle}>{t('alerts.subtitle')}</p>
        {!completed && <p className={styles.note}>{t('alerts.noPet')}</p>}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="✅"
          title={t('alerts.allClear.title')}
          description={t('alerts.allClear.desc')}
        />
      ) : (
        <>
          <p className={styles.summary}>
            {actionable > 0
              ? t('alerts.summary', { count: actionable })
              : t('alerts.summaryInfoOnly')}
          </p>
          {grouped.map((group) => (
            <section key={group.severity} className={styles.group}>
              <h2 className={styles.groupTitle}>
                <Badge variant={SEVERITY_VARIANT[group.severity]}>
                  {t(`alerts.severity.${group.severity}`)}
                </Badge>
                <span className={styles.groupCount}>{group.rows.length}</span>
              </h2>
              <ul className={styles.list}>
                {group.rows.map((item) => (
                  <li key={item.id}>
                    <Card padding="md" className={styles.itemCard}>
                      <Card.Body>
                        <Link to={item.route} className={styles.itemLink}>
                          <span className={styles.itemEmoji} aria-hidden="true">
                            {SOURCE_EMOJI[item.source] ?? '🔔'}
                          </span>
                          <span className={styles.itemBody}>
                            <span className={styles.itemTitle}>
                              {t(item.titleKey, item.params)}
                            </span>
                            {item.dateISO && (
                              <span className={styles.itemDate}>{item.dateISO}</span>
                            )}
                          </span>
                          <span className={styles.itemView} aria-hidden="true">
                            {t('alerts.view')} ›
                          </span>
                        </Link>
                      </Card.Body>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  )
}

export default Alerts
