import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Alert from './Alert'

describe('Alert', () => {
  it('메시지를 렌더링한다', () => {
    render(<Alert>경고 메시지입니다.</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('경고 메시지입니다.')).toBeInTheDocument()
  })

  it('제목을 표시한다', () => {
    render(<Alert title="주의">내용</Alert>)
    expect(screen.getByText('주의')).toBeInTheDocument()
  })

  it('dismissible일 때 닫기 버튼을 표시한다', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <Alert dismissible onDismiss={onDismiss}>
        메시지
      </Alert>
    )

    await user.click(screen.getByLabelText('알림 닫기'))
    expect(onDismiss).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('dismissible이 아니면 닫기 버튼이 없다', () => {
    render(<Alert>메시지</Alert>)
    expect(screen.queryByLabelText('알림 닫기')).not.toBeInTheDocument()
  })
})
