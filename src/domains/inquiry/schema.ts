import { z } from 'zod'

/**
 * In-app inquiry → TermsDesk central inbox
 * (POST /api/public/<org>/inquiries). Categories mirror the TermsDesk
 * contract verbatim; the `website` field is a hidden honeypot that humans
 * leave empty and the server uses for spam triage.
 */
export const INQUIRY_CATEGORIES = ['contact', 'partnership', 'bug', 'qa', 'question'] as const
export const inquiryCategorySchema = z.enum(INQUIRY_CATEGORIES)
export type InquiryCategory = z.infer<typeof inquiryCategorySchema>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const inquiryFormSchema = z.object({
  category: inquiryCategorySchema,
  title: z.string().trim().min(2, 'inquiry.errors.titleMin').max(140, 'inquiry.errors.titleMax'),
  body: z.string().trim().min(10, 'inquiry.errors.bodyMin').max(4000, 'inquiry.errors.bodyMax'),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || EMAIL_RE.test(v), { message: 'inquiry.errors.emailInvalid' }),
  /** Honeypot — rendered invisibly, submitted verbatim, must stay empty for humans. */
  website: z.string().optional(),
})

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>

/** Server receipt — the contract this page promises to render: id/status/createdAt. */
export const inquiryReceiptSchema = z.object({
  id: z.string(),
  status: z.string(),
  createdAt: z.string(),
})

export type InquiryReceipt = z.infer<typeof inquiryReceiptSchema>

/** Receipt + what was asked, kept locally so the user can find their ticket again. */
export interface StoredInquiryReceipt extends InquiryReceipt {
  category: InquiryCategory
  title: string
}
