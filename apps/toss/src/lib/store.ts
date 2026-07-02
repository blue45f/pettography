/**
 * 미니앱 로컬 상태 저장소 — 즐겨찾기·케어 체크리스트·리포트 잠금해제.
 * 토스 익명키(getAnonymousKey)로 localStorage 키를 사용자별로 분리해요.
 * 키 획득 실패 시 'guest' 폴백(무해) — 서버 저장 없음.
 */
import { create } from 'zustand'

import { getStableUserKey } from './toss'

const STORAGE_PREFIX = 'pettography:v1:'
const GUEST_KEY = 'guest'

export interface ChecklistEntry {
  addedAt: number
  /** taskId -> 완료 여부 */
  done: Record<string, boolean>
}

interface PersistedState {
  favorites: string[]
  checklist: Record<string, ChecklistEntry>
  /** 보상형 광고로 오늘의 케어 리포트를 연 날짜(YYYY-MM-DD). */
  reportUnlockedDate: string | null
}

interface AppState extends PersistedState {
  /** null = 익명키 해석 전. 해석 후 hash 또는 'guest'. */
  userKey: string | null
  hydrated: boolean
  hydrate: (userKey: string, persisted: PersistedState | null) => void
  toggleFavorite: (speciesId: string) => void
  addToChecklist: (speciesId: string) => void
  removeFromChecklist: (speciesId: string) => void
  toggleTask: (speciesId: string, taskId: string) => void
  unlockReport: (date: string) => void
}

const EMPTY_PERSISTED: PersistedState = {
  favorites: [],
  checklist: {},
  reportUnlockedDate: null,
}

function readPersisted(userKey: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Partial<PersistedState>
    return {
      favorites: Array.isArray(p.favorites) ? p.favorites.filter((f) => typeof f === 'string') : [],
      checklist:
        p.checklist && typeof p.checklist === 'object'
          ? (p.checklist as Record<string, ChecklistEntry>)
          : {},
      reportUnlockedDate:
        typeof p.reportUnlockedDate === 'string' ? p.reportUnlockedDate : null,
    }
  } catch {
    return null
  }
}

function writePersisted(userKey: string, state: PersistedState): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + userKey,
      JSON.stringify({
        favorites: state.favorites,
        checklist: state.checklist,
        reportUnlockedDate: state.reportUnlockedDate,
      })
    )
  } catch {
    // 저장 불가(프라이빗 모드 등) — 세션 내 메모리 상태로만 동작
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const persist = () => {
    const { userKey, favorites, checklist, reportUnlockedDate } = get()
    if (!userKey) return
    writePersisted(userKey, { favorites, checklist, reportUnlockedDate })
  }

  return {
    ...EMPTY_PERSISTED,
    userKey: null,
    hydrated: false,

    hydrate: (userKey, persisted) =>
      set({ userKey, hydrated: true, ...(persisted ?? EMPTY_PERSISTED) }),

    toggleFavorite: (speciesId) => {
      set((s) => ({
        favorites: s.favorites.includes(speciesId)
          ? s.favorites.filter((id) => id !== speciesId)
          : [...s.favorites, speciesId],
      }))
      persist()
    },

    addToChecklist: (speciesId) => {
      set((s) =>
        s.checklist[speciesId]
          ? s
          : { checklist: { ...s.checklist, [speciesId]: { addedAt: Date.now(), done: {} } } }
      )
      persist()
    },

    removeFromChecklist: (speciesId) => {
      set((s) => {
        const next = { ...s.checklist }
        delete next[speciesId]
        return { checklist: next }
      })
      persist()
    },

    toggleTask: (speciesId, taskId) => {
      set((s) => {
        const entry = s.checklist[speciesId]
        if (!entry) return s
        const done = { ...entry.done, [taskId]: !entry.done[taskId] }
        return { checklist: { ...s.checklist, [speciesId]: { ...entry, done } } }
      })
      persist()
    },

    unlockReport: (date) => {
      set({ reportUnlockedDate: date })
      persist()
    },
  }
})

let initPromise: Promise<void> | null = null

/** 앱 진입 시 1회 — 토스 익명키 해석 후 사용자별 저장 데이터를 복원해요(StrictMode 안전). */
export function initAppStore(): Promise<void> {
  initPromise ??= (async () => {
    const key = (await getStableUserKey()) ?? GUEST_KEY
    useAppStore.getState().hydrate(key, readPersisted(key))
  })()
  return initPromise
}
