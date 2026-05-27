import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import { upcomingDues, useHealthStore } from '@features/health'
import { useOnboardingStore } from '@features/onboarding'
import { useRegistryStore, REGISTRY_FILINGS } from '@features/registry'
import { useSpecies } from '@features/species'
import { supplyStatus, useSuppliesStore } from '@features/supplies'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Calendar.module.css'

type EventKind = 'vaccine' | 'supply' | 'registry'

interface CalendarEvent {
  id: string
  kind: EventKind
  daysLeft: number
  date: Date
  title: string
  note: string
  link: string
}

const HORIZON_DAYS = 60

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function Calendar() {
  const { t } = useTranslation()
  useDocumentTitle(t('calendar.title'))

  const vaccinations = useHealthStore((s) => s.vaccinations)
  const supplyItems = useSuppliesStore((s) => s.items)
  const registryDone = useRegistryStore((s) => s.done)
  const speciesId = useOnboardingStore((s) => s.profile.speciesId)
  const { data: species } = useSpecies(speciesId ?? undefined)

  const events = useMemo<CalendarEvent[]>(() => {
    const now = new Date()
    const out: CalendarEvent[] = []

    for (const due of upcomingDues(vaccinations, HORIZON_DAYS)) {
      if (due.daysLeft < -30) continue
      out.push({
        id: `vax-${due.vaccination.id}`,
        kind: 'vaccine',
        daysLeft: due.daysLeft,
        date: new Date(due.vaccination.nextDueAt as string),
        title: due.vaccination.name,
        note: due.vaccination.clinic ?? t('calendar.noClinic'),
        link: '/health',
      })
    }

    for (const item of supplyItems) {
      const status = supplyStatus(item)
      if (status.daysLeft > HORIZON_DAYS) continue
      const date = addDays(new Date(), Math.max(0, status.daysLeft))
      out.push({
        id: `supply-${item.id}`,
        kind: 'supply',
        daysLeft: status.daysLeft,
        date,
        title: item.name,
        note: t(`calendar.supplyLevel.${status.level}`, { days: status.daysLeft }),
        link: '/supplies',
      })
    }

    for (const filing of REGISTRY_FILINGS) {
      if (registryDone[filing]) continue
      out.push({
        id: `registry-${filing}`,
        kind: 'registry',
        daysLeft: 30,
        date: addDays(now, 30),
        title: t(`registry.filings.${filing}.title`),
        note: t(`registry.filings.${filing}.when`),
        link: '/registry',
      })
    }

    return out.sort((a, b) => a.daysLeft - b.daysLeft)
  }, [vaccinations, supplyItems, registryDone, t])

  const overdue = events.filter((e) => e.daysLeft < 0)
  const within7 = events.filter((e) => e.daysLeft >= 0 && e.daysLeft <= 7)
  const within30 = events.filter((e) => e.daysLeft > 7 && e.daysLeft <= 30)
  const beyond = events.filter((e) => e.daysLeft > 30)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('calendar.title')}</h1>
        <p className={styles.subtitle}>{t('calendar.subtitle', { horizon: HORIZON_DAYS })}</p>
        {species && (
          <p className={styles.contextNote}>
            {species.heroEmoji} {species.koreanName}
          </p>
        )}
      </header>

      {events.length === 0 ? (
        <EmptyState icon="🗓️" title={t('calendar.empty')} description={t('calendar.emptyDesc')} />
      ) : (
        <div className={styles.buckets}>
          <Bucket
            label={t('calendar.buckets.overdue', { count: overdue.length })}
            tone="error"
            events={overdue}
            t={t}
          />
          <Bucket
            label={t('calendar.buckets.within7', { count: within7.length })}
            tone="warning"
            events={within7}
            t={t}
          />
          <Bucket
            label={t('calendar.buckets.within30', { count: within30.length })}
            tone="info"
            events={within30}
            t={t}
          />
          <Bucket
            label={t('calendar.buckets.beyond', { count: beyond.length })}
            tone="default"
            events={beyond}
            t={t}
          />
        </div>
      )}
    </section>
  )
}

interface BucketProps {
  label: string
  tone: 'error' | 'warning' | 'info' | 'default'
  events: CalendarEvent[]
  t: (key: string, opts?: Record<string, unknown>) => string
}

function Bucket({ label, tone, events, t }: BucketProps) {
  if (events.length === 0) return null
  return (
    <section className={[styles.bucket, styles[`bucket-${tone}`]].join(' ')} aria-label={label}>
      <header className={styles.bucketHeader}>
        <h2 className={styles.bucketLabel}>{label}</h2>
      </header>
      <ol className={styles.eventList}>
        {events.map((e) => (
          <li key={e.id} className={styles.event}>
            <Link to={e.link} className={styles.eventLink}>
              <span className={styles.eventDate}>
                {formatDate(e.date)}
                <span className={styles.eventDaysLeft}>
                  {e.daysLeft < 0
                    ? t('calendar.daysOverdue', { days: Math.abs(e.daysLeft) })
                    : t('calendar.daysLeft', { days: e.daysLeft })}
                </span>
              </span>
              <span className={styles.eventBody}>
                <Badge variant={badgeForKind(e.kind, tone)}>{t(`calendar.kind.${e.kind}`)}</Badge>
                <span className={styles.eventTitle}>{e.title}</span>
              </span>
              <span className={styles.eventNote}>{e.note}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

function badgeForKind(kind: EventKind, tone: 'error' | 'warning' | 'info' | 'default') {
  if (tone === 'error') return 'error'
  if (tone === 'warning') return 'warning'
  if (kind === 'vaccine') return 'primary'
  if (kind === 'supply') return 'success'
  return 'default'
}

export default Calendar
