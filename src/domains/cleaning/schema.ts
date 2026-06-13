import { z } from 'zod'

export const cleanTypeSchema = z.enum(['spot', 'full', 'substrate', 'water'])
export type CleanType = z.infer<typeof cleanTypeSchema>

export const CLEAN_TYPES: readonly CleanType[] = ['spot', 'full', 'substrate', 'water'] as const

export const cleaningLogSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  type: cleanTypeSchema,
  cleanedAt: z.string(),
  note: z.string().max(200),
  createdAt: z.string(),
})

export type CleaningLog = z.infer<typeof cleaningLogSchema>

export const cleaningFormSchema = z.object({
  type: cleanTypeSchema,
  cleanedAt: z.string().min(1, 'cleaning.errors.dateRequired'),
  note: z.string().trim().max(200, 'cleaning.errors.noteMax'),
})

export type CleaningFormValues = z.infer<typeof cleaningFormSchema>
