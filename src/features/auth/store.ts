import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthSession, PublicAccount } from './schema'

interface AuthState {
  token: string | null
  account: PublicAccount | null
  isAuthenticated: boolean
  isAdmin: boolean
  setSession: (session: AuthSession) => void
  setAccount: (account: PublicAccount | null) => void
  clearSession: () => void
}

function deriveAuth(account: PublicAccount | null, token: string | null) {
  return {
    isAuthenticated: Boolean(account && token && account.status === 'active'),
    isAdmin:
      account?.status === 'active' && (account.role === 'admin' || account.role === 'moderator'),
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      account: null,
      isAuthenticated: false,
      isAdmin: false,
      setSession: (session) =>
        set({
          token: session.token,
          account: session.account,
          ...deriveAuth(session.account, session.token),
        }),
      setAccount: (account) =>
        set((state) => ({
          account,
          ...deriveAuth(account, state.token),
        })),
      clearSession: () =>
        set({
          token: null,
          account: null,
          isAuthenticated: false,
          isAdmin: false,
        }),
    }),
    {
      name: 'pettography.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, account: state.account }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const derived = deriveAuth(state.account, state.token)
        state.isAuthenticated = derived.isAuthenticated
        state.isAdmin = derived.isAdmin
      },
    },
  ),
)
