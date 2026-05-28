import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import Footer from './Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  it('renders the current year and a Pettography copyright', () => {
    renderFooter()
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
    expect(screen.getByText(/Pettography/)).toBeInTheDocument()
  })

  it('renders the about, backup, registry and GitHub links', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /소개|About/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /백업|Backup/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /보관신고|Wildlife/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/ })).toBeInTheDocument()
  })
})
