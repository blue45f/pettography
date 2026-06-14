import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ParentGenotype, SavedPairing } from './schema'

interface GeneticsState {
  pairings: SavedPairing[]
  savePairing: (input: {
    petId?: string | null
    speciesSlug: string
    label: string
    sire: ParentGenotype
    dam: ParentGenotype
  }) => SavedPairing
  removePairing: (id: string) => void
  clear: () => void
}

export const useGeneticsStore = create<GeneticsState>()(
  persist(
    (set) => ({
      pairings: [],
      savePairing: ({ petId, speciesSlug, label, sire, dam }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const pairing: SavedPairing = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesSlug,
          label: label.trim().slice(0, 80) || speciesSlug,
          sire,
          dam,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ pairings: [pairing, ...state.pairings] }))
        return pairing
      },
      removePairing: (id) =>
        set((state) => ({ pairings: state.pairings.filter((p) => p.id !== id) })),
      clear: () => set({ pairings: [] }),
    }),
    {
      name: 'pettography.genetics',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Saved pairings scoped to the active pet (legacy untagged entries fall through). */
export function useActivePetPairings(): SavedPairing[] {
  const pairings = useGeneticsStore((s) => s.pairings)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return pairings
  return pairings.filter((p) => !p.petId || p.petId === activePetId)
}
