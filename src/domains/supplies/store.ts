import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { SupplyItem, SupplyKind } from './schema'

interface SuppliesState {
  items: SupplyItem[]
  addItem: (input: {
    petId?: string | null
    name: string
    kind: SupplyKind
    unit: string
    lastRestockedAt: string
    lastQuantity: number
    weeklyConsumption: number
    preferredVendor?: string
  }) => SupplyItem
  restock: (id: string, restockedAt: string, addedQuantity: number) => void
  removeItem: (id: string) => void
}

export const useSuppliesStore = create<SuppliesState>()(
  persist(
    (set) => ({
      items: [],
      addItem: ({
        petId,
        name,
        kind,
        unit,
        lastRestockedAt,
        lastQuantity,
        weeklyConsumption,
        preferredVendor,
      }) => {
        const resolvedPetId =
          petId === undefined ? (useOnboardingStore.getState().activePetId ?? null) : petId
        const item: SupplyItem = {
          id: crypto.randomUUID(),
          petId: resolvedPetId,
          name,
          kind,
          unit,
          lastRestockedAt,
          lastQuantity,
          weeklyConsumption,
          preferredVendor,
        }
        set((state) => ({ items: [item, ...state.items] }))
        return item
      },
      restock: (id, restockedAt, addedQuantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            const daysSince = daysBetween(new Date(item.lastRestockedAt), new Date(restockedAt))
            const remaining = Math.max(
              0,
              item.lastQuantity - (daysSince / 7) * item.weeklyConsumption,
            )
            return {
              ...item,
              lastRestockedAt: restockedAt,
              lastQuantity: Math.round(remaining + addedQuantity),
            }
          }),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
    }),
    {
      name: 'pettography.supplies',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 86_400_000)
}

export interface SupplyStatus {
  remaining: number
  daysLeft: number
  level: 'ok' | 'warning' | 'critical' | 'depleted'
}

export function useActivePetSupplies(): SupplyItem[] {
  const items = useSuppliesStore((s) => s.items)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return items
  return items.filter((i) => !i.petId || i.petId === activePetId)
}

export function supplyStatus(item: SupplyItem, refDate: Date = new Date()): SupplyStatus {
  const daysSince = daysBetween(new Date(item.lastRestockedAt), refDate)
  const consumedSince = (daysSince / 7) * item.weeklyConsumption
  const remaining = Math.max(0, item.lastQuantity - consumedSince)
  const daysLeft =
    item.weeklyConsumption > 0 ? Math.round((remaining / item.weeklyConsumption) * 7) : 999
  const level: SupplyStatus['level'] =
    remaining <= 0 ? 'depleted' : daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'ok'
  return { remaining: Math.round(remaining * 10) / 10, daysLeft, level }
}
