import { useTranslation } from 'react-i18next'

import styles from './Loading.module.css'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

function Loading({ size = 'md', text }: LoadingProps) {
  const { t } = useTranslation()
  const label = text ?? t('common.loadingText')
  return (
    <div className={styles.container} role="status" aria-label={label || t('common.loadingShort')}>
      <div className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      {label && <p className={styles.text}>{label}</p>}
    </div>
  )
}

export default Loading
