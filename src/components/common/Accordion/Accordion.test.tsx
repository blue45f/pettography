import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

import Accordion from './Accordion'

const items = [
  { id: '1', title: '항목 1', content: <p>내용 1</p> },
  { id: '2', title: '항목 2', content: <p>내용 2</p> },
  { id: '3', title: '항목 3', content: <p>내용 3</p>, disabled: true },
]

describe('Accordion', () => {
  it('모든 항목의 타이틀을 렌더링한다', () => {
    render(<Accordion items={items} />)
    expect(screen.getByText('항목 1')).toBeInTheDocument()
    expect(screen.getByText('항목 2')).toBeInTheDocument()
    expect(screen.getByText('항목 3')).toBeInTheDocument()
  })

  it('초기에 모든 패널이 닫혀있다', () => {
    render(<Accordion items={items} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      if (!btn.hasAttribute('disabled')) {
        expect(btn).toHaveAttribute('aria-expanded', 'false')
      }
    })
  })

  it('클릭으로 패널을 열고 닫는다', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)

    const trigger = screen.getByText('항목 1')
    await user.click(trigger)
    expect(trigger.closest('button')).toHaveAttribute('aria-expanded', 'true')

    await user.click(trigger)
    expect(trigger.closest('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('defaultOpen으로 초기 열린 항목을 지정한다', () => {
    render(<Accordion items={items} defaultOpen={['2']} />)
    const button2 = screen.getByText('항목 2').closest('button')
    expect(button2).toHaveAttribute('aria-expanded', 'true')
  })

  it('allowMultiple이 아닐 때 하나만 열린다', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)

    await user.click(screen.getByText('항목 1'))
    expect(screen.getByText('항목 1').closest('button')).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByText('항목 2'))
    expect(screen.getByText('항목 1').closest('button')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('항목 2').closest('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('disabled 항목은 비활성화된다', () => {
    render(<Accordion items={items} />)
    expect(screen.getByText('항목 3').closest('button')).toBeDisabled()
  })
})
