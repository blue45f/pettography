import { z } from 'zod'

export const vetConsultRoleSchema = z.enum(['user', 'vet'])
export type VetConsultRole = z.infer<typeof vetConsultRoleSchema>

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
  status: z.enum(['online', 'busy', 'offline']),
  avatarEmoji: z.string(),
  hourlyKrw: z.number().int().nonnegative(),
})

export type Vet = z.infer<typeof vetSchema>
