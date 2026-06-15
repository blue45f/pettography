import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Link } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RouteAnnouncer from './RouteAnnouncer'

function Harness() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <RouteAnnouncer />
      {/* App 의 본문 랜드마크를 모사 — 포커스 이동 대상 */}
      <main id="main-content" tabIndex={-1}>
        <Link to="/dashboard">go dashboard</Link>
        <Routes>
          <Route path="/" element={<p>home</p>} />
          <Route path="/dashboard" element={<p>dashboard</p>} />
        </Routes>
      </main>
    </MemoryRouter>
  )
}

beforeEach(() => {
  document.title = 'Pettography'
  globalThis.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
  globalThis.scrollTo = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RouteAnnouncer', () => {
  it('renders a polite live status region', () => {
    render(<Harness />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-atomic', 'true')
  })

  it('does not announce on first render', () => {
    render(<Harness />)
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('announces the page title and moves focus to main on route change', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    document.title = '대시보드 · Pettography'
    await user.click(screen.getByRole('link', { name: 'go dashboard' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        '대시보드 · Pettography 페이지로 이동했습니다'
      )
    })
    expect(document.getElementById('main-content')).toHaveFocus()
    expect(globalThis.scrollTo).toHaveBeenCalled()
  })
})
