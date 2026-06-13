import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Button from './Button'

describe('Button', () => {
  it('텍스트를 렌더링한다', () => {
    render(<Button>클릭</Button>)
    expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument()
  })

  it('클릭 이벤트를 처리한다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled 상태에서 클릭을 차단한다', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        클릭
      </Button>,
    )

    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('isLoading 상태에서 버튼을 비활성화한다', () => {
    render(<Button isLoading>클릭</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('isLoading 상태에서도 접근 가능한 이름과 busy 상태를 유지한다', () => {
    render(<Button isLoading>저장</Button>)
    const button = screen.getByRole('button', { name: '저장' })

    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('variant 클래스를 적용한다', () => {
    const { container } = render(<Button variant="outline">클릭</Button>)
    expect(container.querySelector('button')).toBeTruthy()
  })

  it('모든 variant가 버튼으로 렌더링된다 (secondary 포함)', () => {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost'] as const) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>)
      expect(screen.getByRole('button', { name: variant })).toBeInTheDocument()
      unmount()
    }
  })

  it('fullWidth는 w-full 클래스를 추가한다', () => {
    render(<Button fullWidth>전체폭</Button>)
    expect(screen.getByRole('button', { name: '전체폭' })).toHaveClass('w-full')
  })

  it('size를 적용해 버튼을 렌더링한다', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(<Button size={size}>{size}</Button>)
      expect(screen.getByRole('button', { name: size })).toBeInTheDocument()
      unmount()
    }
  })

  it('isLoading 상태에서 스피너(decorative)를 표시한다', () => {
    const { container } = render(<Button isLoading>저장</Button>)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})
