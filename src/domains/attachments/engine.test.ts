import { describe, expect, it } from 'vitest'

import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  classifyAttachmentMime,
  dataUrlBytes,
  scaleToFit,
  validateAttachmentCandidate,
} from './engine'

describe('classifyAttachmentMime', () => {
  it('accepts images and pdf, rejects everything else', () => {
    expect(classifyAttachmentMime('image/png')).toBe('image')
    expect(classifyAttachmentMime('image/jpeg')).toBe('image')
    expect(classifyAttachmentMime('application/pdf')).toBe('pdf')
    expect(classifyAttachmentMime('video/mp4')).toBeNull()
    expect(classifyAttachmentMime('text/html')).toBeNull()
  })

  it('rejects svg despite the image/* prefix', () => {
    expect(classifyAttachmentMime('image/svg+xml')).toBeNull()
    expect(validateAttachmentCandidate({ type: 'image/svg+xml', size: 10 }, 0)).toBe('unsupported')
  })
})

describe('scaleToFit', () => {
  it('keeps small images untouched', () => {
    expect(scaleToFit(800, 600, 1600)).toEqual({ width: 800, height: 600, scaled: false })
  })

  it('downscales the longest edge to the cap while preserving ratio', () => {
    const fit = scaleToFit(3200, 2400, 1600)
    expect(fit).toEqual({ width: 1600, height: 1200, scaled: true })
  })

  it('handles portrait orientation', () => {
    const fit = scaleToFit(1000, 4000, 1600)
    expect(fit.height).toBe(1600)
    expect(fit.width).toBe(400)
    expect(fit.scaled).toBe(true)
  })

  it('never upscales and never collapses to zero', () => {
    expect(scaleToFit(10, 10, 1600).scaled).toBe(false)
    const tiny = scaleToFit(1, 9000, 1600)
    expect(tiny.width).toBeGreaterThanOrEqual(1)
  })
})

describe('dataUrlBytes', () => {
  it('computes decoded size from base64 payload', () => {
    // 'hello' → aGVsbG8= (5 bytes, 1 padding char)
    expect(dataUrlBytes('data:text/plain;base64,aGVsbG8=')).toBe(5)
  })

  it('returns 0 for malformed urls', () => {
    expect(dataUrlBytes('not-a-data-url')).toBe(0)
  })
})

describe('validateAttachmentCandidate', () => {
  it('rejects when the per-post slot cap is reached', () => {
    const file = { type: 'image/png', size: 1024 }
    expect(validateAttachmentCandidate(file, ATTACHMENT_MAX_COUNT)).toBe('tooMany')
    expect(validateAttachmentCandidate(file, ATTACHMENT_MAX_COUNT - 1)).toBeNull()
  })

  it('rejects unsupported mime types', () => {
    expect(validateAttachmentCandidate({ type: 'video/mp4', size: 10 }, 0)).toBe('unsupported')
  })

  it('rejects pdfs over the cap but lets large images reach the resize pipeline', () => {
    expect(
      validateAttachmentCandidate({ type: 'application/pdf', size: ATTACHMENT_MAX_BYTES + 1 }, 0),
    ).toBe('tooLarge')
    expect(
      validateAttachmentCandidate({ type: 'image/jpeg', size: ATTACHMENT_MAX_BYTES * 3 }, 0),
    ).toBeNull()
    expect(
      validateAttachmentCandidate({ type: 'image/jpeg', size: ATTACHMENT_MAX_BYTES * 13 }, 0),
    ).toBe('tooLarge')
  })
})
