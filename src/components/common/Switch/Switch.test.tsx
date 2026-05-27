import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Switch from './Switch'

describe('Switch', () => {
  it('switch 역할을 가진다', () => {
    render(<Switch checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('checked 상태를 반영한다', () => {
    render(<Switch checked={true} onChange={vi.fn()} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('클릭으로 상태를 토글한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} />)

    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('레이블을 표시한다', () => {
    render(<Switch checked={false} onChange={vi.fn()} label="알림 수신" />)
    expect(screen.getByText('알림 수신')).toBeInTheDocument()
  })

  it('disabled 상태에서 클릭을 차단한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} disabled />)

    await user.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
