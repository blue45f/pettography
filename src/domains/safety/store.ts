import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { DEFAULT_PET_KEY, type AuditMap } from './schema'

interface SafetyStoreState {
  /** Pet key → that pet's audit map (item id → confirmed?). */
  audits: Record<string, AuditMap>
  /** Toggle one item for one pet key. */
  toggleItem: (petKey: string, itemId: string) => void
  /** Clear a single pet's audit. */
  resetAudit: (petKey: string) => void
  /** Wipe every pet's audit. */
  clear: () => void
}

export const useSafetyStore = create<SafetyStoreState>()(
  persist(
    (set) => ({
      audits: {},
      toggleItem: (petKey, itemId) =>
        set((state) => {
          const current = state.audits[petKey] ?? {}
          return {
            audits: {
              ...state.audits,
              [petKey]: { ...current, [itemId]: !current[itemId] },
            },
          }
        }),
      resetAudit: (petKey) =>
        set((state) => {
          if (!(petKey in state.audits)) return {}
          const next = { ...state.audits }
          delete next[petKey]
          return { audits: next }
        }),
      clear: () => set({ audits: {} }),
    }),
    {
      name: 'pettography.safety',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Resolves the pet key for the currently active pet, falling back to the
 * literal `'default'` key when no pet is active. Reads from the onboarding
 * store outside React so it can be used in handlers too.
 */
export function activePetKey(): string {
  return useOnboardingStore.getState().activePetId ?? DEFAULT_PET_KEY
}

/**
 * Returns the active pet's audit map (item id → confirmed?), or an empty map
 * when nothing has been checked yet for that pet.
 */
export function useActivePetAudit(): AuditMap {
  const audits = useSafetyStore((s) => s.audits)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const key = activePetId ?? DEFAULT_PET_KEY
  return audits[key] ?? {}
}
