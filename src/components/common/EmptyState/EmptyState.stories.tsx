import Button from '../Button/Button'

import EmptyState from './EmptyState'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: '데이터가 없습니다',
  },
}

export const WithDescription: Story = {
  args: {
    title: '결과가 없습니다',
    description: '검색 조건에 일치하는 항목을 찾을 수 없습니다.',
  },
}

export const WithIcon: Story = {
  args: {
    title: '비어있음',
    description: '아직 추가된 항목이 없습니다.',
    icon: '📭',
  },
}

export const WithAction: Story = {
  args: {
    title: '항목이 없습니다',
    description: '새로운 항목을 추가해보세요.',
    icon: '✨',
    action: <Button variant="primary">항목 추가하기</Button>,
  },
}
