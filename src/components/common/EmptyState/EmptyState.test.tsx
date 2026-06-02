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

  it('헤딩 레벨을 적용한다', () => {
    render(<EmptyState title="없음" headingLevel={2} />)
    expect(screen.getByRole('heading', { level: 2, name: '없음' })).toBeInTheDocument()
  })

  describe('variant', () => {
    it('log 변형에서 hint를 렌더링한다', () => {
      render(
        <EmptyState
          variant="log"
          title="아직 급이 기록이 없어요"
          hint="팁: 거부한 먹이도 함께 남겨두세요."
        />,
      )
      expect(screen.getByText('팁: 거부한 먹이도 함께 남겨두세요.')).toBeInTheDocument()
    })

    it('gated 변형에서도 hint를 렌더링한다', () => {
      render(<EmptyState variant="gated" title="병원을 먼저 선택하세요" hint="설정에서 추가" />)
      expect(screen.getByText('설정에서 추가')).toBeInTheDocument()
    })

    it('hint는 contained 변형에서만 노출된다 (default에서는 무시)', () => {
      render(<EmptyState title="없음" hint="숨겨진 힌트" />)
      expect(screen.queryByText('숨겨진 힌트')).not.toBeInTheDocument()
    })

    it('discover 변형에서도 hint는 노출되지 않는다', () => {
      render(<EmptyState variant="discover" title="결과 없음" hint="숨겨진 힌트" />)
      expect(screen.queryByText('숨겨진 힌트')).not.toBeInTheDocument()
    })

    it('hint가 없으면 contained 변형이라도 아무것도 추가하지 않는다', () => {
      render(<EmptyState variant="log" title="제목만" />)
      expect(screen.getByText('제목만')).toBeInTheDocument()
    })
  })
})
