import { useOnboardingStore } from '@domains/onboarding'
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

const COMPLETION_SEPARATOR = '::'

export function routineCompletionKey(taskId: string, petId: string | null): string {
  return `${petId ?? 'unassigned'}${COMPLETION_SEPARATOR}${taskId}`
}

export function routineCompletionsForPet(
  completions: Record<string, string>,
  petId: string | null
): Record<string, string> {
  const prefix = `${petId ?? 'unassigned'}${COMPLETION_SEPARATOR}`
  return Object.fromEntries(Object.entries(completions).filter(([key]) => key.startsWith(prefix)))
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
            Object.entries(state.completions).filter(
              ([key]) => !key.endsWith(`${COMPLETION_SEPARATOR}${id}`)
            )
          ),
        })),
      markDone: (id) =>
        set((state) => {
          const key = routineCompletionKey(id, useOnboardingStore.getState().activePetId)
          return { completions: { ...state.completions, [key]: new Date().toISOString() } }
        }),
      unmark: (id) =>
        set((state) => {
          const key = routineCompletionKey(id, useOnboardingStore.getState().activePetId)
          const next = { ...state.completions }
          delete next[key]
          return { completions: next }
        }),
      resetAll: () => set({ completions: {} }),
    }),
    {
      name: 'pettography.routine.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
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
  now: Date = new Date()
): boolean {
  if (!completedAt) return false
  const done = new Date(completedAt)
  if (!Number.isFinite(done.getTime()) || done.getTime() > now.getTime()) return false

  if (cadence === 'daily') {
    return (
      done.getFullYear() === now.getFullYear() &&
      done.getMonth() === now.getMonth() &&
      done.getDate() === now.getDate()
    )
  }

  if (cadence === 'weekly') {
    const startOfWeek = new Date(now)
    startOfWeek.setHours(0, 0, 0, 0)
    const daysSinceMonday = (startOfWeek.getDay() + 6) % 7
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday)
    return done.getTime() >= startOfWeek.getTime()
  }

  return done.getFullYear() === now.getFullYear() && done.getMonth() === now.getMonth()
}
