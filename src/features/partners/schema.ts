import { z } from 'zod'

export const partnerKindSchema = z.enum(['shop', 'hospital', 'treat-shop'])
export type PartnerKind = z.infer<typeof partnerKindSchema>

export const partnerStatusSchema = z.enum(['pending', 'approved', 'rejected'])
export type PartnerStatus = z.infer<typeof partnerStatusSchema>

export const partnerApplicationSchema = z.object({
  id: z.string(),
  kind: partnerKindSchema,
  name: z.string().min(1).max(80),
  contact: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  description: z.string().min(1).max(1000),
  url: z.string().url().nullable(),
  status: partnerStatusSchema,
  createdAt: z.string(),
})

export type PartnerApplication = z.infer<typeof partnerApplicationSchema>

export const partnerFormSchema = z.object({
  kind: partnerKindSchema,
  name: z.string().trim().min(1, 'partners.errors.nameRequired').max(80),
  contact: z.string().trim().min(1, 'partners.errors.contactRequired').max(80),
  region: z.string().trim().min(1, 'partners.errors.regionRequired').max(80),
  description: z.string().trim().min(10, 'partners.errors.descriptionMin').max(1000),
  url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), { message: 'partners.errors.urlInvalid' }),
})

export type PartnerFormValues = z.infer<typeof partnerFormSchema>
