import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { RoutineCadence, RoutineTask } from './schema'

interface RoutineState {
  customTasks: RoutineTask[]
  completions: Record<string, string>
  addTask: (input: { petId?: string | null; label: string; cadence: RoutineCadence }) => RoutineTask
  removeTask: (id: string) => void
  markDone: (id: string) => void
  unmark: (id: string) => void
  resetAll: () => void
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set) => ({
      customTasks: [],
      completions: {},
      addTask: ({ petId, label, cadence }) => {
        const resolvedPetId =
          petId === undefined ? (useOnboardingStore.getState().activePetId ?? null) : petId
        const task: RoutineTask = {
          id: `custom-${crypto.randomUUID()}`,
          petId: resolvedPetId,
          label,
          cadence,
          builtIn: false,
        }
        set((state) => ({ customTasks: [task, ...state.customTasks] }))
        return task
      },
      removeTask: (id) =>
        set((state) => ({
          customTasks: state.customTasks.filter((t) => t.id !== id),
          completions: Object.fromEntries(
            Object.entries(state.completions).filter(([k]) => k !== id),
          ),
        })),
      markDone: (id) =>
        set((state) => ({
          completions: { ...state.completions, [id]: new Date().toISOString() },
        })),
      unmark: (id) =>
        set((state) => {
          const next = { ...state.completions }
          delete next[id]
          return { completions: next }
        }),
      resetAll: () => set({ completions: {} }),
    }),
    {
      name: 'pettography.routine',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function useActivePetCustomTasks(): RoutineTask[] {
  const tasks = useRoutineStore((s) => s.customTasks)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return tasks
  return tasks.filter((t) => !t.petId || t.petId === activePetId)
}

export function isDoneWithinWindow(
  completedAt: string | undefined,
  cadence: RoutineCadence,
  now: Date = new Date(),
): boolean {
  if (!completedAt) return false
  const done = new Date(completedAt).getTime()
  const elapsedMs = now.getTime() - done
  const windowMs =
    cadence === 'daily'
      ? 24 * 3600 * 1000
      : cadence === 'weekly'
        ? 7 * 24 * 3600 * 1000
        : 30 * 24 * 3600 * 1000
  return elapsedMs < windowMs
}
