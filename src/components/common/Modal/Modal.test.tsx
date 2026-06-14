import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import Modal from './Modal'

describe('Modal', () => {
  it('isOpen=false일 때 렌더링하지 않는다', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        내용
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen=true일 때 렌더링한다', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        모달 내용
      </Modal>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('모달 내용')).toBeInTheDocument()
  })

  it('제목을 표시한다', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="확인">
        내용
      </Modal>
    )
    expect(screen.getByText('확인')).toBeInTheDocument()
  })

  it('닫기 버튼을 클릭하면 onClose를 호출한다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="테스트">
        내용
      </Modal>
    )

    await user.click(screen.getByLabelText('닫기'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ESC 키로 닫을 수 있다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose}>
        내용
      </Modal>
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('aria-modal 속성을 가진다', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        내용
      </Modal>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})
