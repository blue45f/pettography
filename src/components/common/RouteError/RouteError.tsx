import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import styles from './RouteError.module.css'

function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()

  const isResponse = isRouteErrorResponse(error)
  const status = isResponse ? error.status : 500
  const message = isResponse
    ? error.statusText
    : error instanceof Error
      ? error.message
      : t('error.boundaryMessage')

  return (
    <div className={styles.container} role="alert">
      <p className={styles.code} aria-hidden="true">
        {status}
      </p>
      <h1 className={styles.title}>{t('error.boundaryTitle')}</h1>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
          {t('error.boundaryReset')}
        </button>
        <Link to="/" className={styles.home}>
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  )
}

export default RouteError
