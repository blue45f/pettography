import * as LabelPrimitive from '@radix-ui/react-label'

import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/utils/cn'

export interface LabelProps extends ComponentPropsWithRef<typeof LabelPrimitive.Root> {
  /** Append a coral asterisk to mark the field as required. */
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium leading-tight text-ink ' +
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-coral" aria-hidden="true">
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  )
}
