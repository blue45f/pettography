import { createElement, type ReactNode } from 'react'

import styles from './EmptyState.module.css'

/**
 * EmptyState variants tune the empty screen to the page's *register*:
 *
 * - `default`  — quiet, airy, borderless. The safe fallback for any "nothing
 *   here yet" state; keeps untouched call sites unchanged.
 * - `log`      — first-run primer for husbandry logging pages (feeding, meds,
 *   molt, water…). Renders a contained, tinted panel with a soft icon
 *   medallion and an optional `hint` that teaches *what the log is for and the
 *   one action to start*. Use when the page already exposes the entry form.
 * - `discover` — browse/search results that came back empty (species, shops,
 *   hospitals, market…). Stays quiet so it never competes with the filters.
 * - `gated`    — a precondition is unmet (pick a pet, choose a vet…). Contained
 *   panel like `log`, so the next step reads as intentional, not broken.
 *
 * On-brand by construction: slate-tinted surfaces, no hero-metric, no
 * side-stripe. The medallion uses the soft primary token; only `gated` shifts
 * to the muted/secondary tone to signal "do this first".
 */
type EmptyStateVariant = 'default' | 'log' | 'discover' | 'gated'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  /**
   * A short teaching line shown beneath the description — what this log
   * produces or the single next step. Pass a translated string. Only rendered
   * for the contained variants (`log`, `gated`).
   */
  hint?: ReactNode
  action?: ReactNode
  variant?: EmptyStateVariant
  className?: string
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

function EmptyState({
  title,
  description,
  icon,
  hint,
  action,
  variant = 'default',
  className = '',
  headingLevel = 3,
}: EmptyStateProps) {
  const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const contained = variant === 'log' || variant === 'gated'

  const containerClasses = [styles.container, styles[variant], className].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {icon && (
        <span className={contained ? styles.medallion : styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {createElement(HeadingTag, { className: styles.title }, title)}
      {description && <p className={styles.description}>{description}</p>}
      {contained && hint && <p className={styles.hint}>{hint}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

export default EmptyState
