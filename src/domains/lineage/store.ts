import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { LineageAnimal, Sex } from './schema'

interface LineageState {
  animals: LineageAnimal[]
  addAnimal: (input: {
    name: string
    speciesId?: string | null
    sex: Sex
    morph?: string
    sireId?: string | null
    damId?: string | null
    notes?: string
  }) => LineageAnimal
  updateAnimal: (id: string, patch: Partial<Omit<LineageAnimal, 'id' | 'createdAt'>>) => void
  /** Remove an animal AND detach it from any child that referenced it as a parent. */
  removeAnimal: (id: string) => void
  clear: () => void
}

/** Keep the roster newest-first so a freshly added animal surfaces at the top. */
function sortByCreatedDesc(animals: LineageAnimal[]): LineageAnimal[] {
  return [...animals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const useLineageStore = create<LineageState>()(
  persist(
    (set) => ({
      animals: [],
      addAnimal: ({
        name,
        speciesId = null,
        sex,
        morph = '',
        sireId = null,
        damId = null,
        notes = '',
      }) => {
        const animal: LineageAnimal = {
          id: crypto.randomUUID(),
          name,
          speciesId: speciesId ?? null,
          sex,
          morph,
          sireId: sireId ?? null,
          damId: damId ?? null,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ animals: sortByCreatedDesc([animal, ...state.animals]) }))
        return animal
      },
      updateAnimal: (id, patch) =>
        set((state) => ({
          animals: state.animals.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAnimal: (id) =>
        set((state) => ({
          animals: state.animals
            .filter((a) => a.id !== id)
            // Any child that pointed at the removed animal loses that parent link.
            .map((a) => ({
              ...a,
              sireId: a.sireId === id ? null : a.sireId,
              damId: a.damId === id ? null : a.damId,
            })),
        })),
      clear: () => set({ animals: [] }),
    }),
    {
      name: 'pettography.lineage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
