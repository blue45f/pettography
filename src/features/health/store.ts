import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { VaccinationEntry, VaccinationKind, WeightEntry } from './schema'

interface HealthState {
  weights: WeightEntry[]
  vaccinations: VaccinationEntry[]
  addWeight: (input: {
    petId?: string | null
    measuredAt: string
    grams: number
    note?: string
  }) => WeightEntry
  removeWeight: (id: string) => void
  addVaccination: (input: {
    petId?: string | null
    kind: VaccinationKind
    name: string
    administeredAt: string
    nextDueAt?: string | null
    clinic?: string
    note?: string
  }) => VaccinationEntry
  removeVaccination: (id: string) => void
  clear: () => void
}

function resolvePetId(petId: string | null | undefined): string | null {
  return petId === undefined ? (useOnboardingStore.getState().activePetId ?? null) : petId
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      weights: [],
      vaccinations: [],
      addWeight: ({ petId, measuredAt, grams, note }) => {
        const entry: WeightEntry = {
          id: crypto.randomUUID(),
          petId: resolvePetId(petId),
          measuredAt,
          grams,
          note,
        }
        set((state) => ({
          weights: [...state.weights, entry].sort((a, b) =>
            a.measuredAt.localeCompare(b.measuredAt)
          ),
        }))
        return entry
      },
      removeWeight: (id) => set((state) => ({ weights: state.weights.filter((w) => w.id !== id) })),
      addVaccination: ({ petId, kind, name, administeredAt, nextDueAt = null, clinic, note }) => {
        const entry: VaccinationEntry = {
          id: crypto.randomUUID(),
          petId: resolvePetId(petId),
          kind,
          name,
          administeredAt,
          nextDueAt,
          clinic,
          note,
        }
        set((state) => ({
          vaccinations: [entry, ...state.vaccinations].sort((a, b) =>
            b.administeredAt.localeCompare(a.administeredAt)
          ),
        }))
        return entry
      },
      removeVaccination: (id) =>
        set((state) => ({ vaccinations: state.vaccinations.filter((v) => v.id !== id) })),
      clear: () => set({ weights: [], vaccinations: [] }),
    }),
    {
      name: 'pettography.health',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Returns weights/vaccinations scoped to the currently active pet.
 * Legacy entries with no petId fall through.
 */
export function useActivePetHealth(): { weights: WeightEntry[]; vaccinations: VaccinationEntry[] } {
  const weights = useHealthStore((s) => s.weights)
  const vaccinations = useHealthStore((s) => s.vaccinations)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return { weights, vaccinations }
  return {
    weights: weights.filter((w) => !w.petId || w.petId === activePetId),
    vaccinations: vaccinations.filter((v) => !v.petId || v.petId === activePetId),
  }
}

export interface WeightTrend {
  latest: number | null
  delta30dGrams: number | null
  min: number | null
  max: number | null
  count: number
}

export function weightTrend(weights: WeightEntry[]): WeightTrend {
  if (weights.length === 0) {
    return { latest: null, delta30dGrams: null, min: null, max: null, count: 0 }
  }
  const sorted = [...weights].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
  const latest = sorted[sorted.length - 1].grams
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const before30 = [...sorted].reverse().find((w) => new Date(w.measuredAt) < cutoff)
  const delta30dGrams = before30 ? latest - before30.grams : null
  const min = Math.min(...sorted.map((w) => w.grams))
  const max = Math.max(...sorted.map((w) => w.grams))
  return { latest, delta30dGrams, min, max, count: sorted.length }
}

export interface UpcomingDue {
  vaccination: VaccinationEntry
  daysLeft: number
}

export function upcomingDues(vaccinations: VaccinationEntry[], horizonDays = 60): UpcomingDue[] {
  const now = new Date()
  return vaccinations
    .filter((v) => v.nextDueAt)
    .map((v) => {
      const due = new Date(v.nextDueAt as string)
      const daysLeft = Math.round((due.getTime() - now.getTime()) / 86_400_000)
      return { vaccination: v, daysLeft }
    })
    .filter((d) => d.daysLeft <= horizonDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}
