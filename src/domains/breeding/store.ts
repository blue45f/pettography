import { useOnboardingStore } from '@domains/onboarding'
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
      name: 'pettography.breeding.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Pairings strictly scoped to the active pet or pre-onboarding null slot.
 */
export function useActivePetPairings(): Pairing[] {
  const items = useBreedingStore((s) => s.pairings)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items.filter((item) => !item.petId)
  return items.filter((item) => item.petId === activePetId)
}

/** Clutches scoped with the same strict pet boundary as pairings. */
export function useActivePetClutches(): Clutch[] {
  const items = useBreedingStore((s) => s.clutches)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items.filter((item) => !item.petId)
  return items.filter((item) => item.petId === activePetId)
}
