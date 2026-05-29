import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { QUARANTINE_DEFAULT_DURATION } from './schema'

import type { DoseRecord, Medication, Quarantine, QuarantineReason } from './schema'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface MedsState {
  medications: Medication[]
  quarantines: Quarantine[]

  addMedication: (input: {
    petId?: string | null
    name: string
    reason?: string
    dosage?: string
    startedAt: string
    frequencyDays: number
    durationDays?: number | null
    notes?: string
  }) => Medication
  removeMedication: (id: string) => void
  /** Record or toggle a dose for a specific day-date. */
  markDose: (medId: string, dateISO: string, given: boolean) => void
  /** End an open-ended course today by pinning its duration to the elapsed days. */
  endMedication: (id: string) => void

  addQuarantine: (input: {
    petId?: string | null
    animalName: string
    startedAt: string
    durationDays?: number
    reasonCode: QuarantineReason
    notes?: string
  }) => Quarantine
  clearQuarantine: (id: string) => void
  removeQuarantine: (id: string) => void

  clear: () => void
}

function upsertDose(doses: DoseRecord[], dateISO: string, given: boolean): DoseRecord[] {
  const day = dateISO.slice(0, 10)
  const existing = doses.find((d) => d.date === day)
  if (!existing) {
    if (!given) return doses
    return [...doses, { date: day, given: true }].sort((a, b) => a.date.localeCompare(b.date))
  }
  return doses.map((d) => (d.date === day ? { ...d, given } : d))
}

export const useMedsStore = create<MedsState>()(
  persist(
    (set) => ({
      medications: [],
      quarantines: [],

      addMedication: ({
        petId,
        name,
        reason = '',
        dosage = '',
        startedAt,
        frequencyDays,
        durationDays = null,
        notes = '',
      }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const med: Medication = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          name,
          reason,
          dosage,
          startedAt,
          frequencyDays,
          durationDays: durationDays ?? null,
          notes,
          doses: [],
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          medications: [med, ...state.medications].sort((a, b) =>
            b.startedAt.localeCompare(a.startedAt),
          ),
        }))
        return med
      },

      removeMedication: (id) =>
        set((state) => ({ medications: state.medications.filter((m) => m.id !== id) })),

      markDose: (medId, dateISO, given) =>
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === medId ? { ...m, doses: upsertDose(m.doses, dateISO, given) } : m,
          ),
        })),

      endMedication: (id) =>
        set((state) => ({
          medications: state.medications.map((m) => {
            if (m.id !== id) return m
            const start = new Date(`${m.startedAt}T00:00:00Z`).getTime()
            const now = new Date(`${today()}T00:00:00Z`).getTime()
            const elapsed = Math.floor((now - start) / 86_400_000) + 1
            return { ...m, durationDays: Math.max(1, elapsed) }
          }),
        })),

      addQuarantine: ({
        petId,
        animalName,
        startedAt,
        durationDays = QUARANTINE_DEFAULT_DURATION,
        reasonCode,
        notes = '',
      }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const quarantine: Quarantine = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          animalName,
          startedAt,
          durationDays,
          reasonCode,
          clearedAt: null,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          quarantines: [quarantine, ...state.quarantines].sort((a, b) =>
            b.startedAt.localeCompare(a.startedAt),
          ),
        }))
        return quarantine
      },

      clearQuarantine: (id) =>
        set((state) => ({
          quarantines: state.quarantines.map((q) =>
            q.id === id ? { ...q, clearedAt: q.clearedAt ?? today() } : q,
          ),
        })),

      removeQuarantine: (id) =>
        set((state) => ({ quarantines: state.quarantines.filter((q) => q.id !== id) })),

      clear: () => set({ medications: [], quarantines: [] }),
    }),
    {
      name: 'pettography.meds',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Medications scoped to the active pet. Legacy entries with no petId fall
 * through so existing data keeps showing after the multi-pet migration.
 */
export function useActivePetMeds(): Medication[] {
  const items = useMedsStore((s) => s.medications)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((e) => !e.petId || e.petId === activePetId)
}

/** Quarantines scoped to the active pet, with the same legacy fall-through. */
export function useActivePetQuarantines(): Quarantine[] {
  const items = useMedsStore((s) => s.quarantines)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((e) => !e.petId || e.petId === activePetId)
}
