import { createElement, type ReactNode } from 'react'

import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: ReactNode
  className?: string
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
  headingLevel = 3,
}: EmptyStateProps) {
  const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <div className={`${styles.container} ${className}`}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {createElement(HeadingTag, { className: styles.title }, title)}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

export default EmptyState
