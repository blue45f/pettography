import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import ContentImage from './ContentImage'

describe('ContentImage', () => {
  it('정상 URL은 이미지를 렌더링한다', () => {
    render(<ContentImage src="/photo.jpg" alt="펫 사진" />)
    const img = screen.getByRole('img', { name: '펫 사진' })
    expect(img).toHaveAttribute('src', '/photo.jpg')
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer')
  })

  it('로드 실패 시 원본 alt를 보존한 폴백으로 대체한다', () => {
    render(<ContentImage src="/dead.jpg" alt="펫 사진" />)
    fireEvent.error(screen.getByRole('img'))
    // 보조기기가 "어떤 사진이 실패했는지" 알 수 있게 alt를 유지한다.
    expect(screen.getByLabelText('펫 사진 (이미지 로드 실패)')).toBeInTheDocument()
  })

  it('alt가 없으면 일반 실패 라벨을 쓴다', () => {
    // alt="" 이미지는 암묵적 img role이 없어 querySelector로 선택해 error를 발생시킨다.
    const { container } = render(<ContentImage src="/dead.jpg" alt="" />)
    fireEvent.error(container.querySelector('img')!)
    expect(screen.getByLabelText('이미지 로드 실패')).toBeInTheDocument()
  })

  it('폴백 박스에 호출부 className을 유지해 같은 크기를 차지한다', () => {
    const { container } = render(<ContentImage src="/dead.jpg" alt="x" className="thumb" />)
    fireEvent.error(screen.getByRole('img'))
    expect((container.firstChild as HTMLElement).className).toContain('thumb')
  })

  it('src가 유효 URL로 바뀌면 폴백에서 회복해 다시 이미지를 렌더링한다', () => {
    const { rerender } = render(<ContentImage src="/dead.jpg" alt="펫 사진" />)
    fireEvent.error(screen.getByRole('img'))
    // 실패 후에는 폴백 div(role="img", 태그는 DIV)
    expect(screen.getByRole('img', { name: /펫 사진/ }).tagName).toBe('DIV')
    // src가 바뀌면 다시 <img>로 회복
    rerender(<ContentImage src="/good.jpg" alt="펫 사진" />)
    const img = screen.getByRole('img', { name: '펫 사진' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/good.jpg')
  })
})
