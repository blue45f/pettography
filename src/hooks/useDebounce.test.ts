import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import useDebounce from './useDebounce'

describe('useDebounce', () => {
  it('지정된 딜레이 후 값을 반환한다', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')

    vi.useRealTimers()
  })
})
