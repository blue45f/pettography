import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Progress from './Progress'

describe('Progress', () => {
  it('progressbar 역할을 가진다', () => {
    render(<Progress value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('aria-valuenow를 설정한다', () => {
    render(<Progress value={75} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
  })

  it('레이블을 표시한다', () => {
    render(<Progress value={30} showLabel />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('커스텀 레이블을 표시한다', () => {
    render(<Progress value={5} max={10} showLabel label="5/10 완료" />)
    expect(screen.getByText('5/10 완료')).toBeInTheDocument()
  })

  it('값을 0-100%로 제한한다', () => {
    const { container } = render(<Progress value={150} />)
    // The kit indicator is the only element carrying the scaleX transform.
    const bar = container.querySelector('[style*="scaleX"]')
    expect(bar).toBeTruthy()
    // clamped to 100% -> scaleX(1) (transform avoids animating the layout `width`)
    expect(bar?.getAttribute('style')).toContain('scaleX(1)')
  })
})
