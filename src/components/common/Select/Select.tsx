import { SelectHTMLAttributes, useId } from 'react'

import styles from './Select.module.css'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  ref?: React.Ref<HTMLSelectElement>
}

function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  id,
  ref,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id || generatedId

  const selectClasses = [styles.select, error ? styles.error : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.selectContainer}>
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow} aria-hidden="true" />
      </div>
      {error && (
        <span id={`${selectId}-error`} className={styles.errorText}>
          {error}
        </span>
      )}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  )
}

export default Select
