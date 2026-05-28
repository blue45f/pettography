import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AdminState {
  isAdmin: boolean
  enableAdmin: () => void
  disableAdmin: () => void
  toggleAdmin: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdmin: false,
      enableAdmin: () => set({ isAdmin: true }),
      disableAdmin: () => set({ isAdmin: false }),
      toggleAdmin: () => set((state) => ({ isAdmin: !state.isAdmin })),
    }),
    {
      name: 'pettography.admin',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
