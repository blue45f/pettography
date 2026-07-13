import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ParentGenotype, SavedPairing } from './schema'

interface GeneticsState {
  pairings: SavedPairing[]
  savePairing: (input: {
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
      savePairing: ({ speciesSlug, label, sire, dam }) => {
        const pairing: SavedPairing = {
          id: crypto.randomUUID(),
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
      name: 'pettography.genetics.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Saved genetics scenarios are keeper-level educational drafts. */
export function useActivePetPairings(): SavedPairing[] {
  return useGeneticsStore((s) => s.pairings)
}
