import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import useDocumentTitle from './useDocumentTitle'

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Default Title'
  })

  it('문서 타이틀을 변경한다', () => {
    renderHook(() => useDocumentTitle('New Title'))
    expect(document.title).toBe('New Title')
  })

  it('언마운트 시 이전 타이틀로 복원한다', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Temp Title'))
    expect(document.title).toBe('Temp Title')

    unmount()
    expect(document.title).toBe('Default Title')
  })

  it('restoreOnUnmount=false일 때 복원하지 않는다', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Permanent', false))
    expect(document.title).toBe('Permanent')

    unmount()
    expect(document.title).toBe('Permanent')
  })
})
