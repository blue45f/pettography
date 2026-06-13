import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Clutch, ClutchStatus, Pairing } from './schema'

interface BreedingState {
  pairings: Pairing[]
  clutches: Clutch[]
  addPairing: (input: {
    petId?: string | null
    speciesId: string | null
    sireName: string
    damName: string
    pairedAt: string
    notes?: string
  }) => Pairing
  removePairing: (id: string) => void
  addClutch: (input: {
    petId?: string | null
    pairingId: string | null
    speciesId: string | null
    laidAt: string
    eggCount: number
    fertileCount?: number | null
    incubationTempC?: number | null
    notes?: string
  }) => Clutch
  updateClutchStatus: (id: string, status: ClutchStatus) => void
  removeClutch: (id: string) => void
  clear: () => void
}

export const useBreedingStore = create<BreedingState>()(
  persist(
    (set) => ({
      pairings: [],
      clutches: [],
      addPairing: ({ petId, speciesId, sireName, damName, pairedAt, notes = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const pairing: Pairing = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          sireName,
          damName,
          pairedAt,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          pairings: [pairing, ...state.pairings].sort((a, b) =>
            b.pairedAt.localeCompare(a.pairedAt)
          ),
        }))
        return pairing
      },
      removePairing: (id) =>
        set((state) => ({
          pairings: state.pairings.filter((p) => p.id !== id),
          // Detach clutches that pointed at the removed pairing.
          clutches: state.clutches.map((c) => (c.pairingId === id ? { ...c, pairingId: null } : c)),
        })),
      addClutch: ({
        petId,
        pairingId,
        speciesId,
        laidAt,
        eggCount,
        fertileCount = null,
        incubationTempC = null,
        notes = '',
      }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const clutch: Clutch = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          pairingId,
          speciesId,
          laidAt,
          eggCount,
          fertileCount: fertileCount ?? null,
          incubationTempC: incubationTempC ?? null,
          status: 'incubating',
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          clutches: [clutch, ...state.clutches].sort((a, b) => b.laidAt.localeCompare(a.laidAt)),
        }))
        return clutch
      },
      updateClutchStatus: (id, status) =>
        set((state) => ({
          clutches: state.clutches.map((c) => (c.id === id ? { ...c, status } : c)),
        })),
      removeClutch: (id) =>
        set((state) => ({ clutches: state.clutches.filter((c) => c.id !== id) })),
      clear: () => set({ pairings: [], clutches: [] }),
    }),
    {
      name: 'pettography.breeding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Pairings scoped to the active pet. Legacy / unscoped entries (no petId)
 * fall through so they stay visible after the multi-pet migration.
 */
export function useActivePetPairings(): Pairing[] {
  const items = useBreedingStore((s) => s.pairings)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((e) => !e.petId || e.petId === activePetId)
}

/** Clutches scoped to the active pet (same fall-through rule as pairings). */
export function useActivePetClutches(): Clutch[] {
  const items = useBreedingStore((s) => s.clutches)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((e) => !e.petId || e.petId === activePetId)
}
