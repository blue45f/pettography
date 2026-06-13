import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { GrowthEntry } from './schema'

interface GrowthState {
  entries: GrowthEntry[]
  addEntry: (input: {
    petId?: string | null
    speciesId: string | null
    measuredAt: string
    weightGram: number
    lengthCm?: number | null
    note?: string
  }) => GrowthEntry
  removeEntry: (id: string) => void
  clear: () => void
}

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({ petId, speciesId, measuredAt, weightGram, lengthCm = null, note = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const entry: GrowthEntry = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          measuredAt,
          weightGram,
          lengthCm: lengthCm ?? null,
          note: note.trim().slice(0, 200),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          entries: [entry, ...state.entries].sort((a, b) =>
            b.measuredAt.localeCompare(a.measuredAt),
          ),
        }))
        return entry
      },
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pettography.growth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** Growth entries scoped to the active pet (legacy untagged entries fall through). */
export function useActivePetGrowth(): GrowthEntry[] {
  const entries = useGrowthStore((s) => s.entries)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return entries
  return entries.filter((e) => !e.petId || e.petId === activePetId)
}
