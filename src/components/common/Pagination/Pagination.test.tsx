import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Pagination from './Pagination'

describe('Pagination', () => {
  it('페이지 버튼을 렌더링한다', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('현재 페이지에 aria-current를 적용한다', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('3')).toHaveAttribute('aria-current', 'page')
  })

  it('페이지 클릭으로 onPageChange를 호출한다', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)

    await user.click(screen.getByText('2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('첫 페이지에서 이전 버튼을 비활성화한다', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
  })

  it('마지막 페이지에서 다음 버튼을 비활성화한다', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
  })

  it('totalPages가 1이면 렌더링하지 않는다', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('많은 페이지에서 줄임표를 표시한다', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
