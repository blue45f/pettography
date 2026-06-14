import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { KitContact } from './schema'

interface KitStoreState {
  /** Checklist item id → ready? */
  checked: Record<string, boolean>
  contacts: KitContact[]
  toggleItem: (id: string) => void
  addContact: (input: { label: string; phone: string; note: string }) => KitContact
  removeContact: (id: string) => void
  clear: () => void
}

export const useKitStore = create<KitStoreState>()(
  persist(
    (set) => ({
      checked: {},
      contacts: [],
      toggleItem: (id) =>
        set((state) => ({
          checked: { ...state.checked, [id]: !state.checked[id] },
        })),
      addContact: ({ label, phone, note }) => {
        const contact: KitContact = {
          id: crypto.randomUUID(),
          label: label.trim(),
          phone: phone.trim(),
          note: note.trim(),
        }
        set((state) => ({ contacts: [contact, ...state.contacts] }))
        return contact
      },
      removeContact: (id) =>
        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) })),
      clear: () => set({ checked: {}, contacts: [] }),
    }),
    {
      name: 'pettography.kit',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
