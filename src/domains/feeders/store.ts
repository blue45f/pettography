import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { FeederColony, FeederType } from './schema'

/**
 * Feeder cultures are keeper-level: a single colony of dubia roaches or a
 * springtail culture feeds every animal in the household, so the store is
 * global and the records carry no `petId`.
 */
interface FeedersState {
  colonies: FeederColony[]
  addColony: (input: {
    type: FeederType
    name: string
    startedAt: string
    estimateCount?: number | null
    notes?: string
  }) => FeederColony
  /** Record a gut-load ("fed the feeders") on `dateISO`, setting `lastFedAt`. */
  markFed: (id: string, dateISO: string) => void
  updateColony: (
    id: string,
    patch: Partial<Pick<FeederColony, 'type' | 'name' | 'startedAt' | 'estimateCount' | 'notes'>>
  ) => void
  removeColony: (id: string) => void
  clear: () => void
}

export const useFeedersStore = create<FeedersState>()(
  persist(
    (set) => ({
      colonies: [],
      addColony: ({ type, name, startedAt, estimateCount = null, notes = '' }) => {
        const colony: FeederColony = {
          id: crypto.randomUUID(),
          type,
          name,
          startedAt,
          estimateCount: estimateCount ?? null,
          lastFedAt: null,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          colonies: [colony, ...state.colonies].sort((a, b) =>
            b.startedAt.localeCompare(a.startedAt)
          ),
        }))
        return colony
      },
      markFed: (id, dateISO) =>
        set((state) => ({
          colonies: state.colonies.map((c) =>
            c.id === id ? { ...c, lastFedAt: dateISO.slice(0, 10) } : c
          ),
        })),
      updateColony: (id, patch) =>
        set((state) => ({
          colonies: state.colonies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeColony: (id) =>
        set((state) => ({ colonies: state.colonies.filter((c) => c.id !== id) })),
      clear: () => set({ colonies: [] }),
    }),
    {
      name: 'pettography.feeders',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
