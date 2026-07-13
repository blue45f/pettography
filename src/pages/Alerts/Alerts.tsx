import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import { actionableCount, type AlertSeverity } from '@domains/alerts'
import { useOnboardingStore } from '@domains/onboarding'
import { useAggregatedAlerts } from '@hooks/useAggregatedAlerts'
import useDocumentTitle from '@hooks/useDocumentTitle'
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
  bcs: '⚖️',
  supplements: '🧂',
  health: '💉',
  cleaning: '🧽',
}

const SEVERITY_VARIANT: Record<AlertSeverity, 'error' | 'warning' | 'primary' | 'default'> = {
  overdue: 'error',
  due: 'warning',
  soon: 'primary',
  info: 'default',
}

const SECTION_ORDER: readonly AlertSeverity[] = ['overdue', 'due', 'soon', 'info']

function Alerts() {
  const { t } = useTranslation()
  useDocumentTitle(t('alerts.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const hasPetProfile = Boolean(profile.category && profile.speciesId)

  const items = useAggregatedAlerts()

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
      </header>

      {!hasPetProfile ? (
        <EmptyState
          variant="gated"
          icon="🐾"
          title={t('alerts.noPet')}
          description={t('alerts.subtitle')}
          action={
            <Link to="/onboarding" className={styles.setupLink}>
              {t('onboarding.title')} →
            </Link>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="✅"
          title={t('alerts.allClear.title')}
          description={t('alerts.allClear.desc')}
        />
      ) : (
        <>
          <div className={styles.summaryBar}>
            <p className={styles.summary}>
              {actionable > 0
                ? t('alerts.summary', { count: actionable })
                : t('alerts.summaryInfoOnly')}
            </p>
            <Link to="/calendar" className={styles.calendarLink}>
              {t('nav.calendar')} →
            </Link>
          </div>
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
                  <li key={item.id} className={styles.item}>
                    <Link to={item.route} className={styles.itemLink}>
                      <span className={styles.itemEmoji} aria-hidden="true">
                        {SOURCE_EMOJI[item.source] ?? '🔔'}
                      </span>
                      <span className={styles.itemBody}>
                        <span className={styles.itemTitle}>{t(item.titleKey, item.params)}</span>
                        {item.dateISO && (
                          <time className={styles.itemDate} dateTime={item.dateISO}>
                            {item.dateISO}
                          </time>
                        )}
                      </span>
                      <span className={styles.itemView} aria-hidden="true">
                        {t('alerts.view')} ›
                      </span>
                    </Link>
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
