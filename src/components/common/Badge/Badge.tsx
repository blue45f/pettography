import type { ReactNode } from 'react'

import { Badge as KitBadge, type BadgeTone } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

// Legacy variant names map onto the kit Badge tones. 'default' reads as the
// neutral chip; 'primary' as the brand tone.
const VARIANT_MAP: Record<BadgeVariant, BadgeTone> = {
  default: 'neutral',
  primary: 'brand',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

/**
 * Legacy common Badge — now a thin wrapper over the `ui/` kit Badge so every
 * existing caller renders the canonical kit styling without changing its API.
 */
function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <KitBadge tone={VARIANT_MAP[variant]} className={cn(className)}>
      {children}
    </KitBadge>
  )
}

export default Badge
