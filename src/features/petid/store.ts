import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { EMPTY_PET_ID, type PetIdValues } from './schema'

interface PetIdState {
  card: PetIdValues
  save: (values: PetIdValues) => void
  clear: () => void
}

export const usePetIdStore = create<PetIdState>()(
  persist(
    (set) => ({
      card: EMPTY_PET_ID,
      save: (values) => set({ card: values }),
      clear: () => set({ card: EMPTY_PET_ID }),
    }),
    {
      name: 'pettography.petid',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function isCardComplete(card: PetIdValues): boolean {
  return !!(card.petName && card.speciesLabel && card.ownerName && card.ownerPhone)
}
