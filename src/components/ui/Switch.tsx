import * as SwitchPrimitive from '@radix-ui/react-switch'

import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/utils/cn'

export type SwitchSize = 'sm' | 'md'

export interface SwitchProps extends ComponentPropsWithRef<typeof SwitchPrimitive.Root> {
  size?: SwitchSize
}

// Track dimensions per size; the thumb travels the track width minus its own
// size and the 2px inset on each edge.
const tracks: Record<SwitchSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
}

const thumbs: Record<SwitchSize, string> = {
  sm: 'size-4 data-[state=checked]:translate-x-4',
  md: 'size-5 data-[state=checked]:translate-x-5',
}

export function Switch({ className, size = 'md', ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'group peer inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 ' +
          'border-0 bg-line transition-colors duration-150 ease-quint ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ' +
          'focus-visible:ring-offset-2 focus-visible:ring-offset-app ' +
          'disabled:cursor-not-allowed disabled:opacity-50 ' +
          'data-[state=checked]:bg-brand',
        tracks[size],
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block translate-x-0 rounded-full bg-white shadow-sm ' +
            'transition-transform duration-150 ease-quint',
          thumbs[size],
        )}
      />
    </SwitchPrimitive.Root>
  )
}
