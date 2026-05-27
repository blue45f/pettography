import styles from './Divider.module.css'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
}

function Divider({ orientation = 'horizontal', label, className = '' }: DividerProps) {
  const dividerClasses = [styles.divider, styles[orientation], className].filter(Boolean).join(' ')

  if (label && orientation === 'horizontal') {
    return (
      <div className={dividerClasses} role="separator">
        <span className={styles.label}>{label}</span>
      </div>
    )
  }

  return <div className={dividerClasses} role="separator" />
}

export default Divider
