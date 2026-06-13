import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { LightSchedule } from './schema'

/**
 * Lighting is one schedule *per pet*, so we key a record by a stable pet key
 * rather than holding a list. `petKey` is the pet's id, or the literal
 * `'default'` when there is no active pet (e.g. before onboarding) so the slot
 * is still addressable.
 */
const DEFAULT_KEY = 'default'

export function petKeyOf(petId: string | null | undefined): string {
  return petId ?? DEFAULT_KEY
}

/** A sensible starting schedule for a pet with nothing saved yet: 12h day, no UVB. */
export function defaultSchedule(petId: string | null, speciesId: string | null): LightSchedule {
  return {
    petId: petId ?? null,
    speciesId,
    onHour: 8,
    offHour: 20,
    hasUvb: false,
    uvbHours: null,
    notes: '',
    updatedAt: new Date(0).toISOString(),
  }
}

/** The persisted shape of a `setSchedule` patch (everything optional but petId/key). */
export type LightSchedulePatch = Partial<Omit<LightSchedule, 'updatedAt'>>

interface LightingState {
  schedules: Record<string, LightSchedule>
  /** Create or merge the schedule for `petKey`, stamping `updatedAt`. */
  setSchedule: (petKey: string, patch: LightSchedulePatch) => LightSchedule
  /** Drop the saved schedule for a pet (the page then shows the default again). */
  reset: (petKey: string) => void
  clear: () => void
}

export const useLightingStore = create<LightingState>()(
  persist(
    (set, get) => ({
      schedules: {},
      setSchedule: (petKey, patch) => {
        const existing = get().schedules[petKey]
        const base = existing ?? defaultSchedule(petKey === DEFAULT_KEY ? null : petKey, null)
        const next: LightSchedule = {
          ...base,
          ...patch,
          // A UVB on-time is only meaningful while UVB is enabled.
          uvbHours: (patch.hasUvb ?? base.hasUvb) ? (patch.uvbHours ?? base.uvbHours) : null,
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ schedules: { ...state.schedules, [petKey]: next } }))
        return next
      },
      reset: (petKey) =>
        set((state) => {
          if (!(petKey in state.schedules)) return {}
          const nextSchedules = { ...state.schedules }
          delete nextSchedules[petKey]
          return { schedules: nextSchedules }
        }),
      clear: () => set({ schedules: {} }),
    }),
    {
      name: 'pettography.lighting',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * The saved lighting schedule for the currently active pet, or a sensible
 * default when nothing is saved yet. A legacy / unkeyed entry under `'default'`
 * is used as a fallback so data saved before a pet existed stays visible.
 */
export function useActivePetLighting(): LightSchedule {
  const schedules = useLightingStore((s) => s.schedules)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const profile = useOnboardingStore((s) => s.profile)
  const key = petKeyOf(activePetId)
  return (
    schedules[key] ??
    schedules[DEFAULT_KEY] ??
    defaultSchedule(activePetId ?? null, profile.speciesId ?? null)
  )
}
