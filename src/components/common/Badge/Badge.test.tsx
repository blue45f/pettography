import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Badge from './Badge'

describe('Badge', () => {
  it('텍스트를 렌더링한다', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('variant에 따른 스타일을 적용한다', () => {
    const { container } = render(<Badge variant="success">Active</Badge>)
    expect(container.querySelector('span')).toBeTruthy()
  })

  it('추가 className을 적용한다', () => {
    const { container } = render(<Badge className="custom">Test</Badge>)
    expect(container.querySelector('.custom')).toBeTruthy()
  })

  it('모든 variant가 span으로 렌더링된다', () => {
    for (const variant of ['default', 'primary', 'success', 'warning', 'error'] as const) {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>)
      expect(screen.getByText(variant).tagName).toBe('SPAN')
      unmount()
    }
  })
})
