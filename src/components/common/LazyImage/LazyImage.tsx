import useIntersectionObserver from '@hooks/useIntersectionObserver'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './LazyImage.module.css'

interface LazyImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  placeholder?: string
  className?: string
  /**
   * When true, the loaded image scales up slightly while its container is
   * hovered or focused, for editorial photo grids. Honors reduced-motion via
   * the global transition reset. Defaults to false so existing call sites are
   * unaffected.
   */
  hoverZoom?: boolean
}

function LazyImage({
  src,
  alt,
  width,
  height,
  placeholder,
  className = '',
  hoverZoom = false,
}: LazyImageProps) {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { ref, isIntersecting } = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: '200px',
  })

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${styles.container} ${hoverZoom ? styles.zoom : ''} ${className}`}
      style={style}
    >
      {!loaded && !error && (
        <div className={styles.placeholder}>
          {placeholder || <div className={styles.shimmer} />}
        </div>
      )}
      {error && (
        <div className={styles.error} role="img" aria-label={t('common.imageLoadError')}>
          <span aria-hidden="true">&#x26A0;</span>
        </div>
      )}
      {isIntersecting && !error && (
        <img
          src={src}
          alt={alt}
          className={`${styles.image} ${loaded ? styles.loaded : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
    </div>
  )
}

export default LazyImage
