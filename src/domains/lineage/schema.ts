import { z } from 'zod'

/** Biological sex of an individual animal in the pedigree registry. */
export const sexSchema = z.enum(['male', 'female', 'unknown'])
export type Sex = z.infer<typeof sexSchema>

export const SEXES: readonly Sex[] = ['male', 'female', 'unknown'] as const

/**
 * A single individual animal in the keeper-level lineage registry. This is a
 * GLOBAL registry (no petId) — breeders track named individuals and their
 * parentage across the whole collection, independent of the active pet.
 *
 * `sireId` (father) and `damId` (mother) point at other `LineageAnimal.id`s,
 * or `null` when the parent is unknown / not in the registry.
 */
export const lineageAnimalSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  speciesId: z.string().nullable(),
  sex: sexSchema,
  morph: z.string().max(60),
  sireId: z.string().nullable(),
  damId: z.string().nullable(),
  notes: z.string().max(300),
  createdAt: z.string(),
})
export type LineageAnimal = z.infer<typeof lineageAnimalSchema>

/**
 * Animal creation form. Error messages are i18n keys resolved in the page.
 * Fields are required (with RHF defaults) to avoid zodResolver friction; the
 * empty-string `''` sentinel for the optional selects/text maps to `null`/`''`
 * when persisted by the store.
 */
export const lineageFormSchema = z.object({
  name: z.string().trim().min(1, 'lineage.errors.nameRequired').max(60, 'lineage.errors.nameMax'),
  speciesId: z.string(),
  sex: sexSchema,
  morph: z.string().trim().max(60, 'lineage.errors.morphMax'),
  sireId: z.string(),
  damId: z.string(),
  notes: z.string().trim().max(300, 'lineage.errors.notesMax'),
})
export type LineageFormValues = z.infer<typeof lineageFormSchema>
