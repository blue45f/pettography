import { z } from 'zod'

/**
 * Persisted record of the keeper's most recently entered enclosure
 * dimensions for a given pet. Dimensions are stored in centimetres and
 * may be null while the keeper has not yet filled the field in.
 */
export const enclosureCheckSchema = z.object({
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  lengthCm: z.number().positive().nullable(),
  widthCm: z.number().positive().nullable(),
  heightCm: z.number().positive().nullable(),
  updatedAt: z.string(),
})

export type EnclosureCheck = z.infer<typeof enclosureCheckSchema>

/**
 * Form schema for the current-enclosure inputs. Fields are required so the
 * zodResolver and react-hook-form stay in sync; the page supplies RHF
 * defaults and coerces empty inputs to a sentinel before validating.
 */
export const enclosureFormSchema = z.object({
  lengthCm: z
    .number({ message: 'enclosure.errors.lengthNumber' })
    .positive('enclosure.errors.lengthPositive')
    .max(2000, 'enclosure.errors.lengthRange'),
  widthCm: z
    .number({ message: 'enclosure.errors.widthNumber' })
    .positive('enclosure.errors.widthPositive')
    .max(2000, 'enclosure.errors.widthRange'),
  heightCm: z
    .number({ message: 'enclosure.errors.heightNumber' })
    .positive('enclosure.errors.heightPositive')
    .max(2000, 'enclosure.errors.heightRange'),
})

export type EnclosureFormValues = z.infer<typeof enclosureFormSchema>
