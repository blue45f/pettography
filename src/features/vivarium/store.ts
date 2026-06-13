import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { VivariumBuild } from './schema'

interface VivariumState {
  builds: VivariumBuild[]
  saveBuild: (input: {
    petId?: string | null
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
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const build: VivariumBuild = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
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
      name: 'pettography.vivarium',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Saved builds scoped to the active pet (legacy untagged builds fall through). */
export function useActivePetBuilds(): VivariumBuild[] {
  const items = useVivariumStore((s) => s.builds)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((e) => !e.petId || e.petId === activePetId)
}
