import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'

import Breadcrumb from './Breadcrumb'

const items = [
  { label: '홈', href: '/' },
  { label: '카테고리', href: '/category' },
  { label: '현재 페이지' },
]

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Breadcrumb', () => {
  it('모든 항목을 렌더링한다', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.getByText('홈')).toBeInTheDocument()
    expect(screen.getByText('카테고리')).toBeInTheDocument()
    expect(screen.getByText('현재 페이지')).toBeInTheDocument()
  })

  it('마지막 항목에 aria-current를 적용한다', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.getByText('현재 페이지')).toHaveAttribute('aria-current', 'page')
  })

  it('링크 항목을 Link로 렌더링한다', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    const homeLink = screen.getByText('홈')
    expect(homeLink.tagName).toBe('A')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('커스텀 구분자를 적용한다', () => {
    renderWithRouter(<Breadcrumb items={items} separator=">" />)
    const separators = screen.getAllByText('>')
    expect(separators).toHaveLength(2)
  })

  it('네비게이션 aria-label을 가진다', () => {
    renderWithRouter(<Breadcrumb items={items} />)
    expect(screen.getByRole('navigation', { name: '현재 위치' })).toBeInTheDocument()
  })
})
