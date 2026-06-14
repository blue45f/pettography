import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { VitalReading, VitalType } from './schema'

interface VitalsState {
  readings: VitalReading[]
  addReading: (input: {
    petId?: string | null
    speciesId: string | null
    type: VitalType
    bpm: number
    measuredAt: string
    durationSec: number
    taps: number
    note?: string
  }) => VitalReading
  removeReading: (id: string) => void
  clear: () => void
}

export const useVitalsStore = create<VitalsState>()(
  persist(
    (set) => ({
      readings: [],
      addReading: ({ petId, speciesId, type, bpm, measuredAt, durationSec, taps, note = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const reading: VitalReading = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          type,
          bpm,
          measuredAt,
          durationSec,
          taps,
          note: note.trim().slice(0, 200),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          readings: [reading, ...state.readings].sort((a, b) =>
            b.measuredAt.localeCompare(a.measuredAt)
          ),
        }))
        return reading
      },
      removeReading: (id) =>
        set((state) => ({ readings: state.readings.filter((r) => r.id !== id) })),
      clear: () => set({ readings: [] }),
    }),
    {
      name: 'pettography.vitals',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Vital readings scoped to the active pet (legacy untagged readings fall through). */
export function useActivePetVitals(): VitalReading[] {
  const readings = useVitalsStore((s) => s.readings)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return readings
  return readings.filter((r) => !r.petId || r.petId === activePetId)
}
