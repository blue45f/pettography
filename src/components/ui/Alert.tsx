import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utils/cn'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Visual + semantic tone of the alert (default `info`). */
  tone?: AlertTone
  /** Optional bold heading rendered above the message. */
  title?: ReactNode
  /** Slot rendered on the trailing edge (e.g. a dismiss button). */
  action?: ReactNode
}

const tones: Record<AlertTone, string> = {
  info: 'border-state-info/40 bg-state-info/10 text-ink',
  success: 'border-state-success/40 bg-state-success/10 text-ink',
  warning: 'border-state-warning/40 bg-state-warning/12 text-ink',
  error: 'border-state-error/40 bg-state-error/10 text-ink',
}

/**
 * Token-styled status banner. Renders `role="alert"` so assistive tech
 * announces it; tones map to the shared state palette. No Radix primitive is
 * needed — this is a presentational container with an optional title + action.
 */
export function Alert({ tone = 'info', title, action, className, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start justify-between gap-4 rounded-md border px-5 py-3',
        tones[tone],
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-col gap-1">
        {title && <strong className="text-base font-bold tracking-tight">{title}</strong>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
      {action}
    </div>
  )
}
