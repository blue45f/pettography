import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'

import ErrorBoundary from './ErrorBoundary'

import type { ReactElement } from 'react'

function Bomb({ on }: { on: boolean }) {
  if (on) throw new Error('boom!')
  return <div>ok</div>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb on={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('renders default fallback UI with error message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb on={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: '문제가 발생했습니다' })).toBeInTheDocument()
    expect(screen.getByText('boom!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<div>custom</div>}>
        <Bomb on={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('custom')).toBeInTheDocument()
  })

  it('reset button restores rendering', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Toggleable() {
      return <Bomb on={false} />
    }
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb on={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('boom!')).toBeInTheDocument()
    rerender(
      <ErrorBoundary>
        <Toggleable />
      </ErrorBoundary>
    )
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('falls back to default message when error has no message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Empty(): ReactElement {
      const e = new Error()
      e.message = ''
      throw e
    }
    render(
      <ErrorBoundary>
        <Empty />
      </ErrorBoundary>
    )
    expect(screen.getByText('알 수 없는 오류가 발생했습니다.')).toBeInTheDocument()
  })
})
