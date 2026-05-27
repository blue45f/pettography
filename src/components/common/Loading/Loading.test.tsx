import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Loading from './Loading'

describe('Loading', () => {
  it('기본 로딩 텍스트를 표시한다', () => {
    render(<Loading />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('커스텀 텍스트를 표시한다', () => {
    render(<Loading text="데이터 불러오는 중" />)
    expect(screen.getByText('데이터 불러오는 중')).toBeInTheDocument()
  })

  it('텍스트 없이 스피너만 렌더링한다', () => {
    const { container } = render(<Loading text="" />)
    expect(container.querySelector('[class*="spinner"]')).toBeTruthy()
    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument()
  })
})
