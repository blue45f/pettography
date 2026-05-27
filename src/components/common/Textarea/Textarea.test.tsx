import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Textarea from './Textarea'

describe('Textarea', () => {
  it('레이블을 렌더링한다', () => {
    render(<Textarea label="메시지" />)
    expect(screen.getByLabelText('메시지')).toBeInTheDocument()
  })

  it('에러 메시지를 표시한다', () => {
    render(<Textarea label="내용" error="필수 항목입니다" />)
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('도움말 텍스트를 표시한다', () => {
    render(<Textarea helperText="최대 500자" />)
    expect(screen.getByText('최대 500자')).toBeInTheDocument()
  })

  it('에러 시 도움말 텍스트를 숨긴다', () => {
    render(<Textarea error="에러" helperText="도움말" />)
    expect(screen.queryByText('도움말')).not.toBeInTheDocument()
  })

  it('disabled 상태를 적용한다', () => {
    render(<Textarea label="비고" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
