import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { BcsEntry } from './schema'

interface BcsState {
  entries: BcsEntry[]
  addEntry: (input: {
    petId?: string | null
    speciesId: string | null
    assessedAt: string
    score: number
    note?: string
  }) => BcsEntry
  removeEntry: (id: string) => void
  clear: () => void
}

export const useBcsStore = create<BcsState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({ petId, speciesId, assessedAt, score, note = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const entry: BcsEntry = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          assessedAt,
          score,
          note: note.trim().slice(0, 200),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          entries: [entry, ...state.entries].sort((a, b) =>
            b.assessedAt.localeCompare(a.assessedAt)
          ),
        }))
        return entry
      },
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pettography.bcs',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** BCS entries scoped to the active pet (legacy untagged entries fall through). */
export function useActivePetBcs(): BcsEntry[] {
  const entries = useBcsStore((s) => s.entries)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return entries
  return entries.filter((e) => !e.petId || e.petId === activePetId)
}
