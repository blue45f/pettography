import { afterEach, describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from './shareOrCopy'

const originalNavigator = { ...navigator }

afterEach(() => {
  vi.restoreAllMocks()
  // navigator 프로퍼티 정리 — 각 테스트가 자기 share/clipboard 를 주입한다.
  Reflect.deleteProperty(navigator, 'share')
  Reflect.deleteProperty(navigator, 'canShare')
  Object.assign(navigator, { clipboard: originalNavigator.clipboard })
})

describe('shareOrCopy', () => {
  it('uses the native share sheet when available and returns "shared"', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share })

    const result = await shareOrCopy({ title: 'Leopard Gecko', url: 'https://x.test/s/leo' })

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Leopard Gecko', url: 'https://x.test/s/leo' })
    )
    expect(result).toBe('shared')
  })

  it('treats an AbortError (user closed the sheet) as "dismissed"', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    Object.assign(navigator, { share })

    const result = await shareOrCopy({ url: 'https://x.test/s/leo' })

    expect(result).toBe('dismissed')
  })

  it('falls back to clipboard copy when native share is absent', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const result = await shareOrCopy({ title: 'Ball Python', url: 'https://x.test/s/ball' })

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('https://x.test/s/ball'))
    expect(result).toBe('copied')
  })
})
