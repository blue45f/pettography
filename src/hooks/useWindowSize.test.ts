import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import useWindowSize from './useWindowSize'

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWindowSize', () => {
  it('returns the current window dimensions', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
    const { result } = renderHook(() => useWindowSize())
    expect(result.current).toEqual({ width: 800, height: 600 })
  })

  it('updates on window resize', () => {
    const { result } = renderHook(() => useWindowSize())
    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 })
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 240 })
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toEqual({ width: 320, height: 240 })
  })

  it('removes the listener on unmount', () => {
    const { unmount } = renderHook(() => useWindowSize())
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
