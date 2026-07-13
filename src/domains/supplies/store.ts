import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { SupplyItem, SupplyKind } from './schema'

interface SuppliesState {
  items: SupplyItem[]
  addItem: (input: {
    petId?: string
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
        const resolvedPetId = petId ?? useOnboardingStore.getState().activePetId
        if (!resolvedPetId) throw new Error('An active pet is required to add a supply item.')
        const item: SupplyItem = {
          id: crypto.randomUUID(),
          petId: resolvedPetId,
          name: name.trim().slice(0, 60),
          kind,
          unit: unit.trim().slice(0, 20),
          lastRestockedAt: lastRestockedAt.slice(0, 10),
          lastQuantity,
          weeklyConsumption,
          preferredVendor: preferredVendor?.trim().slice(0, 60),
        }
        set((state) => ({ items: [item, ...state.items] }))
        return item
      },
      restock: (id, restockedAt, addedQuantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            const daysSince = daysBetween(
              parseLocalDate(item.lastRestockedAt),
              parseLocalDate(restockedAt)
            )
            const remaining = Math.max(
              0,
              item.lastQuantity - (daysSince / 7) * item.weeklyConsumption
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
      name: 'pettography.supplies.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

function daysBetween(a: Date, b: Date): number {
  const aDay = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const bDay = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.max(0, Math.round((bDay - aDay) / 86_400_000))
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export interface SupplyStatus {
  remaining: number
  daysLeft: number
  level: 'ok' | 'warning' | 'critical' | 'depleted'
}

export function useActivePetSupplies(): SupplyItem[] {
  const items = useSuppliesStore((s) => s.items)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return []
  return items.filter((i) => i.petId === activePetId)
}

export function supplyStatus(item: SupplyItem, refDate: Date = new Date()): SupplyStatus {
  const daysSince = daysBetween(parseLocalDate(item.lastRestockedAt), refDate)
  const consumedSince = (daysSince / 7) * item.weeklyConsumption
  const remaining = Math.max(0, item.lastQuantity - consumedSince)
  const daysLeft =
    item.weeklyConsumption > 0 ? Math.round((remaining / item.weeklyConsumption) * 7) : 999
  const level: SupplyStatus['level'] =
    remaining <= 0 ? 'depleted' : daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'ok'
  return { remaining: Math.round(remaining * 10) / 10, daysLeft, level }
}
