export {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_IMAGE_MAX_DIMENSION,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_PDF_MIME,
  AttachmentRejectionError,
  classifyAttachmentMime,
  dataUrlBytes,
  fileToAttachment,
  scaleToFit,
  validateAttachmentCandidate,
} from './engine'
export type { AttachmentRejectionReason, FitResult } from './engine'
export { ATTACHMENT_KINDS, attachmentKindSchema, attachmentSchema } from './schema'
export type { Attachment, AttachmentKind } from './schema'
