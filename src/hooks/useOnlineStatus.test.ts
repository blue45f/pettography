import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import useOnlineStatus from './useOnlineStatus'

describe('useOnlineStatus', () => {
  it('reflects initial navigator.onLine', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(typeof result.current).toBe('boolean')
  })

  it('updates to false on offline event', () => {
    const { result } = renderHook(() => useOnlineStatus())
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(false)
  })

  it('updates to true on online event', () => {
    const { result } = renderHook(() => useOnlineStatus())
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(false)
    act(() => window.dispatchEvent(new Event('online')))
    expect(result.current).toBe(true)
  })

  it('removes listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useOnlineStatus())
    unmount()
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(true)
  })
})
