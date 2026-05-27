import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { RegistryFiling } from './schema'

interface RegistryState {
  done: Partial<Record<RegistryFiling, string>>
  toggle: (key: RegistryFiling) => void
  clear: () => void
}

export const useRegistryStore = create<RegistryState>()(
  persist(
    (set) => ({
      done: {},
      toggle: (key) =>
        set((state) => {
          const next = { ...state.done }
          if (next[key]) {
            delete next[key]
          } else {
            next[key] = new Date().toISOString()
          }
          return { done: next }
        }),
      clear: () => set({ done: {} }),
    }),
    {
      name: 'pettography.registry',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
