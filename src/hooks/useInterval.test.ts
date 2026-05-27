import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import useInterval from './useInterval'

describe('useInterval', () => {
  it('지정된 간격으로 콜백을 실행한다', () => {
    vi.useFakeTimers()
    const callback = vi.fn()

    renderHook(() => useInterval(callback, 1000))

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(2000)
    expect(callback).toHaveBeenCalledTimes(3)

    vi.useRealTimers()
  })

  it('delay가 null이면 실행하지 않는다', () => {
    vi.useFakeTimers()
    const callback = vi.fn()

    renderHook(() => useInterval(callback, null))

    vi.advanceTimersByTime(5000)
    expect(callback).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('언마운트 시 인터벌을 정리한다', () => {
    vi.useFakeTimers()
    const callback = vi.fn()

    const { unmount } = renderHook(() => useInterval(callback, 1000))

    vi.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalledTimes(1)

    unmount()

    vi.advanceTimersByTime(3000)
    expect(callback).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
