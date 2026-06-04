import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './ContentImage.module.css'

interface ContentImageProps {
  src: string
  alt: string
  className?: string
}

/**
 * Raw user-content <img> with a graceful fallback. Dead, blocked, or
 * `no-referrer`-stripped photo URLs render a labelled placeholder (matching
 * LazyImage's error state) instead of the browser's broken-image glyph.
 *
 * For gallery/rail/diary photos that are already above the fold or short
 * lists — where LazyImage's IntersectionObserver wrapper isn't needed but the
 * broken-URL resilience is. The fallback reuses the caller's className so it
 * occupies the exact same box (size/aspect/radius) as the image would.
 */
function ContentImage({ src, alt, className = '' }: ContentImageProps) {
  const { t } = useTranslation()
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div
        className={`${className} ${styles.fallback}`}
        role="img"
        aria-label={t('common.imageLoadError')}
      >
        <span aria-hidden="true">&#x26A0;</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setError(true)}
    />
  )
}

export default ContentImage
