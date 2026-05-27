import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Footer from './Footer'

describe('Footer', () => {
  it('renders the current year and a Pettography copyright', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
    expect(screen.getByText(/Pettography/)).toBeInTheDocument()
  })

  it('renders the standard policy links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '이용약관' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '문의하기' })).toBeInTheDocument()
  })
})
