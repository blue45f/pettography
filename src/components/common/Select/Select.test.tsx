import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Select from './Select'

const options = [
  { value: 'kr', label: '한국' },
  { value: 'us', label: '미국' },
  { value: 'jp', label: '일본', disabled: true },
]

describe('Select', () => {
  it('옵션들을 렌더링한다', () => {
    render(<Select options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('한국')).toBeInTheDocument()
    expect(screen.getByText('미국')).toBeInTheDocument()
  })

  it('레이블을 표시한다', () => {
    render(<Select label="국가" options={options} />)
    expect(screen.getByLabelText('국가')).toBeInTheDocument()
  })

  it('placeholder를 표시한다', () => {
    render(<Select options={options} placeholder="선택하세요" defaultValue="" />)
    expect(screen.getByText('선택하세요')).toBeInTheDocument()
  })

  it('에러 메시지를 표시한다', () => {
    render(<Select options={options} error="필수 항목입니다" />)
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('onChange 이벤트를 처리한다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select options={options} onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), 'us')
    expect(onChange).toHaveBeenCalled()
  })
})
