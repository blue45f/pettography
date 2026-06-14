import { useAppStore } from '@store/index'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Header from './Header'

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState(useAppStore.getInitialState(), true)
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
})

function renderHeader(initial = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <Header />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Header', () => {
  it('renders the logo and onboarding-first nav items when profile is empty', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /Pettography/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '처음 선택' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '병원' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '샵' })).toBeInTheDocument()
  })

  it('marks the active route with aria-current', () => {
    renderHeader('/hospitals')
    const link = screen.getByRole('link', { name: '병원' })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('toggles the mobile menu via the hamburger button', () => {
    renderHeader()
    const btn = screen.getByLabelText('메뉴 열기')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(screen.getByLabelText('메뉴 닫기')).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes the menu when a nav link is clicked', () => {
    renderHeader()
    fireEvent.click(screen.getByLabelText('메뉴 열기'))
    fireEvent.click(screen.getByRole('link', { name: '병원' }))
    expect(screen.getByLabelText('메뉴 열기')).toHaveAttribute('aria-expanded', 'false')
  })

  it('changes the displayed language via the language toggle', () => {
    renderHeader()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('ko')
    fireEvent.change(select, { target: { value: 'en' } })
    expect(screen.getByRole('link', { name: 'First pick' })).toBeInTheDocument()
  })
})
