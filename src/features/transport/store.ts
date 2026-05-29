import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Purpose, Trip } from './schema'

interface TransportState {
  trips: Trip[]
  addTrip: (input: {
    petId?: string | null
    speciesId: string | null
    purpose: Purpose
    date: string
    durationHours?: number | null
    notes?: string
  }) => Trip
  /** Flip a single checklist item for one trip. */
  toggleChecklistItem: (id: string, key: string) => void
  removeTrip: (id: string) => void
  clear: () => void
}

export const useTransportStore = create<TransportState>()(
  persist(
    (set) => ({
      trips: [],
      addTrip: ({ petId, speciesId, purpose, date, durationHours = null, notes = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const trip: Trip = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          purpose,
          date: date.slice(0, 10),
          durationHours: durationHours ?? null,
          notes: notes.trim(),
          checklist: {},
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ trips: [trip, ...state.trips] }))
        return trip
      },
      toggleChecklistItem: (id, key) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, checklist: { ...trip.checklist, [key]: !trip.checklist[key] } }
              : trip,
          ),
        })),
      removeTrip: (id) => set((state) => ({ trips: state.trips.filter((t) => t.id !== id) })),
      clear: () => set({ trips: [] }),
    }),
    {
      name: 'pettography.transport',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Trips scoped to the currently active pet. Legacy rows with no `petId` fall
 * through to the active pet so existing data keeps showing after the multi-pet
 * migration (mirrors `useActivePetDiary`).
 */
export function useActivePetTrips(): Trip[] {
  const trips = useTransportStore((s) => s.trips)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return trips
  return trips.filter((t) => !t.petId || t.petId === activePetId)
}
