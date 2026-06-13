import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { GearItem, GearType } from './schema'

interface GearState {
  items: GearItem[]
  addItem: (input: {
    petId?: string | null
    typeId: GearType
    name: string
    installedAt: string
    intervalMonths: number
    notes?: string
  }) => GearItem
  /** Reset an item's cycle: set `installedAt` to `dateISO` (the replacement day). */
  markReplaced: (id: string, dateISO: string) => void
  removeItem: (id: string) => void
  clear: () => void
}

export const useGearStore = create<GearState>()(
  persist(
    (set) => ({
      items: [],
      addItem: ({ petId, typeId, name, installedAt, intervalMonths, notes = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const item: GearItem = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          typeId,
          name,
          installedAt: installedAt.slice(0, 10),
          intervalMonths,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ items: [item, ...state.items] }))
        return item
      },
      markReplaced: (id, dateISO) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, installedAt: dateISO.slice(0, 10) } : item
          ),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'pettography.gear',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Returns gear scoped to the currently active pet. Items with no petId fall
 * through to the active pet so legacy / unscoped gear keeps showing up.
 */
export function useActivePetGear(): GearItem[] {
  const items = useGearStore((s) => s.items)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((g) => !g.petId || g.petId === activePetId)
}
