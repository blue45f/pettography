import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { PartnerApplication, PartnerKind, PartnerStatus } from './schema'

interface PartnersState {
  applications: PartnerApplication[]
  apply: (input: {
    kind: PartnerKind
    name: string
    contact: string
    region: string
    description: string
    url?: string | null
  }) => PartnerApplication
  setStatus: (id: string, status: PartnerStatus) => void
  remove: (id: string) => void
}

export const usePartnersStore = create<PartnersState>()(
  persist(
    (set) => ({
      applications: [
        {
          id: 'seed-partner-1',
          kind: 'hospital',
          name: '강서특수동물병원',
          contact: '02-2664-7700',
          region: '서울 강서구',
          description:
            '파충류·조류 전문 진료 5년 경력. 24시간 응급 대응 가능. 입점 후 야간 응급 콜 가능.',
          url: 'https://kangseo-exotic.kr',
          status: 'pending',
          createdAt: '2026-05-25T10:00:00.000Z',
        },
        {
          id: 'seed-partner-2',
          kind: 'treat-shop',
          name: '귀뚜라미연구소',
          contact: 'sales@cricketlab.kr',
          region: '경기 화성',
          description: '귀뚜라미·둠비아 정기 배송. 영양 표시 인증 제품만 출고합니다.',
          url: 'https://cricketlab.kr',
          status: 'approved',
          createdAt: '2026-05-18T16:00:00.000Z',
        },
      ],
      apply: (input) => {
        const app: PartnerApplication = {
          id: crypto.randomUUID(),
          ...input,
          url: input.url ?? null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ applications: [app, ...state.applications] }))
        return app
      },
      setStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      remove: (id) =>
        set((state) => ({ applications: state.applications.filter((a) => a.id !== id) })),
    }),
    {
      name: 'pettography.partners',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
