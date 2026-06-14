import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { FeedLog } from './schema'

interface FeedingState {
  logs: FeedLog[]
  addLog: (input: {
    petId?: string | null
    speciesId: string | null
    fedAt: string
    item: string
    quantity?: number | null
    accepted: boolean
    notes: string
  }) => FeedLog
  removeLog: (id: string) => void
  clear: () => void
}

export const useFeedingStore = create<FeedingState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: ({ petId, speciesId, fedAt, item, quantity = null, accepted, notes }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const log: FeedLog = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          fedAt,
          item,
          quantity: quantity ?? null,
          accepted,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          logs: [log, ...state.logs].sort((a, b) => b.fedAt.localeCompare(a.fedAt)),
        }))
        return log
      },
      removeLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      clear: () => set({ logs: [] }),
    }),
    {
      name: 'pettography.feeding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Feeding logs scoped to the active pet. Legacy logs with no petId fall through
 * to the active pet so pre-multi-pet data keeps showing up.
 */
export function useActivePetFeedings(): FeedLog[] {
  const items = useFeedingStore((s) => s.logs)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((e) => !e.petId || e.petId === activePetId)
}
