import { vetRoleSchema, vetStatusSchema } from '@pettography/shared'
import { z } from 'zod'

// vetRoleSchema is shared; the codebase refers to it as vetConsultRoleSchema.
export const vetConsultRoleSchema = vetRoleSchema
export type { VetConsultRole } from '@pettography/shared'

export const vetMessageSchema = z.object({
  id: z.string(),
  vetId: z.string(),
  role: vetConsultRoleSchema,
  body: z.string(),
  createdAt: z.string(),
})

export type VetMessage = z.infer<typeof vetMessageSchema>

export const vetSchema = z.object({
  id: z.string(),
  name: z.string(),
  clinic: z.string(),
  specialties: z.array(z.string()).min(1),
  yearsOfExperience: z.number().int().nonnegative(),
  status: vetStatusSchema,
  avatarEmoji: z.string(),
  hourlyKrw: z.number().int().nonnegative(),
})

export type Vet = z.infer<typeof vetSchema>
