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

  it('로드 실패 시 라벨이 붙은 폴백으로 대체한다', () => {
    render(<ContentImage src="/dead.jpg" alt="펫 사진" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByLabelText('이미지 로드 실패')).toBeInTheDocument()
  })

  it('폴백 박스에 호출부 className을 유지해 같은 크기를 차지한다', () => {
    const { container } = render(<ContentImage src="/dead.jpg" alt="x" className="thumb" />)
    fireEvent.error(screen.getByRole('img'))
    expect((container.firstChild as HTMLElement).className).toContain('thumb')
  })
})
