import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import Card from './Card'

describe('Card', () => {
  it('children을 렌더링한다', () => {
    render(<Card>카드 내용</Card>)
    expect(screen.getByText('카드 내용')).toBeInTheDocument()
  })

  it('Header를 렌더링한다', () => {
    render(
      <Card>
        <Card.Header>제목</Card.Header>
      </Card>
    )
    expect(screen.getByText('제목')).toBeInTheDocument()
  })

  it('Body를 렌더링한다', () => {
    render(
      <Card>
        <Card.Body>본문</Card.Body>
      </Card>
    )
    expect(screen.getByText('본문')).toBeInTheDocument()
  })

  it('Footer를 렌더링한다', () => {
    render(
      <Card>
        <Card.Footer>푸터</Card.Footer>
      </Card>
    )
    expect(screen.getByText('푸터')).toBeInTheDocument()
  })

  it('추가 className을 적용한다', () => {
    const { container } = render(<Card className="custom">내용</Card>)
    expect(container.querySelector('.custom')).toBeTruthy()
  })
})
