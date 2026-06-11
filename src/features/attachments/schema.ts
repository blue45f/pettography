import { z } from 'zod'

export const ATTACHMENT_KINDS = ['image', 'pdf'] as const
export const attachmentKindSchema = z.enum(ATTACHMENT_KINDS)
export type AttachmentKind = z.infer<typeof attachmentKindSchema>

/**
 * A post attachment stored inline as a data URL. The repo has no upload
 * server, so files live in localStorage next to the post that owns them —
 * which is exactly why the processing pipeline enforces a hard byte cap and
 * downscales images before anything is persisted.
 */
export const attachmentSchema = z.object({
  id: z.string(),
  kind: attachmentKindSchema,
  name: z.string().min(1).max(140),
  mimeType: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  dataUrl: z.string().startsWith('data:'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export type Attachment = z.infer<typeof attachmentSchema>
