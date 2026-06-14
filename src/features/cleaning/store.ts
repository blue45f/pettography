import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { CleaningLog, CleanType } from './schema'

interface CleaningState {
  logs: CleaningLog[]
  addLog: (input: {
    petId?: string | null
    speciesId: string | null
    type: CleanType
    cleanedAt: string
    note?: string
  }) => CleaningLog
  removeLog: (id: string) => void
  clear: () => void
}

export const useCleaningStore = create<CleaningState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: ({ petId, speciesId, type, cleanedAt, note = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const log: CleaningLog = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          type,
          cleanedAt: cleanedAt.slice(0, 10),
          note,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          logs: [log, ...state.logs].sort((a, b) => b.cleanedAt.localeCompare(a.cleanedAt)),
        }))
        return log
      },
      removeLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      clear: () => set({ logs: [] }),
    }),
    {
      name: 'pettography.cleaning',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Returns cleaning logs scoped to the currently active pet. Legacy logs with
 * no petId fall through to the active pet so existing data keeps showing up
 * after the multi-pet migration.
 */
export function useActivePetCleanings(): CleaningLog[] {
  const logs = useCleaningStore((s) => s.logs)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return logs
  return logs.filter((l) => !l.petId || l.petId === activePetId)
}
