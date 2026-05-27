import Alert from './Alert'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Alert> = {
  title: 'Common/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    children: '이것은 기본 알림 메시지입니다.',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    title: '안내',
    children: '정보 알림 메시지입니다.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: '성공',
    children: '성공적으로 저장되었습니다.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: '경고',
    children: '주의가 필요한 상황입니다.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    title: '오류',
    children: '에러가 발생했습니다.',
  },
}

export const Dismissible: Story = {
  args: {
    variant: 'info',
    title: '알림',
    children: '이 알림은 닫을 수 있습니다.',
    dismissible: true,
  },
}

export const WithoutTitle: Story = {
  args: {
    variant: 'success',
    children: '제목 없는 알림입니다.',
  },
}
