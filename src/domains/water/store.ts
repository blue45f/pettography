import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { sortByDate } from './engine'

import type { WaterReading } from './schema'

interface WaterState {
  readings: WaterReading[]
  addReading: (input: {
    petId?: string | null
    speciesId: string | null
    measuredAt: string
    tempC?: number | null
    ph?: number | null
    ammoniaPpm?: number | null
    nitritePpm?: number | null
    nitratePpm?: number | null
    note?: string
  }) => WaterReading
  removeReading: (id: string) => void
  clear: () => void
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set) => ({
      readings: [],
      addReading: ({
        petId,
        speciesId,
        measuredAt,
        tempC = null,
        ph = null,
        ammoniaPpm = null,
        nitritePpm = null,
        nitratePpm = null,
        note = '',
      }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const reading: WaterReading = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          measuredAt,
          tempC: tempC ?? null,
          ph: ph ?? null,
          ammoniaPpm: ammoniaPpm ?? null,
          nitritePpm: nitritePpm ?? null,
          nitratePpm: nitratePpm ?? null,
          note,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ readings: sortByDate([reading, ...state.readings]) }))
        return reading
      },
      removeReading: (id) =>
        set((state) => ({ readings: state.readings.filter((r) => r.id !== id) })),
      clear: () => set({ readings: [] }),
    }),
    {
      name: 'pettography.water',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Water readings scoped to the active pet. Legacy readings with no petId fall
 * through to the active pet so older data keeps showing after multi-pet migration.
 */
export function useActivePetReadings(): WaterReading[] {
  const readings = useWaterStore((s) => s.readings)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return readings
  return readings.filter((r) => !r.petId || r.petId === activePetId)
}
