import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { HABITAT_RECOMMENDATIONS, type HabitatEntry, type HabitatRange } from './schema'

import type { SpeciesCategory } from '@domains/species'

interface HabitatState {
  entries: HabitatEntry[]
  addEntry: (input: {
    petId?: string | null
    measuredAt: string
    temperatureC?: number | null
    humidityPct?: number | null
    uvbHoursToday?: number | null
    note?: string
  }) => HabitatEntry
  removeEntry: (id: string) => void
  clear: () => void
}

export const useHabitatStore = create<HabitatState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({
        petId,
        measuredAt,
        temperatureC = null,
        humidityPct = null,
        uvbHoursToday = null,
        note,
      }) => {
        const resolvedPetId =
          petId === undefined ? (useOnboardingStore.getState().activePetId ?? null) : petId
        const entry: HabitatEntry = {
          id: crypto.randomUUID(),
          petId: resolvedPetId,
          measuredAt,
          temperatureC: temperatureC ?? null,
          humidityPct: humidityPct ?? null,
          uvbHoursToday: uvbHoursToday ?? null,
          note,
        }
        set((state) => ({
          entries: [...state.entries, entry].sort((a, b) =>
            a.measuredAt.localeCompare(b.measuredAt),
          ),
        }))
        return entry
      },
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pettography.habitat',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function useActivePetHabitat(): HabitatEntry[] {
  const entries = useHabitatStore((s) => s.entries)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return entries
  return entries.filter((e) => !e.petId || e.petId === activePetId)
}

export interface HabitatStats {
  count: number
  tempAvg: number | null
  tempMin: number | null
  tempMax: number | null
  humidityAvg: number | null
  humidityMin: number | null
  humidityMax: number | null
  latest: HabitatEntry | null
}

export function habitatStats(entries: HabitatEntry[]): HabitatStats {
  if (entries.length === 0) {
    return {
      count: 0,
      tempAvg: null,
      tempMin: null,
      tempMax: null,
      humidityAvg: null,
      humidityMin: null,
      humidityMax: null,
      latest: null,
    }
  }
  const temps = entries.map((e) => e.temperatureC).filter((v): v is number => v !== null)
  const hums = entries.map((e) => e.humidityPct).filter((v): v is number => v !== null)
  const avg = (arr: number[]) =>
    arr.length === 0 ? null : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
  const sorted = [...entries].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
  return {
    count: entries.length,
    tempAvg: avg(temps),
    tempMin: temps.length ? Math.min(...temps) : null,
    tempMax: temps.length ? Math.max(...temps) : null,
    humidityAvg: avg(hums),
    humidityMin: hums.length ? Math.min(...hums) : null,
    humidityMax: hums.length ? Math.max(...hums) : null,
    latest: sorted[sorted.length - 1],
  }
}

export function recommendationFor(
  category: SpeciesCategory | null | undefined,
): HabitatRange | undefined {
  if (!category) return undefined
  return HABITAT_RECOMMENDATIONS[category]
}

export interface RangeBreach {
  kind: 'temperature' | 'humidity'
  direction: 'low' | 'high'
  value: number
  threshold: number
}

export function detectBreaches(
  latest: HabitatEntry | null,
  range: HabitatRange | undefined,
): RangeBreach[] {
  if (!latest || !range) return []
  const breaches: RangeBreach[] = []
  if (latest.temperatureC !== null) {
    if (latest.temperatureC < range.tempMin) {
      breaches.push({
        kind: 'temperature',
        direction: 'low',
        value: latest.temperatureC,
        threshold: range.tempMin,
      })
    } else if (latest.temperatureC > range.tempMax) {
      breaches.push({
        kind: 'temperature',
        direction: 'high',
        value: latest.temperatureC,
        threshold: range.tempMax,
      })
    }
  }
  if (latest.humidityPct !== null) {
    if (latest.humidityPct < range.humidityMin) {
      breaches.push({
        kind: 'humidity',
        direction: 'low',
        value: latest.humidityPct,
        threshold: range.humidityMin,
      })
    } else if (latest.humidityPct > range.humidityMax) {
      breaches.push({
        kind: 'humidity',
        direction: 'high',
        value: latest.humidityPct,
        threshold: range.humidityMax,
      })
    }
  }
  return breaches
}
