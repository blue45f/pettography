import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import styles from './RouteError.module.css'

function RouteError() {
  const error = useRouteError()

  const isResponse = isRouteErrorResponse(error)
  const status = isResponse ? error.status : 500
  const message = isResponse
    ? error.statusText
    : error instanceof Error
      ? error.message
      : '알 수 없는 오류가 발생했습니다.'

  return (
    <div className={styles.container} role="alert">
      <h1 className={styles.code}>{status}</h1>
      <p className={styles.message}>{message}</p>
      <Link to="/" className={styles.home}>
        홈으로 이동
      </Link>
    </div>
  )
}

export default RouteError
