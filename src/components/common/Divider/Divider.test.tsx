import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Divider from './Divider'

describe('Divider', () => {
  it('separator 역할을 가진다', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('레이블을 표시한다', () => {
    render(<Divider label="또는" />)
    expect(screen.getByText('또는')).toBeInTheDocument()
  })

  it('추가 className을 적용한다', () => {
    const { container } = render(<Divider className="custom" />)
    expect(container.querySelector('.custom')).toBeTruthy()
  })
})
