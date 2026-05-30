import { useTranslation } from 'react-i18next'

import styles from './Skeleton.module.css'

type SkeletonVariant = 'text' | 'circular' | 'rectangular'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  lines?: number
  className?: string
}

function Skeleton({ variant = 'text', width, height, lines = 1, className = '' }: SkeletonProps) {
  const { t } = useTranslation()
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  const skeletonClasses = [styles.skeleton, styles[variant], className].filter(Boolean).join(' ')

  if (variant === 'text' && lines > 1) {
    return (
      <div className={styles.textGroup} role="status" aria-label={t('common.loadingShort')}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={skeletonClasses}
            style={{
              ...style,
              width: i === lines - 1 ? '70%' : style.width,
            }}
          />
        ))}
        <span className="sr-only">{t('common.loadingText')}</span>
      </div>
    )
  }

  return (
    <div
      className={skeletonClasses}
      style={style}
      role="status"
      aria-label={t('common.loadingShort')}
    >
      <span className="sr-only">{t('common.loadingText')}</span>
    </div>
  )
}

export default Skeleton
