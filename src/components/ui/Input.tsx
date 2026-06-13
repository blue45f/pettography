import type { InputHTMLAttributes, Ref } from 'react'

import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
}

export const inputBaseClass =
  'flex h-10 w-full rounded-md border border-line bg-panel px-3 py-2 text-base text-ink ' +
  'leading-tight shadow-sm transition-colors duration-150 ease-quint ' +
  'placeholder:text-ink-muted ' +
  'focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'aria-[invalid=true]:border-state-error aria-[invalid=true]:focus-visible:ring-state-error'

export function Input({ className, type = 'text', ref, ...props }: InputProps) {
  return <input ref={ref} type={type} className={cn(inputBaseClass, className)} {...props} />
}
