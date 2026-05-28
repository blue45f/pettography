import { z } from 'zod'

export const supplyKindSchema = z.enum([
  'live-food',
  'dry-food',
  'supplement',
  'substrate',
  'equipment',
])
export type SupplyKind = z.infer<typeof supplyKindSchema>

export const SUPPLY_KINDS: readonly SupplyKind[] = [
  'live-food',
  'dry-food',
  'supplement',
  'substrate',
  'equipment',
] as const

export const supplyItemSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  name: z.string().min(1).max(60),
  kind: supplyKindSchema,
  unit: z.string().min(1).max(20),
  lastRestockedAt: z.string(),
  lastQuantity: z.number().int().positive(),
  weeklyConsumption: z.number().positive(),
  preferredVendor: z.string().max(60).optional(),
})
export type SupplyItem = z.infer<typeof supplyItemSchema>

export const supplyFormSchema = z.object({
  name: z.string().trim().min(1, 'supplies.errors.nameRequired').max(60, 'supplies.errors.nameMax'),
  kind: supplyKindSchema,
  unit: z.string().trim().min(1, 'supplies.errors.unitRequired').max(20, 'supplies.errors.unitMax'),
  lastRestockedAt: z.string().min(1, 'supplies.errors.dateRequired'),
  lastQuantity: z
    .number({ message: 'supplies.errors.qtyNumber' })
    .int()
    .positive('supplies.errors.qtyPositive'),
  weeklyConsumption: z
    .number({ message: 'supplies.errors.consumptionNumber' })
    .positive('supplies.errors.consumptionPositive'),
  preferredVendor: z.string().trim().max(60, 'supplies.errors.vendorMax').optional(),
})
export type SupplyFormValues = z.infer<typeof supplyFormSchema>
