import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { MoltEvent, MoltKind } from './schema'

interface MoltState {
  events: MoltEvent[]
  addEvent: (input: {
    petId?: string | null
    speciesId: string | null
    occurredAt: string
    kind: MoltKind
    notes: string
  }) => MoltEvent
  removeEvent: (id: string) => void
  clear: () => void
}

export const useMoltStore = create<MoltState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: ({ petId, speciesId, occurredAt, kind, notes }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const event: MoltEvent = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          occurredAt,
          kind,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          events: [event, ...state.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
        }))
        return event
      },
      removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
      clear: () => set({ events: [] }),
    }),
    {
      name: 'pettography.molt.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Molt events strictly scoped to the active pet or pre-onboarding null slot.
 */
export function useActivePetMolts(): MoltEvent[] {
  const events = useMoltStore((s) => s.events)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return events.filter((event) => !event.petId)
  return events.filter((event) => event.petId === activePetId)
}
