import * as ProgressPrimitive from '@radix-ui/react-progress'

import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/utils/cn'

export type ProgressSize = 'sm' | 'md' | 'lg'
export type ProgressTone = 'brand' | 'success' | 'warning' | 'error'

export interface ProgressProps extends Omit<
  ComponentPropsWithRef<typeof ProgressPrimitive.Root>,
  'children'
> {
  /** Current value; clamped to `[0, max]` so the track never overflows. */
  value?: number
  /** Upper bound for `value` (default 100). */
  max?: number
  size?: ProgressSize
  tone?: ProgressTone
}

const tracks: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const tones: Record<ProgressTone, string> = {
  brand: 'bg-brand',
  success: 'bg-state-success',
  warning: 'bg-state-warning',
  error: 'bg-state-error',
}

export function Progress({
  className,
  value = 0,
  max = 100,
  size = 'md',
  tone = 'brand',
  ...props
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100
  const clamped = Math.min(Math.max(value, 0), safeMax)
  const percentage = (clamped / safeMax) * 100

  return (
    <ProgressPrimitive.Root
      // Pass the clamped value so Radix always receives a valid number (no
      // out-of-range console.error, aria-valuenow always present).
      value={clamped}
      max={safeMax}
      className={cn(
        'relative w-full overflow-hidden rounded-full border border-line bg-panel-muted',
        tracks[size],
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        // scaleX (origin-left) animates the transform, not the layout `width`.
        className={cn(
          'size-full origin-left rounded-full transition-transform duration-300 ease-out',
          tones[tone],
        )}
        style={{ transform: `scaleX(${percentage / 100})` }}
      />
    </ProgressPrimitive.Root>
  )
}
