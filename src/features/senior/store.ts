import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AcquiredAs, SeniorProfile } from './schema'

/** A blank profile used until the keeper saves anything for this pet. */
export function makeDefaultProfile(petId: string): SeniorProfile {
  return {
    petId,
    ageMonths: null,
    acquiredAs: 'unknown',
    checklist: {},
    notes: '',
    updatedAt: new Date().toISOString(),
  }
}

interface SeniorState {
  /** One record per pet, keyed by petId. */
  profiles: Record<string, SeniorProfile>
  /** Create or update the record for a pet. `petId` defaults to the active pet. */
  upsertProfile: (input: {
    petId?: string | null
    ageMonths: number | null
    acquiredAs: AcquiredAs
    notes: string
  }) => SeniorProfile | null
  /** Toggle a single checklist item for a pet (defaults to the active pet). */
  toggleChecklistItem: (itemId: string, value: boolean, petId?: string | null) => void
  /** Remove a pet's record entirely. */
  removeProfile: (petId: string) => void
  clear: () => void
}

function resolvePetId(petId: string | null | undefined): string | null {
  return petId === undefined ? useOnboardingStore.getState().activePetId : (petId ?? null)
}

export const useSeniorStore = create<SeniorState>()(
  persist(
    (set, get) => ({
      profiles: {},

      upsertProfile: ({ petId, ageMonths, acquiredAs, notes }) => {
        const id = resolvePetId(petId)
        if (!id) return null
        const existing = get().profiles[id]
        const next: SeniorProfile = {
          petId: id,
          ageMonths: ageMonths === null ? null : Math.max(0, Math.round(ageMonths)),
          acquiredAs,
          checklist: existing?.checklist ?? {},
          notes: notes.trim().slice(0, 300),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ profiles: { ...state.profiles, [id]: next } }))
        return next
      },

      toggleChecklistItem: (itemId, value, petId) => {
        const id = resolvePetId(petId)
        if (!id) return
        set((state) => {
          const base = state.profiles[id] ?? makeDefaultProfile(id)
          const checklist = { ...base.checklist, [itemId]: value }
          return {
            profiles: {
              ...state.profiles,
              [id]: { ...base, checklist, updatedAt: new Date().toISOString() },
            },
          }
        })
      },

      removeProfile: (petId) =>
        set((state) => {
          if (!(petId in state.profiles)) return {}
          const next = { ...state.profiles }
          delete next[petId]
          return { profiles: next }
        }),

      clear: () => set({ profiles: {} }),
    }),
    {
      name: 'pettography.senior',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * The senior-care record for the currently active pet, or a fresh default when
 * none has been saved yet (so the page always has something to render).
 */
export function useActivePetSenior(): SeniorProfile {
  const profiles = useSeniorStore((s) => s.profiles)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return makeDefaultProfile('')
  return profiles[activePetId] ?? makeDefaultProfile(activePetId)
}
