import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Avatar from './Avatar'

describe('Avatar', () => {
  it('이름의 이니셜을 표시한다', () => {
    render(<Avatar name="홍 길동" />)
    expect(screen.getByText('홍길')).toBeInTheDocument()
  })

  it('단일 이름의 첫 글자를 표시한다', () => {
    render(<Avatar name="홍길동" />)
    expect(screen.getByText('홍')).toBeInTheDocument()
  })

  it('이름 없이 fallback을 표시한다', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('이미지 src가 있으면 img를 렌더링한다', () => {
    render(<Avatar src="/avatar.jpg" alt="사용자 아바타" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/avatar.jpg')
    expect(img).toHaveAttribute('alt', '사용자 아바타')
  })
})
