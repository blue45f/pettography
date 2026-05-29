import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Priority, WishlistItem } from './schema'

interface WishlistState {
  items: WishlistItem[]
  addItem: (input: {
    speciesId: string
    priority: Priority
    targetDate?: string | null
    notes?: string
  }) => WishlistItem
  /** Flip a single readiness checklist item for a wish. */
  toggleReadiness: (id: string, key: string) => void
  updateItem: (
    id: string,
    patch: Partial<Pick<WishlistItem, 'priority' | 'targetDate' | 'notes'>>,
  ) => void
  removeItem: (id: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],

      addItem: ({ speciesId, priority, targetDate = null, notes = '' }) => {
        const item: WishlistItem = {
          id: crypto.randomUUID(),
          speciesId,
          priority,
          targetDate: targetDate ? targetDate.slice(0, 10) : null,
          notes: notes.trim().slice(0, 300),
          readiness: {},
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ items: [item, ...state.items] }))
        return item
      },

      toggleReadiness: (id, key) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, readiness: { ...item.readiness, [key]: !item.readiness[key] } }
              : item,
          ),
        })),

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            return {
              ...item,
              ...('priority' in patch && patch.priority ? { priority: patch.priority } : {}),
              ...('targetDate' in patch
                ? { targetDate: patch.targetDate ? patch.targetDate.slice(0, 10) : null }
                : {}),
              ...('notes' in patch && patch.notes !== undefined
                ? { notes: patch.notes.trim().slice(0, 300) }
                : {}),
            }
          }),
        })),

      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'pettography.wishlist',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
