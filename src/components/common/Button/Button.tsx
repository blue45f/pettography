import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { Button as KitButton, type ButtonVariant as KitVariant } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
}

// Legacy variant names map onto the ui kit. 'secondary' has no kit twin; it
// reads as the soft brand fill, the closest match.
const VARIANT_MAP: Record<ButtonVariant, KitVariant> = {
  primary: 'primary',
  secondary: 'soft',
  outline: 'outline',
  ghost: 'ghost',
}

/**
 * Legacy common Button — now a thin wrapper over the `ui/` kit Button so every
 * existing caller renders the canonical kit styling without changing its API.
 * `isLoading` and `fullWidth` (not carried by the kit Button) are handled here.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  className = '',
  'aria-busy': ariaBusy,
  ...props
}: ButtonProps) {
  return (
    <KitButton
      variant={VARIANT_MAP[variant]}
      size={size}
      className={cn(fullWidth && 'w-full', className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? true : ariaBusy}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="size-[1em] animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </KitButton>
  )
}

export default Button
