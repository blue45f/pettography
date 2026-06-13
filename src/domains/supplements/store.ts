import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { DustingLog, ScheduleConfig, SupplementType } from './schema'

interface SupplementsState {
  logs: DustingLog[]
  /** Optional per-pet schedule overrides (days between dustings per type). */
  schedule: ScheduleConfig

  addLog: (input: {
    petId?: string | null
    speciesId: string | null
    type: SupplementType
    dustedAt: string
    note?: string
  }) => DustingLog
  removeLog: (id: string) => void
  /** Set (or clear, with null) the custom interval for one supplement type. */
  setInterval: (type: SupplementType, days: number | null) => void
  clear: () => void
}

export const useSupplementsStore = create<SupplementsState>()(
  persist(
    (set) => ({
      logs: [],
      schedule: {},

      addLog: ({ petId, speciesId, type, dustedAt, note = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const log: DustingLog = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          type,
          dustedAt,
          note,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          logs: [log, ...state.logs].sort((a, b) => b.dustedAt.localeCompare(a.dustedAt)),
        }))
        return log
      },

      removeLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),

      setInterval: (type, days) =>
        set((state) => {
          const next = { ...state.schedule }
          if (days === null || !Number.isFinite(days) || days <= 0) {
            delete next[type]
          } else {
            next[type] = Math.floor(days)
          }
          return { schedule: next }
        }),

      clear: () => set({ logs: [], schedule: {} }),
    }),
    {
      name: 'pettography.supplements',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Dusting logs scoped to the active pet. Legacy entries with no petId fall
 * through so existing data keeps showing after the multi-pet migration.
 */
export function useActivePetDustings(): DustingLog[] {
  const logs = useSupplementsStore((s) => s.logs)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return logs
  return logs.filter((e) => !e.petId || e.petId === activePetId)
}
