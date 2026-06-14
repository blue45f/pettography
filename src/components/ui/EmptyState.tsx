import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** A lucide-react icon component, e.g. `Inbox`. */
  icon?: LucideIcon
  title: string
  description?: ReactNode
  /** Typically a `<Button>` (or any action node) rendered below the copy. */
  action?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-line ' +
          'bg-panel-muted px-6 py-12 text-center',
        className
      )}
      {...props}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-md bg-brand-soft text-brand">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold leading-tight text-ink">{title}</p>
        {description ? (
          <p className="text-sm leading-normal text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
