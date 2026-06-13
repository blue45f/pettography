import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { BrumationPlan, PhaseDays } from './schema'

interface BrumationState {
  plans: BrumationPlan[]
  addPlan: (input: {
    petId?: string | null
    speciesId: string | null
    startDate: string
    phaseDays: PhaseDays
    targetTempC?: number | null
    notes?: string
  }) => BrumationPlan
  updatePhaseDays: (id: string, phaseDays: PhaseDays) => void
  removePlan: (id: string) => void
  clear: () => void
}

export const useBrumationStore = create<BrumationState>()(
  persist(
    (set) => ({
      plans: [],
      addPlan: ({ petId, speciesId, startDate, phaseDays, targetTempC = null, notes = '' }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const plan: BrumationPlan = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          startDate,
          phaseDays,
          targetTempC: targetTempC ?? null,
          notes,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          plans: [plan, ...state.plans].sort((a, b) => b.startDate.localeCompare(a.startDate)),
        }))
        return plan
      },
      updatePhaseDays: (id, phaseDays) =>
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, phaseDays } : p)),
        })),
      removePlan: (id) => set((state) => ({ plans: state.plans.filter((p) => p.id !== id) })),
      clear: () => set({ plans: [] }),
    }),
    {
      name: 'pettography.brumation',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Brumation plans scoped to the currently active pet. Legacy / unscoped plans
 * (no petId) fall through so existing data stays visible after the multi-pet
 * migration.
 */
export function useActivePetPlans(): BrumationPlan[] {
  const plans = useBrumationStore((s) => s.plans)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return plans
  return plans.filter((p) => !p.petId || p.petId === activePetId)
}
