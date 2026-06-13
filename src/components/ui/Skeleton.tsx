import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

/** Pulsing placeholder block. Set width/height via className (e.g. `h-4 w-32`). */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-panel-muted', className)}
      {...props}
    />
  )
}
