import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { VivariumBuild } from './schema'

interface VivariumState {
  builds: VivariumBuild[]
  saveBuild: (input: {
    petId?: string
    speciesId: string | null
    name: string
    substrateIds: string[]
    crewIds: string[]
    plantIds: string[]
    tempHotC?: number | null
    tempCoolC?: number | null
    humidityPct?: number | null
    notes?: string
  }) => VivariumBuild
  removeBuild: (id: string) => void
  clear: () => void
}

export const useVivariumStore = create<VivariumState>()(
  persist(
    (set) => ({
      builds: [],
      saveBuild: ({
        petId,
        speciesId,
        name,
        substrateIds,
        crewIds,
        plantIds,
        tempHotC = null,
        tempCoolC = null,
        humidityPct = null,
        notes = '',
      }) => {
        const resolvedPetId = petId ?? useOnboardingStore.getState().activePetId
        if (!resolvedPetId) throw new Error('An active pet is required to save a vivarium plan.')
        const build: VivariumBuild = {
          id: crypto.randomUUID(),
          petId: resolvedPetId,
          speciesId,
          name: name.trim().slice(0, 80) || 'Bioactive build',
          substrateIds,
          crewIds,
          plantIds,
          tempHotC: tempHotC ?? null,
          tempCoolC: tempCoolC ?? null,
          humidityPct: humidityPct ?? null,
          notes: notes.trim().slice(0, 500),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ builds: [build, ...state.builds] }))
        return build
      },
      removeBuild: (id) => set((state) => ({ builds: state.builds.filter((b) => b.id !== id) })),
      clear: () => set({ builds: [] }),
    }),
    {
      name: 'pettography.vivarium.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Saved builds strictly scoped to the active pet. */
export function useActivePetBuilds(): VivariumBuild[] {
  const items = useVivariumStore((s) => s.builds)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return []
  return items.filter((e) => e.petId === activePetId)
}
