import { Progress as KitProgress, type ProgressTone } from '@/components/ui/Progress'
import { cn } from '@/utils/cn'

type ProgressVariant = 'primary' | 'success' | 'warning' | 'error'

interface ProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

// Legacy `primary` maps to the kit's `brand` tone; the rest pass through.
const TONE: Record<ProgressVariant, ProgressTone> = {
  primary: 'brand',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

/**
 * Legacy common Progress — now a thin wrapper over the `ui/` kit Progress
 * (Radix) so existing callers render the canonical kit styling without changing
 * their API. The kit owns the `role="progressbar"` track + indicator and the
 * scaleX fill; this wrapper keeps the optional right-aligned `label` span, the
 * `displayLabel` fallback (`label || rounded percentage`), maps `variant` →
 * kit `tone`, and forwards `aria-label`/`size`/`max`. The wrapper-level
 * `className` lands on the outer container (legacy `.container`) so layout
 * overrides from call sites still apply.
 */
function Progress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const displayLabel = label || `${Math.round(percentage)}%`

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      {showLabel && (
        <span className="text-right text-sm font-medium text-ink-secondary">{displayLabel}</span>
      )}
      <KitProgress
        value={value}
        max={max}
        size={size}
        tone={TONE[variant]}
        aria-label={displayLabel}
      />
    </div>
  )
}

export default Progress
