import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import SkipLink from './SkipLink'

describe('SkipLink', () => {
  it('renders default target and text', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: '본문으로 건너뛰기' })
    expect(link).toHaveAttribute('href', '#main-content')
  })

  it('uses custom targetId and text', () => {
    render(<SkipLink targetId="foo" text="Jump" />)
    const link = screen.getByRole('link', { name: 'Jump' })
    expect(link).toHaveAttribute('href', '#foo')
  })
})
