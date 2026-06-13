import { z } from 'zod'

/**
 * Gear types tracked by the lifecycle tracker. The most safety-critical one is
 * `uvbBulb`: UV output dies months before the visible light does, so it must be
 * replaced on schedule even while it still appears to work.
 */
export const gearTypeSchema = z.enum([
  'uvbBulb',
  'heatBulb',
  'thermostat',
  'filter',
  'filterMedia',
  'substrate',
  'other',
])
export type GearType = z.infer<typeof gearTypeSchema>

export const GEAR_TYPE_IDS: readonly GearType[] = [
  'uvbBulb',
  'heatBulb',
  'thermostat',
  'filter',
  'filterMedia',
  'substrate',
  'other',
] as const

export const gearItemSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  typeId: gearTypeSchema,
  name: z.string().max(60),
  installedAt: z.string(),
  intervalMonths: z.number().int().min(0),
  notes: z.string().max(200),
  createdAt: z.string(),
})

export type GearItem = z.infer<typeof gearItemSchema>

export const gearFormSchema = z.object({
  typeId: gearTypeSchema,
  name: z.string().trim().min(1, 'gear.errors.nameRequired').max(60, 'gear.errors.nameMax'),
  installedAt: z.string().min(1, 'gear.errors.dateRequired'),
  intervalMonths: z
    .number({ message: 'gear.errors.intervalNumber' })
    .int('gear.errors.intervalInt')
    .min(0, 'gear.errors.intervalMin')
    .max(120, 'gear.errors.intervalMax'),
  notes: z.string().trim().max(200, 'gear.errors.notesMax').optional(),
})

export type GearFormValues = z.infer<typeof gearFormSchema>
