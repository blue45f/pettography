import { z } from 'zod'

/**
 * User-set clutch status. The engine *derives* the transient `due` / `overdue`
 * states from an `incubating` clutch's laid date + the incubation reference
 * window — those are never stored, only `incubating | hatched | failed` are.
 */
export const clutchStatusSchema = z.enum(['incubating', 'hatched', 'failed'])
export type ClutchStatus = z.infer<typeof clutchStatusSchema>

export const CLUTCH_STATUSES: readonly ClutchStatus[] = ['incubating', 'hatched', 'failed'] as const

/** A breeding pairing (sire × dam) the keeper is tracking. */
export const pairingSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  sireName: z.string().max(40),
  damName: z.string().max(40),
  pairedAt: z.string(),
  notes: z.string().max(300),
  createdAt: z.string(),
})
export type Pairing = z.infer<typeof pairingSchema>

/** A laid egg clutch with optional incubation telemetry. */
export const clutchSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  pairingId: z.string().nullable(),
  speciesId: z.string().nullable(),
  laidAt: z.string(),
  eggCount: z.number().int().min(1),
  fertileCount: z.number().int().min(0).nullable(),
  incubationTempC: z.number().nullable(),
  status: clutchStatusSchema,
  notes: z.string().max(300),
  createdAt: z.string(),
})
export type Clutch = z.infer<typeof clutchSchema>

/** Pairing creation form — error messages are i18n keys resolved in the page. */
export const pairingFormSchema = z.object({
  sireName: z.string().trim().max(40, 'breeding.errors.nameMax').optional(),
  damName: z.string().trim().max(40, 'breeding.errors.nameMax').optional(),
  pairedAt: z.string().min(1, 'breeding.errors.dateRequired'),
  notes: z.string().trim().max(300, 'breeding.errors.notesMax').optional(),
})
export type PairingFormValues = z.infer<typeof pairingFormSchema>

/** Clutch creation form — error messages are i18n keys resolved in the page. */
export const clutchFormSchema = z.object({
  pairingId: z.string().optional(),
  laidAt: z.string().min(1, 'breeding.errors.dateRequired'),
  eggCount: z
    .number({ message: 'breeding.errors.eggCountNumber' })
    .int('breeding.errors.eggCountNumber')
    .min(1, 'breeding.errors.eggCountMin'),
  fertileCount: z
    .number({ message: 'breeding.errors.fertileNumber' })
    .int('breeding.errors.fertileNumber')
    .min(0, 'breeding.errors.fertileMin')
    .nullable()
    .optional(),
  incubationTempC: z.number({ message: 'breeding.errors.tempNumber' }).nullable().optional(),
  notes: z.string().trim().max(300, 'breeding.errors.notesMax').optional(),
})
export type ClutchFormValues = z.infer<typeof clutchFormSchema>
