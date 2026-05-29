import { z } from 'zod'

/**
 * Why the keeper is moving the animal. Drives the suggested checklist tone and
 * which extra reminders surface (e.g. paperwork for an expo/transfer). Every
 * value maps to an i18n string under `transport.purposes.<id>`.
 */
export const purposeSchema = z.enum(['vet', 'move', 'expo', 'other'])
export type Purpose = z.infer<typeof purposeSchema>

export const PURPOSES: readonly Purpose[] = ['vet', 'move', 'expo', 'other'] as const

/**
 * A single planned trip for the active pet. `checklist` maps a
 * `TRANSPORT_CHECKLIST` item id to whether the keeper has prepared it; unknown
 * keys are ignored by the progress engine so the catalog can evolve safely.
 *
 * `petId` follows the diary convention — `null`/missing means "applies to the
 * active pet" so legacy rows keep showing up after the multi-pet migration.
 */
export const tripSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  purpose: purposeSchema,
  /** Day-precision travel date, YYYY-MM-DD. */
  date: z.string(),
  /** Estimated time in transit; null when the keeper leaves it blank. */
  durationHours: z.number().nonnegative().nullable(),
  notes: z.string().max(300),
  checklist: z.record(z.string(), z.boolean()),
  createdAt: z.string(),
})

export type Trip = z.infer<typeof tripSchema>

/**
 * Create-trip form. Fields are required (RHF supplies the defaults) so the
 * zodResolver stays friction-free; `durationHours` stays nullable because an
 * empty estimate is legitimate. Error messages are i18n keys under
 * `transport.errors.*` resolved by the page.
 */
export const tripFormSchema = z.object({
  purpose: purposeSchema,
  date: z.string().min(1, 'transport.errors.dateRequired'),
  durationHours: z
    .number({ message: 'transport.errors.durationNumber' })
    .nonnegative('transport.errors.durationRange')
    .max(240, 'transport.errors.durationRange')
    .nullable(),
  notes: z.string().trim().max(300, 'transport.errors.notesMax'),
})

export type TripFormValues = z.infer<typeof tripFormSchema>
