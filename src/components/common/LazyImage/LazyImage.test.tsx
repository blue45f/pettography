import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import LazyImage from './LazyImage'

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void
let lastCallback: Cb | null = null

beforeEach(() => {
  lastCallback = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: Cb) {
        lastCallback = cb
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LazyImage', () => {
  it('renders placeholder before intersection', () => {
    const { container } = render(<LazyImage src="/a.png" alt="alt" placeholder="loading…" />)
    expect(container.textContent).toContain('loading…')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders shimmer when no placeholder provided', () => {
    const { container } = render(<LazyImage src="/a.png" alt="alt" />)
    expect(container.querySelector('[class*="shimmer"]')).toBeInTheDocument()
  })

  it('renders image when intersecting and marks loaded on load', () => {
    render(<LazyImage src="/a.png" alt="cat" width={100} height={50} />)
    act(() => lastCallback!([{ isIntersecting: true } as IntersectionObserverEntry]))

    const img = screen.getByRole('img', { name: 'cat' })
    expect(img).toHaveAttribute('src', '/a.png')

    fireEvent.load(img)
    expect(img.className).toMatch(/loaded/)
  })

  it('shows error state when image fails to load', () => {
    render(<LazyImage src="/bad.png" alt="oops" />)
    act(() => lastCallback!([{ isIntersecting: true } as IntersectionObserverEntry]))
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(screen.getByLabelText('이미지 로드 실패')).toBeInTheDocument()
  })

  it('accepts string width/height as-is', () => {
    const { container } = render(<LazyImage src="/x" alt="x" width="50%" height="auto" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.width).toBe('50%')
    expect(wrapper.style.height).toBe('auto')
  })
})
