import { useState } from 'react'

import Button from '../Button/Button'

import Modal from './Modal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Modal> = {
  title: 'Common/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Modal>

function ModalDemo({
  title,
  size,
  closeOnOverlay,
  body,
}: {
  title?: string
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlay?: boolean
  body?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title}
        size={size}
        closeOnOverlay={closeOnOverlay}
      >
        {body ?? (
          <div>
            <p>모달 본문 내용입니다.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button onClick={() => setOpen(false)}>확인</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: () => <ModalDemo title="기본 모달" />,
}

export const Small: Story = {
  render: () => <ModalDemo title="작은 모달" size="sm" />,
}

export const Medium: Story = {
  render: () => <ModalDemo title="중간 모달" size="md" />,
}

export const Large: Story = {
  render: () => <ModalDemo title="큰 모달" size="lg" />,
}

export const WithoutTitle: Story = {
  render: () => <ModalDemo body={<p>제목이 없는 모달입니다.</p>} />,
}

export const NoOverlayClose: Story = {
  render: () => (
    <ModalDemo
      title="오버레이 클릭 방지"
      closeOnOverlay={false}
      body={<p>오버레이를 눌러도 닫히지 않습니다. Esc 또는 X 버튼으로만 닫을 수 있습니다.</p>}
    />
  ),
}
