import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import usePrevious from './usePrevious'

describe('usePrevious', () => {
  it('초기 렌더링에서 undefined를 반환한다', () => {
    const { result } = renderHook(() => usePrevious(0))
    expect(result.current).toBeUndefined()
  })

  it('업데이트 후 이전 값을 반환한다', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'first' },
    })

    expect(result.current).toBeUndefined()

    rerender({ value: 'second' })
    expect(result.current).toBe('first')

    rerender({ value: 'third' })
    expect(result.current).toBe('second')
  })
})
