import { z } from 'zod'

export const contactCategorySchema = z.enum([
  'general',
  'bug',
  'feature',
  'partnership',
  'safety',
  'other',
])
export type ContactCategory = z.infer<typeof contactCategorySchema>

export const contactStatusSchema = z.enum(['received', 'in-review', 'resolved'])
export type ContactStatus = z.infer<typeof contactStatusSchema>

export const contactInquirySchema = z.object({
  id: z.string(),
  category: contactCategorySchema,
  name: z.string().min(1).max(40),
  email: z.string().max(120).nullable(),
  subject: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  status: contactStatusSchema,
  createdAt: z.string(),
})

export type ContactInquiry = z.infer<typeof contactInquirySchema>

export const contactFormSchema = z.object({
  category: contactCategorySchema,
  name: z.string().trim().min(1, 'contact.errors.nameRequired').max(40, 'contact.errors.nameMax'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'contact.errors.emailInvalid',
    }),
  subject: z
    .string()
    .trim()
    .min(2, 'contact.errors.subjectMin')
    .max(120, 'contact.errors.subjectMax'),
  body: z.string().trim().min(10, 'contact.errors.bodyMin').max(2000, 'contact.errors.bodyMax'),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

export const CONTACT_CATEGORIES: readonly ContactCategory[] = [
  'general',
  'bug',
  'feature',
  'partnership',
  'safety',
  'other',
] as const
