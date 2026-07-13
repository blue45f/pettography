import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { EMPTY_PET_ID, type PetIdValues } from './schema'

interface PetIdState {
  /** Per-pet cards keyed by pet id. */
  byPet: Record<string, PetIdValues>
  save: (values: PetIdValues) => void
  clear: () => void
}

function activeId(): string | null {
  return useOnboardingStore.getState().activePetId ?? null
}

export const usePetIdStore = create<PetIdState>()(
  persist(
    (set) => ({
      byPet: {},
      save: (values) =>
        set((state) => {
          const id = activeId()
          if (!id) throw new Error('An active pet is required to save a pet ID card.')
          return { byPet: { ...state.byPet, [id]: values } }
        }),
      clear: () =>
        set((state) => {
          const id = activeId()
          if (!id) return {}
          const next = { ...state.byPet }
          delete next[id]
          return { byPet: next }
        }),
    }),
    {
      name: 'pettography.petid.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useActivePetIdCard(): PetIdValues {
  const byPet = usePetIdStore((s) => s.byPet)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return EMPTY_PET_ID
  return byPet[activePetId] ?? EMPTY_PET_ID
}

export function isCardComplete(card: PetIdValues): boolean {
  return !!(
    card.petName.trim() &&
    card.speciesLabel.trim() &&
    card.ownerName.trim() &&
    card.ownerPhone.trim()
  )
}
