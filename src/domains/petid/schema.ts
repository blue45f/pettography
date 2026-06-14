import { z } from 'zod'

export const petIdSchema = z.object({
  petName: z.string().min(1, 'petid.errors.petNameRequired').max(40, 'petid.errors.petNameMax'),
  speciesLabel: z
    .string()
    .min(1, 'petid.errors.speciesLabelRequired')
    .max(40, 'petid.errors.speciesLabelMax'),
  ownerName: z
    .string()
    .min(1, 'petid.errors.ownerNameRequired')
    .max(40, 'petid.errors.ownerNameMax'),
  ownerPhone: z
    .string()
    .min(1, 'petid.errors.ownerPhoneRequired')
    .max(30, 'petid.errors.ownerPhoneMax'),
  region: z.string().max(60, 'petid.errors.regionMax').optional().or(z.literal('')),
  registrationNumber: z
    .string()
    .max(60, 'petid.errors.registrationNumberMax')
    .optional()
    .or(z.literal('')),
  distinctMarks: z.string().max(240, 'petid.errors.distinctMarksMax').optional().or(z.literal('')),
  foundInstructions: z
    .string()
    .max(240, 'petid.errors.foundInstructionsMax')
    .optional()
    .or(z.literal('')),
})

export type PetIdValues = z.infer<typeof petIdSchema>

export const EMPTY_PET_ID: PetIdValues = {
  petName: '',
  speciesLabel: '',
  ownerName: '',
  ownerPhone: '',
  region: '',
  registrationNumber: '',
  distinctMarks: '',
  foundInstructions: '',
}
