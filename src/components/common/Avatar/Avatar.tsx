import { useState } from 'react'

import styles from './Avatar.module.css'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Avatar({ src, alt, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false)

  const avatarClasses = [styles.avatar, styles[size], className].filter(Boolean).join(' ')

  if (src && !hasError) {
    return (
      <img
        className={avatarClasses}
        src={src}
        alt={alt || name || ''}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <div className={`${avatarClasses} ${styles.fallback}`} role="img" aria-label={name || alt}>
      <span aria-hidden="true">{name ? getInitials(name) : '?'}</span>
    </div>
  )
}

export default Avatar
