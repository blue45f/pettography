import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ToastProvider } from './Toast'
import { useToast } from './ToastContext'

function Trigger({
  message,
  type,
  duration,
}: {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}) {
  const { toast } = useToast()
  return <button onClick={() => toast(message, type, duration)}>fire</button>
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('renders the live region for screen readers', () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>,
    )
    expect(screen.getByLabelText('알림')).toBeInTheDocument()
  })

  it('shows a toast when triggered and auto-dismisses after duration', () => {
    render(
      <ToastProvider>
        <Trigger message="hello world" duration={1500} />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    expect(screen.getByRole('status')).toHaveTextContent('hello world')

    act(() => vi.advanceTimersByTime(1500))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders an error variant', () => {
    render(
      <ToastProvider>
        <Trigger message="boom" type="error" />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    expect(screen.getByRole('alert').className).toMatch(/error/)
  })

  it('renders success/warning/info variants', () => {
    function TripleFire() {
      const { toast } = useToast()
      return (
        <div>
          <button onClick={() => toast('s', 'success')}>s</button>
          <button onClick={() => toast('w', 'warning')}>w</button>
          <button onClick={() => toast('i', 'info')}>i</button>
        </div>
      )
    }
    render(
      <ToastProvider>
        <TripleFire />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 's' }))
    fireEvent.click(screen.getByRole('button', { name: 'w' }))
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    const statuses = screen.getAllByRole('status')
    expect(statuses[0].className).toMatch(/success/)
    expect(statuses[1].className).toMatch(/warning/)
    expect(statuses[2].className).toMatch(/info/)
  })

  it('close button removes the toast immediately', () => {
    render(
      <ToastProvider>
        <Trigger message="dismiss me" duration={9999} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    expect(screen.getByRole('status')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('throws when useToast used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Trigger message="x" />)).toThrow(/useToast/)
    spy.mockRestore()
  })

  it('queues multiple toasts', () => {
    render(
      <ToastProvider>
        <Trigger message="a" duration={9999} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })
})
