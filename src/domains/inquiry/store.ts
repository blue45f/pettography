import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { StoredInquiryReceipt } from './schema'

const MAX_RECEIPTS = 20

interface InquiryState {
  /** Most-recent-first receipts returned by TermsDesk for this browser. */
  receipts: StoredInquiryReceipt[]
  addReceipt: (receipt: StoredInquiryReceipt) => void
  removeReceipt: (id: string) => void
}

export const useInquiryStore = create<InquiryState>()(
  persist(
    (set) => ({
      receipts: [],
      addReceipt: (receipt) =>
        set((state) => ({
          receipts: [receipt, ...state.receipts.filter((r) => r.id !== receipt.id)].slice(
            0,
            MAX_RECEIPTS,
          ),
        })),
      removeReceipt: (id) =>
        set((state) => ({ receipts: state.receipts.filter((r) => r.id !== id) })),
    }),
    {
      name: 'pettography.inquiry',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
