import { useOnboardingStore } from '@features/onboarding'
import { useTranslation } from 'react-i18next'

import styles from './ShowAllPetsToggle.module.css'

interface ShowAllPetsToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Translation key for the label text. Defaults to `petBadge.showAll`. */
  labelKey?: string
}

/**
 * Renders a checkbox that lets users widen a per-pet view to every pet.
 * Self-hides when the user only has one pet (the toggle wouldn't add
 * anything useful and would clutter the page).
 */
function ShowAllPetsToggle({
  checked,
  onChange,
  labelKey = 'petBadge.showAll',
}: ShowAllPetsToggleProps) {
  const { t } = useTranslation()
  const petCount = useOnboardingStore((s) => s.pets.length)
  if (petCount <= 1) return null
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {t(labelKey)}
    </label>
  )
}

export default ShowAllPetsToggle
