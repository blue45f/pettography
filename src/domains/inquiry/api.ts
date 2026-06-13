import { POLICY_ORG_SLUG, TERMSDESK_BASE_URL } from '@domains/policies'

import { inquiryReceiptSchema, type InquiryCategory, type InquiryReceipt } from './schema'

/**
 * 문의는 약관과 같은 TermsDesk(중앙 운영 백오피스)로 접수된다. 외부 절대
 * URL이므로 policies와 동일하게 `@infrastructure/api` 대신 표준 fetch를 쓴다.
 */
export const INQUIRY_ENDPOINT = `${TERMSDESK_BASE_URL}/api/public/${POLICY_ORG_SLUG}/inquiries`

export interface InquirySubmission {
  category: InquiryCategory
  title: string
  body: string
  contactEmail?: string
  originUrl: string
  /** Honeypot value forwarded verbatim — server-side spam triage. */
  website: string
}

interface SubmitInquiryOptions {
  signal?: AbortSignal
}

export async function submitInquiry(
  submission: InquirySubmission,
  { signal }: SubmitInquiryOptions = {},
): Promise<InquiryReceipt> {
  const payload: Record<string, string> = {
    category: submission.category,
    title: submission.title,
    body: submission.body,
    originUrl: submission.originUrl,
    website: submission.website,
  }
  if (submission.contactEmail) payload.contactEmail = submission.contactEmail

  const response = await fetch(INQUIRY_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const parsed = inquiryReceiptSchema.safeParse(await response.json())
  if (!parsed.success) {
    console.error('[Inquiry Validation Error]', parsed.error)
    throw new Error('TermsDesk inquiry receipt failed validation')
  }

  return parsed.data
}
