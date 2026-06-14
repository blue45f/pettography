import type { Attachment, AttachmentKind } from './schema'

/** Hard cap per stored file (post-resize for images, raw for PDFs). */
export const ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024
/** Images are downscaled so the longest edge never exceeds this. */
export const ATTACHMENT_IMAGE_MAX_DIMENSION = 1600
/** Per-post attachment count cap — keeps localStorage quota survivable. */
export const ATTACHMENT_MAX_COUNT = 4

export const ATTACHMENT_PDF_MIME = 'application/pdf'
export const ATTACHMENT_ACCEPT = 'image/*,application/pdf'

const JPEG_QUALITY_STEPS = [0.82, 0.6] as const

export type AttachmentRejectionReason = 'unsupported' | 'tooLarge' | 'tooMany' | 'processFailed'

export class AttachmentRejectionError extends Error {
  constructor(public readonly reason: AttachmentRejectionReason) {
    super(`attachment rejected: ${reason}`)
    this.name = 'AttachmentRejectionError'
  }
}

/**
 * Maps a MIME type to the attachment kind we accept, or null when unsupported.
 * SVG is rejected outright (script-capable markup, and the canvas re-encode
 * pipeline cannot reliably rasterise it) even though it matches `image/*`.
 */
export function classifyAttachmentMime(mimeType: string): AttachmentKind | null {
  if (mimeType === ATTACHMENT_PDF_MIME) return 'pdf'
  if (mimeType === 'image/svg+xml') return null
  if (mimeType.startsWith('image/')) return 'image'
  return null
}

export interface FitResult {
  width: number
  height: number
  scaled: boolean
}

/** Scales (w, h) down proportionally so the longest edge fits `max`. Never upscales. */
export function scaleToFit(width: number, height: number, max: number): FitResult {
  const longest = Math.max(width, height)
  if (longest <= max || longest <= 0) {
    return { width, height, scaled: false }
  }
  const ratio = max / longest
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    scaled: true,
  }
}

/** Approximate decoded byte size of a base64 data URL (what storage actually pays). */
export function dataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex < 0) return 0
  const payload = dataUrl.slice(commaIndex + 1)
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding)
}

interface FileCandidate {
  type: string
  size: number
}

/**
 * Pre-flight validation usable before any expensive decode work. PDFs must fit
 * the cap as-is; images may still pass after the resize pipeline shrinks them,
 * so only absurd originals (> 24MB) are rejected up front.
 */
export function validateAttachmentCandidate(
  file: FileCandidate,
  existingCount: number
): AttachmentRejectionReason | null {
  if (existingCount >= ATTACHMENT_MAX_COUNT) return 'tooMany'
  const kind = classifyAttachmentMime(file.type)
  if (!kind) return 'unsupported'
  if (kind === 'pdf' && file.size > ATTACHMENT_MAX_BYTES) return 'tooLarge'
  if (kind === 'image' && file.size > ATTACHMENT_MAX_BYTES * 12) return 'tooLarge'
  return null
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('file read failed'))
    reader.readAsDataURL(file)
  })
}

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    }
  }
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image decode failed'))
      el.src = objectUrl
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

async function imageToAttachment(file: File): Promise<Attachment> {
  const decoded = await decodeImage(file)
  try {
    const fit = scaleToFit(decoded.width, decoded.height, ATTACHMENT_IMAGE_MAX_DIMENSION)
    const canvas = document.createElement('canvas')
    canvas.width = fit.width
    canvas.height = fit.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas 2d unavailable')
    context.drawImage(decoded.source, 0, 0, fit.width, fit.height)

    let dataUrl = ''
    for (const quality of JPEG_QUALITY_STEPS) {
      dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrlBytes(dataUrl) <= ATTACHMENT_MAX_BYTES) break
    }
    const bytes = dataUrlBytes(dataUrl)
    if (!dataUrl.startsWith('data:') || bytes === 0) throw new Error('canvas encode failed')
    if (bytes > ATTACHMENT_MAX_BYTES) throw new AttachmentRejectionError('tooLarge')

    return {
      id: crypto.randomUUID(),
      kind: 'image',
      name: file.name || 'image.jpg',
      mimeType: 'image/jpeg',
      bytes,
      dataUrl,
      width: fit.width,
      height: fit.height,
    }
  } finally {
    decoded.release()
  }
}

async function pdfToAttachment(file: File): Promise<Attachment> {
  const dataUrl = await readFileAsDataUrl(file)
  const bytes = dataUrlBytes(dataUrl)
  if (bytes > ATTACHMENT_MAX_BYTES) throw new AttachmentRejectionError('tooLarge')
  return {
    id: crypto.randomUUID(),
    kind: 'pdf',
    name: file.name || 'document.pdf',
    mimeType: ATTACHMENT_PDF_MIME,
    bytes,
    dataUrl,
  }
}

/**
 * Full browser pipeline: validate → (image: decode + downscale to ≤1600px +
 * JPEG re-encode | pdf: raw read) → enforce the 2MB cap. Throws
 * `AttachmentRejectionError` with a translatable reason on every failure path.
 */
export async function fileToAttachment(file: File, existingCount: number): Promise<Attachment> {
  const rejection = validateAttachmentCandidate(file, existingCount)
  if (rejection) throw new AttachmentRejectionError(rejection)
  const kind = classifyAttachmentMime(file.type)
  try {
    if (kind === 'pdf') return await pdfToAttachment(file)
    return await imageToAttachment(file)
  } catch (error) {
    if (error instanceof AttachmentRejectionError) throw error
    throw new AttachmentRejectionError('processFailed')
  }
}
