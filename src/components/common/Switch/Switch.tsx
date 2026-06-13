import { useId } from 'react'

import { Switch as KitSwitch } from '@/components/ui/Switch'
import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Legacy common Switch — now a thin wrapper over the `ui/` kit Switch so every
 * existing caller renders the canonical kit styling without changing its API.
 * The kit Switch is the Radix `role="switch"` control; this wrapper keeps the
 * legacy `onChange(checked)` signature, the optional inline `label` (associated
 * via `aria-labelledby`), and the wrapper-level `className`.
 */
function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: SwitchProps) {
  const id = useId()
  const labelId = `${id}-label`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <KitSwitch
        id={id}
        size={size}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-labelledby={label ? labelId : undefined}
      />
      {label && (
        <span id={labelId} className="select-none text-sm text-ink">
          {label}
        </span>
      )}
    </span>
  )
}

export default Switch
