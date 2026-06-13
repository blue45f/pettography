import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'brand' | 'coral' | 'success' | 'warning' | 'error' | 'info'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const base =
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium leading-tight ' +
  '[&_svg]:size-3 [&_svg]:shrink-0'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-panel-muted text-ink-secondary',
  brand: 'bg-brand-soft text-brand',
  coral: 'bg-coral-soft text-coral-600',
  success: 'bg-state-success/15 text-state-success',
  warning: 'bg-state-warning/15 text-on-warning',
  error: 'bg-state-error/15 text-state-error',
  info: 'bg-state-info/15 text-state-info',
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cn(base, tones[tone], className)} {...props} />
}
