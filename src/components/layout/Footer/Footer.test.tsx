import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import Footer from './Footer'
import footerCss from './Footer.module.css?raw'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )
}

describe('Footer', () => {
  it('renders the current year and a Pettography copyright', () => {
    renderFooter()
    const year = new Date().getFullYear().toString()
    expect(screen.getAllByText(new RegExp(year))[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Pettography/)[0]).toBeInTheDocument()
  })

  it('renders the about, backup, registry and GitHub links', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /소개|About/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /백업|Backup/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /보관신고|Wildlife/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/ })).toBeInTheDocument()
  })

  it('routes terms and privacy to internal policy pages', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute(
      'href',
      '/privacy'
    )
  })

  it('routes bug reports to the in-app inquiry form preselecting the category', () => {
    renderFooter()
    expect(screen.getByRole('link', { name: /버그 제보|Report a bug/ })).toHaveAttribute(
      'href',
      '/support?category=bug'
    )
  })
})

// jsdom cannot compute CSS layout, so these guards assert the wrap rules at the
// stylesheet source level (same static-scan approach as scripts/audit-frontend-a11y.mjs).
// The link row grew past one-line capacity at 600-1024px viewports; without these
// rules the labels squeeze into multi-line fragments or overflow horizontally.
describe('Footer responsive layout guards', () => {
  it('lets the copyright row and the link row wrap at mid-width viewports', () => {
    expect(/\.container\s*\{[^}]*\}/.exec(footerCss)?.[0]).toContain('flex-wrap: wrap')
    expect(/\.links\s*\{[^}]*\}/.exec(footerCss)?.[0]).toContain('flex-wrap: wrap')
  })

  it('keeps each link label on a single line so links wrap as whole units', () => {
    expect(/\.link\s*\{[^}]*\}/.exec(footerCss)?.[0]).toContain('white-space: nowrap')
  })

  it('avoids mid-word breaks in the Korean copyright text', () => {
    expect(/\.copyright\s*\{[^}]*\}/.exec(footerCss)?.[0]).toContain('word-break: keep-all')
  })
})
