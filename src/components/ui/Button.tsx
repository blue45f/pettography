import { Slot } from '@radix-ui/react-slot'

import type { ButtonHTMLAttributes, Ref } from 'react'

import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render the child element instead of a `<button>` (Radix Slot). */
  asChild?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  ref?: Ref<HTMLButtonElement>
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'leading-tight transition-colors duration-150 ease-quint select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-app disabled:pointer-events-none disabled:opacity-50 ' +
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[1.125em]'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand shadow-sm hover:bg-brand-hover',
  soft: 'bg-brand-soft text-brand hover:bg-brand-100',
  outline: 'border border-line-strong bg-panel text-ink hover:bg-panel-muted',
  ghost: 'bg-transparent text-ink hover:bg-panel-muted',
  danger: 'bg-state-error text-on-brand shadow-sm hover:opacity-90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
}

export function Button({
  asChild = false,
  variant = 'primary',
  size = 'md',
  className,
  type,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      // Slot forwards to the child element, which sets its own type/role.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}
