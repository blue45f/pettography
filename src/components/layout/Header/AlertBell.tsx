import { actionableCount } from '@features/alerts'
import { useAggregatedAlerts } from '@hooks/useAggregatedAlerts'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import styles from './Header.module.css'

interface AlertBellProps {
  onNavigate: () => void
}

/**
 * Header alert bell. Lazy-loaded from Header so the cross-feature alert
 * aggregation (and the seven feature stores it reads) stays out of the eager
 * entry chunk; the count fills in a beat after first paint.
 */
function AlertBell({ onNavigate }: AlertBellProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const alertCount = actionableCount(useAggregatedAlerts())

  return (
    <Link
      to="/alerts"
      className={styles.alertBell}
      aria-label={alertCount > 0 ? t('header.alertsCount', { count: alertCount }) : t('nav.alerts')}
      aria-current={location.pathname === '/alerts' ? 'page' : undefined}
      onClick={onNavigate}
    >
      <span aria-hidden="true">🔔</span>
      {alertCount > 0 && (
        <span className={styles.alertBadge} aria-hidden="true">
          {alertCount > 9 ? '9+' : alertCount}
        </span>
      )}
    </Link>
  )
}

export default AlertBell
