import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { DiaryCategory, DiaryEntry } from './schema'

interface DiaryState {
  entries: DiaryEntry[]
  addEntry: (input: {
    petId?: string | null
    speciesId: string | null
    category: DiaryCategory
    occurredAt: string
    body: string
    weightGram?: number | null
    imageUrl?: string | null
  }) => DiaryEntry
  removeEntry: (id: string) => void
  clear: () => void
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({
        petId,
        speciesId,
        category,
        occurredAt,
        body,
        weightGram = null,
        imageUrl = null,
      }) => {
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const entry: DiaryEntry = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
          speciesId,
          category,
          occurredAt,
          body,
          weightGram: weightGram ?? null,
          imageUrl: imageUrl ?? null,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          entries: [entry, ...state.entries].sort((a, b) =>
            b.occurredAt.localeCompare(a.occurredAt),
          ),
        }))
        return entry
      },
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pettography.diary',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Returns diary entries scoped to the currently active pet.
 * Legacy entries with no petId fall through to the active pet so
 * existing v1 data keeps showing up after the multi-pet migration.
 */
export function useActivePetDiary(): DiaryEntry[] {
  const entries = useDiaryStore((s) => s.entries)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return entries
  return entries.filter((e) => !e.petId || e.petId === activePetId)
}

export function diaryStats(entries: DiaryEntry[]) {
  const byCategory = new Map<DiaryCategory, number>()
  for (const entry of entries) {
    byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + 1)
  }
  const recent30Cutoff = new Date()
  recent30Cutoff.setUTCDate(recent30Cutoff.getUTCDate() - 30)
  const recent30CutoffIso = recent30Cutoff.toISOString().slice(0, 10)
  const recent30 = entries.filter((e) => e.occurredAt >= recent30CutoffIso).length
  const latestWeight = entries.find((e) => e.weightGram !== null)
  return {
    total: entries.length,
    byCategory,
    recent30,
    latestWeight: latestWeight?.weightGram ?? null,
  }
}
