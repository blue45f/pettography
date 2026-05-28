import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import styles from './SosFab.module.css'

function SosFab() {
  const { t } = useTranslation()
  const location = useLocation()

  if (location.pathname === '/sos') return null

  return (
    <Link to="/sos" className={styles.fab} aria-label={t('nav.sos')}>
      <span aria-hidden="true" className={styles.icon}>
        🚨
      </span>
      <span className={styles.label}>SOS</span>
    </Link>
  )
}

export default SosFab
