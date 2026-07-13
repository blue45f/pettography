import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { EnclosureCheck } from './schema'

/** Resolves the storage key for a pet and rejects unscoped records. */
export function resolvePetKey(petKey?: string | null): string {
  const resolved = petKey ?? useOnboardingStore.getState().activePetId
  if (!resolved) throw new Error('An active pet is required to save enclosure dimensions.')
  return resolved
}

interface EnclosureState {
  checks: Record<string, EnclosureCheck>
  setCheck: (
    petKey: string,
    patch: {
      speciesId?: string | null
      lengthCm?: number | null
      widthCm?: number | null
      heightCm?: number | null
    }
  ) => EnclosureCheck
  reset: (petKey: string) => void
  clear: () => void
}

export const useEnclosureStore = create<EnclosureState>()(
  persist(
    (set, get) => ({
      checks: {},
      setCheck: (petKey, patch) => {
        const existing = get().checks[petKey]
        const next: EnclosureCheck = {
          petId: petKey,
          speciesId: patch.speciesId ?? existing?.speciesId ?? null,
          lengthCm: patch.lengthCm ?? existing?.lengthCm ?? null,
          widthCm: patch.widthCm ?? existing?.widthCm ?? null,
          heightCm: patch.heightCm ?? existing?.heightCm ?? null,
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ checks: { ...state.checks, [petKey]: next } }))
        return next
      },
      reset: (petKey) =>
        set((state) => {
          if (!(petKey in state.checks)) return {}
          const rest = { ...state.checks }
          delete rest[petKey]
          return { checks: rest }
        }),
      clear: () => set({ checks: {} }),
    }),
    {
      name: 'pettography.enclosure.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Returns the persisted enclosure check for the currently active pet, or
 * null when nothing has been entered for it yet.
 */
export function useActivePetEnclosure(): EnclosureCheck | null {
  const checks = useEnclosureStore((s) => s.checks)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return null
  return checks[activePetId] ?? null
}
