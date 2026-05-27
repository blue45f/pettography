import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { DiaryCategory, DiaryEntry } from './schema'

interface DiaryState {
  entries: DiaryEntry[]
  addEntry: (input: {
    speciesId: string | null
    category: DiaryCategory
    occurredAt: string
    body: string
    weightGram?: number | null
  }) => DiaryEntry
  removeEntry: (id: string) => void
  clear: () => void
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({ speciesId, category, occurredAt, body, weightGram = null }) => {
        const entry: DiaryEntry = {
          id: crypto.randomUUID(),
          speciesId,
          category,
          occurredAt,
          body,
          weightGram: weightGram ?? null,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          entries: [entry, ...state.entries].sort((a, b) =>
            b.occurredAt.localeCompare(a.occurredAt)
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
    }
  )
)

export function diaryStats(entries: DiaryEntry[]) {
  const byCategory = new Map<DiaryCategory, number>()
  for (const entry of entries) {
    byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + 1)
  }
  const recent30Cutoff = new Date()
  recent30Cutoff.setDate(recent30Cutoff.getDate() - 30)
  const recent30 = entries.filter((e) => new Date(e.occurredAt) >= recent30Cutoff).length
  const latestWeight = entries.find((e) => e.weightGram !== null)
  return {
    total: entries.length,
    byCategory,
    recent30,
    latestWeight: latestWeight?.weightGram ?? null,
  }
}
