import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { EMPTY_PET_ID, type PetIdValues } from './schema'

interface PetIdState {
  /** Legacy single card; kept as a fallback for the active pet. */
  card: PetIdValues
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
      card: EMPTY_PET_ID,
      byPet: {},
      save: (values) =>
        set((state) => {
          const id = activeId()
          if (!id) return { card: values }
          return { byPet: { ...state.byPet, [id]: values } }
        }),
      clear: () =>
        set((state) => {
          const id = activeId()
          if (!id) return { card: EMPTY_PET_ID }
          const next = { ...state.byPet }
          delete next[id]
          return { byPet: next }
        }),
    }),
    {
      name: 'pettography.petid',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useActivePetIdCard(): PetIdValues {
  const card = usePetIdStore((s) => s.card)
  const byPet = usePetIdStore((s) => s.byPet)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return card
  return byPet[activePetId] ?? card
}

export function isCardComplete(card: PetIdValues): boolean {
  return !!(card.petName && card.speciesLabel && card.ownerName && card.ownerPhone)
}
