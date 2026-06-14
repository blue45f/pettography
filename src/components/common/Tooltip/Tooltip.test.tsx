import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import Tooltip from './Tooltip'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Tooltip', () => {
  it('does not render the tooltip body initially', () => {
    render(<Tooltip content="hi">trigger</Tooltip>)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip after delay on mouse enter', () => {
    const { container } = render(
      <Tooltip content="hello" delay={200}>
        trigger
      </Tooltip>
    )
    const wrapper = container.firstChild as HTMLElement
    fireEvent.mouseEnter(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toHaveTextContent('hello')
  })

  it('hides the tooltip on mouse leave and clears pending timer', () => {
    const { container } = render(
      <Tooltip content="hi" delay={300}>
        trigger
      </Tooltip>
    )
    const wrapper = container.firstChild as HTMLElement
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(150))
    fireEvent.mouseLeave(wrapper)
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows on focus and hides on blur', () => {
    const { container } = render(
      <Tooltip content="focused" delay={0}>
        <button>btn</button>
      </Tooltip>
    )
    const wrapper = container.firstChild as HTMLElement
    fireEvent.focus(wrapper)
    act(() => vi.advanceTimersByTime(0))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('applies the position class', () => {
    const { container } = render(
      <Tooltip content="x" position="bottom" delay={0}>
        trigger
      </Tooltip>
    )
    const wrapper = container.firstChild as HTMLElement
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(0))
    expect(screen.getByRole('tooltip').className).toMatch(/bottom/)
  })

  it('supports the left and right positions', () => {
    const { container, rerender } = render(
      <Tooltip content="x" position="left" delay={0}>
        t
      </Tooltip>
    )
    const wrapper = container.firstChild as HTMLElement
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(0))
    expect(screen.getByRole('tooltip').className).toMatch(/left/)

    fireEvent.mouseLeave(wrapper)
    rerender(
      <Tooltip content="x" position="right" delay={0}>
        t
      </Tooltip>
    )
    fireEvent.mouseEnter(container.firstChild as HTMLElement)
    act(() => vi.advanceTimersByTime(0))
    expect(screen.getByRole('tooltip').className).toMatch(/right/)
  })

  it('cleans up timer on unmount', () => {
    const { container, unmount } = render(
      <Tooltip content="x" delay={500}>
        t
      </Tooltip>
    )
    fireEvent.mouseEnter(container.firstChild as HTMLElement)
    unmount()
    expect(() => act(() => vi.advanceTimersByTime(500))).not.toThrow()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
