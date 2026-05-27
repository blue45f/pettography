import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Tabs from './Tabs'

const tabs = [
  { id: 'tab1', label: '탭 1', content: <p>내용 1</p> },
  { id: 'tab2', label: '탭 2', content: <p>내용 2</p> },
  { id: 'tab3', label: '탭 3', content: <p>내용 3</p>, disabled: true },
]

describe('Tabs', () => {
  it('모든 탭 레이블을 렌더링한다', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tab', { name: '탭 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '탭 2' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '탭 3' })).toBeInTheDocument()
  })

  it('첫 번째 탭을 기본 활성화한다', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tab', { name: '탭 1' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('내용 1')).toBeInTheDocument()
  })

  it('탭 클릭으로 전환한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Tabs tabs={tabs} onChange={onChange} />)

    await user.click(screen.getByRole('tab', { name: '탭 2' }))
    expect(screen.getByText('내용 2')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('tab2')
  })

  it('disabled 탭은 클릭할 수 없다', () => {
    render(<Tabs tabs={tabs} />)
    expect(screen.getByRole('tab', { name: '탭 3' })).toBeDisabled()
  })

  it('defaultTab으로 초기 탭을 지정한다', () => {
    render(<Tabs tabs={tabs} defaultTab="tab2" />)
    expect(screen.getByRole('tab', { name: '탭 2' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('내용 2')).toBeInTheDocument()
  })
})
