import Badge from '@components/common/Badge'
import { daysUntil, eventsByMonth, PET_EVENTS_2026, type PetEvent } from '@features/events'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Events.module.css'

type RegionFilter = 'all' | PetEvent['region']

const REGIONS: readonly RegionFilter[] = ['all', '서울', '부산', '인천', '수원'] as const

function Events() {
  const { t } = useTranslation()
  useDocumentTitle(t('events.title'))

  const [region, setRegion] = useState<RegionFilter>('all')

  const filtered = useMemo(() => {
    if (region === 'all') return PET_EVENTS_2026
    return PET_EVENTS_2026.filter((e) => e.region === region)
  }, [region])

  const byMonth = useMemo(() => eventsByMonth(filtered), [filtered])
  const monthKeys = useMemo(() => [...byMonth.keys()].sort(), [byMonth])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('events.title')}</h1>
        <p className={styles.subtitle}>{t('events.subtitle')}</p>
      </header>

      <nav className={styles.regionNav} aria-label={t('events.filterLabel')}>
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={[styles.regionChip, region === r ? styles.regionActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            {r === 'all' ? t('events.allRegions') : r}
          </button>
        ))}
      </nav>

      {monthKeys.length === 0 ? (
        <p className={styles.empty}>{t('events.noEvents')}</p>
      ) : (
        <div className={styles.timeline}>
          {monthKeys.map((monthKey) => (
            <section key={monthKey} className={styles.monthBlock}>
              <h2 className={styles.monthLabel}>{monthLabel(monthKey)}</h2>
              <ul className={styles.eventList}>
                {byMonth.get(monthKey)!.map((e) => (
                  <EventRow key={e.id} event={e} t={t} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className={styles.disclaimer}>{t('events.disclaimer')}</p>
    </section>
  )
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  return `${y}년 ${Number(m)}월`
}

function EventRow({
  event,
  t,
}: {
  event: PetEvent
  t: (k: string, opts?: Record<string, unknown>) => string
}) {
  const days = daysUntil(event.startDate)
  const sameDay = event.startDate === event.endDate
  return (
    <li className={styles.event}>
      <div className={styles.eventDate}>
        <span className={styles.eventDay}>
          {event.startDate.slice(5).replace('-', '.')}
          {!sameDay && (
            <>
              <span aria-hidden="true"> ~ </span>
              {event.endDate.slice(5).replace('-', '.')}
            </>
          )}
        </span>
        <span className={styles.eventDays}>
          {days >= 0
            ? t('events.daysLeft', { days })
            : t('events.daysAgo', { days: Math.abs(days) })}
        </span>
      </div>
      <div className={styles.eventBody}>
        <header className={styles.eventHeader}>
          <h3 className={styles.eventName}>{event.name}</h3>
          <div className={styles.eventBadges}>
            <Badge variant={event.kind === 'reptile' ? 'warning' : 'primary'}>
              {t(`events.kind.${event.kind}`)}
            </Badge>
            <Badge variant="default">{event.region}</Badge>
          </div>
        </header>
        <p className={styles.eventVenue}>{event.venue}</p>
        <p className={styles.eventNote}>{event.note}</p>
        <a className={styles.eventLink} href={event.url} target="_blank" rel="noreferrer">
          {t('events.openSite')} ↗
        </a>
      </div>
    </li>
  )
}

export default Events
