import { useId } from 'react'

import styles from './Switch.module.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: SwitchProps) {
  const id = useId()
  const labelId = `${id}-label`

  return (
    <span className={`${styles.wrapper} ${disabled ? styles.disabled : ''} ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        className={`${styles.switch} ${styles[size]} ${checked ? styles.checked : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className={styles.thumb} />
      </button>
      {label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
    </span>
  )
}

export default Switch
