import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ContactCategory, ContactInquiry, ContactStatus } from './schema'

interface ContactState {
  inquiries: ContactInquiry[]
  submit: (input: {
    category: ContactCategory
    name: string
    email?: string | null
    subject: string
    body: string
  }) => ContactInquiry
  setStatus: (id: string, status: ContactStatus) => void
  remove: (id: string) => void
}

export const useContactStore = create<ContactState>()(
  persist(
    (set) => ({
      inquiries: [],
      submit: (input) => {
        const inquiry: ContactInquiry = {
          id: crypto.randomUUID(),
          category: input.category,
          name: input.name,
          email: input.email?.trim() ? input.email.trim() : null,
          subject: input.subject,
          body: input.body,
          status: 'received',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ inquiries: [inquiry, ...state.inquiries] }))
        return inquiry
      },
      setStatus: (id, status) =>
        set((state) => ({
          inquiries: state.inquiries.map((i) => (i.id === id ? { ...i, status } : i)),
        })),
      remove: (id) => set((state) => ({ inquiries: state.inquiries.filter((i) => i.id !== id) })),
    }),
    {
      name: 'pettography.contact',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
