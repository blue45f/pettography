import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import useMediaQuery from './useMediaQuery'

describe('useMediaQuery', () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = []
  let matches = false

  beforeEach(() => {
    listeners = []
    matches = false

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
          listeners.push(cb)
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('초기 매치 상태를 반환한다', () => {
    matches = true
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('매치 상태 변경을 감지한다', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    act(() => {
      matches = true
      listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent))
    })
    expect(result.current).toBe(true)
  })
})
