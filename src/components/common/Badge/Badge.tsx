import styles from './Badge.module.css'

import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const badgeClasses = [styles.badge, styles[variant], className].filter(Boolean).join(' ')

  return <span className={badgeClasses}>{children}</span>
}

export default Badge
