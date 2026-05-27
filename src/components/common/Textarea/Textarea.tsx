import { TextareaHTMLAttributes, useId } from 'react'

import styles from './Textarea.module.css'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  ref?: React.Ref<HTMLTextAreaElement>
}

function Textarea({ label, error, helperText, className = '', id, ref, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id || generatedId

  const textareaClasses = [styles.textarea, error ? styles.error : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${textareaId}-error`} className={styles.errorText}>
          {error}
        </span>
      )}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  )
}

export default Textarea
