import styles from './Progress.module.css'

type ProgressVariant = 'primary' | 'success' | 'warning' | 'error'

interface ProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

function Progress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const displayLabel = label || `${Math.round(percentage)}%`

  const progressClasses = [styles.container, styles[`size-${size}`], className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={progressClasses}>
      {showLabel && <span className={styles.label}>{displayLabel}</span>}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={displayLabel}
      >
        <div
          className={`${styles.bar} ${styles[variant]}`}
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </div>
    </div>
  )
}

export default Progress
