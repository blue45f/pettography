import { z } from 'zod'

export const petIdSchema = z.object({
  petName: z.string().min(1).max(40),
  speciesLabel: z.string().min(1).max(40),
  ownerName: z.string().min(1).max(40),
  ownerPhone: z.string().min(1).max(30),
  region: z.string().max(60).optional().or(z.literal('')),
  registrationNumber: z.string().max(60).optional().or(z.literal('')),
  distinctMarks: z.string().max(240).optional().or(z.literal('')),
  foundInstructions: z.string().max(240).optional().or(z.literal('')),
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
