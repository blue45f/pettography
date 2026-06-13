import Badge from '@components/common/Badge'
import { useOnboardingStore } from '@domains/onboarding'

import { usePetLabel } from './usePetLabel'

interface PetBadgeProps {
  petId: string | null | undefined
  /** When true, the badge is hidden if petId matches the currently active pet. */
  hideWhenActive?: boolean
}

function PetBadge({ petId, hideWhenActive = false }: PetBadgeProps) {
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const label = usePetLabel(petId)
  if (!label) return null
  if (hideWhenActive && petId === activePetId) return null
  return (
    <Badge variant="default">
      <span aria-hidden="true">{label.emoji}</span> {label.name}
    </Badge>
  )
}

export default PetBadge
