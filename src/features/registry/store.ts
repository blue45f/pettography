import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { RegistryFiling } from './schema'

type FilingDone = Partial<Record<RegistryFiling, string>>

interface RegistryState {
  /** Legacy single-user store. Kept as the fallback for the active pet
   *  when byPet does not have an entry. */
  done: FilingDone
  /** Per-pet filing checklists. */
  byPet: Record<string, FilingDone>
  toggle: (key: RegistryFiling) => void
  clear: () => void
}

function activeId(): string | null {
  return useOnboardingStore.getState().activePetId ?? null
}

export const useRegistryStore = create<RegistryState>()(
  persist(
    (set) => ({
      done: {},
      byPet: {},
      toggle: (key) =>
        set((state) => {
          const id = activeId()
          if (!id) {
            const next = { ...state.done }
            if (next[key]) delete next[key]
            else next[key] = new Date().toISOString()
            return { done: next }
          }
          const current = state.byPet[id] ?? state.done
          const next = { ...current }
          if (next[key]) delete next[key]
          else next[key] = new Date().toISOString()
          return { byPet: { ...state.byPet, [id]: next } }
        }),
      clear: () =>
        set((state) => {
          const id = activeId()
          if (!id) return { done: {} }
          const nextByPet = { ...state.byPet }
          delete nextByPet[id]
          return { byPet: nextByPet }
        }),
    }),
    {
      name: 'pettography.registry',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function useActivePetFilings(): FilingDone {
  const done = useRegistryStore((s) => s.done)
  const byPet = useRegistryStore((s) => s.byPet)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return done
  return byPet[activePetId] ?? done
}
