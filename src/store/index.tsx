import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  email: string
}

export type Theme = 'light' | 'dark'

interface AppState {
  theme: Theme
  user: User | null
  isAuthenticated: boolean
  setTheme: (theme: Theme) => void
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      user: null,
      isAuthenticated: false,
      setTheme: (theme) => set({ theme }),
      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Guard against a corrupted/hand-edited backup: only trust a well-formed user.
        const u: unknown = state.user
        const valid =
          u !== null &&
          typeof u === 'object' &&
          typeof (u as User).id === 'string' &&
          typeof (u as User).name === 'string' &&
          typeof (u as User).email === 'string'
        if (valid) {
          state.isAuthenticated = true
        } else {
          state.user = null
          state.isAuthenticated = false
        }
      },
    },
  ),
)
