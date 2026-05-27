import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Skeleton from './Skeleton'

describe('Skeleton', () => {
  it('로딩 상태를 표시한다', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('여러 줄의 텍스트 스켈레톤을 렌더링한다', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />)
    const skeletons = container.querySelectorAll('[class*="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('원형 스켈레톤을 렌더링한다', () => {
    const { container } = render(<Skeleton variant="circular" width={48} height={48} />)
    const skeleton = container.querySelector('[class*="circular"]')
    expect(skeleton).toBeTruthy()
  })

  it('커스텀 크기를 적용한다', () => {
    render(<Skeleton variant="rectangular" width="200px" height="100px" />)
    const el = screen.getByRole('status')
    expect(el.style.width).toBe('200px')
    expect(el.style.height).toBe('100px')
  })
})
