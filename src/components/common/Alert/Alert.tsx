import { useState, type ReactNode } from 'react'

import styles from './Alert.module.css'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

function Alert({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const alertClasses = [styles.alert, styles[variant], className].filter(Boolean).join(' ')

  return (
    <div className={alertClasses} role="alert">
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div className={styles.message}>{children}</div>
      </div>
      {dismissible && (
        <button
          className={styles.close}
          onClick={handleDismiss}
          aria-label="알림 닫기"
          type="button"
        >
          &times;
        </button>
      )}
    </div>
  )
}

export default Alert
