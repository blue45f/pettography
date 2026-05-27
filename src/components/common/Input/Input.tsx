import { InputHTMLAttributes, useId } from 'react'

import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  ref?: React.Ref<HTMLInputElement>
}

function Input({ label, error, helperText, className = '', id, ref, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  const inputClasses = [styles.input, error ? styles.error : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className={styles.errorText}>
          {error}
        </span>
      )}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  )
}

export default Input
