import { z } from 'zod'

/**
 * Water parameters tracked for the freshwater nitrogen cycle.
 * Stable enum used by the engine and the page chips.
 */
export const waterParamSchema = z.enum(['tempC', 'ph', 'ammoniaPpm', 'nitritePpm', 'nitratePpm'])
export type WaterParam = z.infer<typeof waterParamSchema>

export const WATER_PARAMS: readonly WaterParam[] = [
  'tempC',
  'ph',
  'ammoniaPpm',
  'nitritePpm',
  'nitratePpm',
] as const

/** Cycle status codes; the page maps each to a t('water.status.*') string. */
export const cycleStatusSchema = z.enum(['cycling', 'cycled', 'toxic', 'unknown'])
export type CycleStatus = z.infer<typeof cycleStatusSchema>

/** Per-parameter severity codes; the page maps each to a t('water.flags.*') string. */
export const paramFlagSchema = z.enum(['ok', 'warn', 'danger'])
export type ParamFlag = z.infer<typeof paramFlagSchema>

export const waterReadingSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  measuredAt: z.string(),
  tempC: z.number().nullable(),
  ph: z.number().nullable(),
  ammoniaPpm: z.number().nullable(),
  nitritePpm: z.number().nullable(),
  nitratePpm: z.number().nullable(),
  note: z.string().max(200),
  createdAt: z.string(),
})

export type WaterReading = z.infer<typeof waterReadingSchema>

/**
 * Form schema. Numeric params are plain nullable numbers — the page coerces
 * blank inputs to null via `setValueAs` (mirrors the Diary weight field), so a
 * left-empty field reads as "not measured" rather than NaN. All params are
 * optional, but `superRefine` requires at least one to be present.
 */
const optionalNumber = (max: number) =>
  z
    .number({ message: 'water.errors.number' })
    .min(0, 'water.errors.nonNegative')
    .max(max, 'water.errors.tooHigh')
    .nullable()

export const waterFormSchema = z
  .object({
    measuredAt: z.string().min(1, 'water.errors.dateRequired'),
    tempC: optionalNumber(60),
    ph: z
      .number({ message: 'water.errors.number' })
      .min(0, 'water.errors.phRange')
      .max(14, 'water.errors.phRange')
      .nullable(),
    ammoniaPpm: optionalNumber(100),
    nitritePpm: optionalNumber(100),
    nitratePpm: optionalNumber(500),
    note: z.string().trim().max(200, 'water.errors.noteMax').optional(),
  })
  .superRefine((values, ctx) => {
    const hasAny =
      values.tempC !== null ||
      values.ph !== null ||
      values.ammoniaPpm !== null ||
      values.nitritePpm !== null ||
      values.nitratePpm !== null
    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'water.errors.atLeastOne',
        path: ['ammoniaPpm'],
      })
    }
  })

export type WaterFormValues = z.infer<typeof waterFormSchema>
