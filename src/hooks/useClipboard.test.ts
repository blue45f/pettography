import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import useClipboard from './useClipboard'

const writeTextMock = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  writeTextMock.mockReset()
  Object.assign(navigator, {
    clipboard: { writeText: writeTextMock },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useClipboard', () => {
  it('starts with copied=false and error=null', () => {
    const { result } = renderHook(() => useClipboard())
    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets copied=true after a successful copy and resets after delay', async () => {
    writeTextMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useClipboard(1000))

    await act(async () => {
      await result.current.copy('hello')
    })

    expect(writeTextMock).toHaveBeenCalledWith('hello')
    expect(result.current.copied).toBe(true)
    expect(result.current.error).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.copied).toBe(false)
  })

  it('captures error message when clipboard write fails', async () => {
    writeTextMock.mockRejectedValue(new Error('permission denied'))
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('x')
    })

    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBe('permission denied')
  })

  it('uses fallback error message when error is not an Error instance', async () => {
    writeTextMock.mockRejectedValue('weird')
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('x')
    })

    expect(result.current.error).toBe('클립보드 복사에 실패했습니다.')
  })

  it('uses default 2000ms resetDelay', async () => {
    writeTextMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('a')
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.copied).toBe(false)
  })
})
