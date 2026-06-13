import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert as KitAlert } from '@/components/ui/Alert'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

/**
 * Legacy common Alert — now a thin wrapper over the `ui/` kit Alert so every
 * existing caller renders the canonical token styling without changing its API.
 * The legacy `variant` maps directly onto the kit `tone`; the optional inline
 * dismiss button (shown when `dismissible`) keeps its `common.dismiss` label
 * and removes the banner from the tree on click, mirroring the old behavior.
 */
function Alert({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <KitAlert
      tone={variant}
      title={title}
      className={className}
      action={
        dismissible ? (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('common.dismiss')}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-xl leading-none text-current opacity-60 transition-opacity duration-150 ease-quint hover:bg-panel-muted hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            &times;
          </button>
        ) : undefined
      }
    >
      {children}
    </KitAlert>
  )
}

export default Alert
