import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Input from './Input'

describe('Input', () => {
  it('레이블을 렌더링한다', () => {
    render(<Input label="이메일" />)
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })

  it('에러 메시지를 표시한다', () => {
    render(<Input label="이메일" error="필수 항목입니다" />)
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('도움말 텍스트를 표시한다', () => {
    render(<Input helperText="영문, 숫자 포함" />)
    expect(screen.getByText('영문, 숫자 포함')).toBeInTheDocument()
  })

  it('에러가 있을 때 도움말 텍스트를 숨긴다', () => {
    render(<Input error="에러" helperText="도움말" />)
    expect(screen.queryByText('도움말')).not.toBeInTheDocument()
    expect(screen.getByText('에러')).toBeInTheDocument()
  })

  it('disabled 상태를 적용한다', () => {
    render(<Input label="이름" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
