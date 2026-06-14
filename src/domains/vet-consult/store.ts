import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { VetConsultRole, VetMessage } from './schema'

interface ConsultState {
  activeVetId: string | null
  messages: Record<string, VetMessage[]>
  setActiveVet: (vetId: string | null) => void
  addMessage: (vetId: string, role: VetConsultRole, body: string) => VetMessage
  clear: (vetId?: string) => void
}

export const useConsultStore = create<ConsultState>()(
  persist(
    (set) => ({
      activeVetId: null,
      messages: {},
      setActiveVet: (vetId) => set({ activeVetId: vetId }),
      addMessage: (vetId, role, body) => {
        const message: VetMessage = {
          id: crypto.randomUUID(),
          vetId,
          role,
          body,
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const next = { ...state.messages }
          next[vetId] = [...(next[vetId] ?? []), message]
          return { messages: next }
        })
        return message
      },
      clear: (vetId) =>
        set((state) => {
          if (!vetId) return { messages: {} }
          const next = { ...state.messages }
          delete next[vetId]
          return { messages: next }
        }),
    }),
    {
      name: 'pettography.consult',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
