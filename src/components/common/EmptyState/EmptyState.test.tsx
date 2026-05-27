import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('제목을 렌더링한다', () => {
    render(<EmptyState title="데이터가 없습니다" />)
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument()
  })

  it('설명을 표시한다', () => {
    render(<EmptyState title="없음" description="검색 결과가 없습니다." />)
    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('아이콘을 표시한다', () => {
    render(<EmptyState title="없음" icon="📭" />)
    expect(screen.getByText('📭')).toBeInTheDocument()
  })

  it('액션 영역을 렌더링한다', () => {
    render(<EmptyState title="없음" action={<button>추가하기</button>} />)
    expect(screen.getByRole('button', { name: '추가하기' })).toBeInTheDocument()
  })
})
