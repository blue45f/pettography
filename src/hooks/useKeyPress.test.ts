import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import useKeyPress from './useKeyPress'

describe('useKeyPress', () => {
  it('starts as false', () => {
    const { result } = renderHook(() => useKeyPress('Escape'))
    expect(result.current).toBe(false)
  })

  it('returns true on keydown of target key', () => {
    const { result } = renderHook(() => useKeyPress('Escape'))
    act(() => globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(result.current).toBe(true)
  })

  it('returns false again after keyup', () => {
    const { result } = renderHook(() => useKeyPress('a'))
    act(() => globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })))
    expect(result.current).toBe(true)
    act(() => globalThis.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' })))
    expect(result.current).toBe(false)
  })

  it('ignores other keys', () => {
    const { result } = renderHook(() => useKeyPress('Escape'))
    act(() => globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })))
    expect(result.current).toBe(false)
    act(() => globalThis.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' })))
    expect(result.current).toBe(false)
  })

  it('cleans up listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useKeyPress('x'))
    unmount()
    act(() => globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })))
    expect(result.current).toBe(false)
  })
})
