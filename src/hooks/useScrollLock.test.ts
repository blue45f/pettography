import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import useScrollLock from './useScrollLock'

beforeEach(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useScrollLock', () => {
  it('does nothing when locked=false', () => {
    renderHook(() => useScrollLock(false))
    expect(document.body.style.overflow).toBe('')
  })

  it('locks body overflow when locked=true', () => {
    renderHook(() => useScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('adds padding-right to compensate for scrollbar width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1008,
    })

    renderHook(() => useScrollLock(true))
    expect(document.body.style.paddingRight).toBe('16px')
  })

  it('restores overflow and padding on unmount', () => {
    document.body.style.overflow = 'auto'
    document.body.style.paddingRight = '4px'
    const { unmount } = renderHook(() => useScrollLock(true))
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingRight).toBe('4px')
  })
})
