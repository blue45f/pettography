import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

import useClickOutside from './useClickOutside'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useClickOutside', () => {
  it('returns a ref initialized to null', () => {
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(() => {}))
    expect(result.current.current).toBeNull()
  })

  it('does not call handler when click is inside the ref element', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler))
    const div = document.createElement('div')
    document.body.appendChild(div)
    result.current.current = div

    div.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler when click is outside the ref element', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler))
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    document.body.appendChild(inside)
    document.body.appendChild(outside)
    result.current.current = inside

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('responds to touchstart events too', () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler))
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    document.body.append(inside, outside)
    result.current.current = inside

    outside.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when ref is null', () => {
    const handler = vi.fn()
    renderHook(() => useClickOutside<HTMLDivElement>(handler))
    document.dispatchEvent(new MouseEvent('mousedown'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('removes listeners on unmount', () => {
    const handler = vi.fn()
    const { result, unmount } = renderHook(() => useClickOutside<HTMLDivElement>(handler))
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    document.body.append(inside, outside)
    result.current.current = inside
    unmount()

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()
  })
})
