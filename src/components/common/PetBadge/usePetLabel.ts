import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList } from '@features/species'

export interface PetLabel {
  name: string
  emoji: string
}

/**
 * Look up the display label (nickname or species fallback + species emoji)
 * for a stored petId. Returns null when the id is empty/unknown so callers
 * can decide whether to render anything.
 */
export function usePetLabel(petId: string | null | undefined): PetLabel | null {
  const pets = useOnboardingStore((s) => s.pets)
  const { data: speciesList = [] } = useSpeciesList({})
  if (!petId) return null
  const pet = pets.find((p) => p.id === petId)
  if (!pet) return null
  const sp = speciesList.find((s) => s.id === pet.speciesId)
  return {
    name: pet.petName?.trim() || sp?.koreanName || '?',
    emoji: sp?.heroEmoji ?? '🐾',
  }
}
