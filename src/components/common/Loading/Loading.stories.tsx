import Loading from './Loading'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Loading> = {
  title: 'Common/Loading',
  component: Loading,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Loading>

export const Default: Story = {
  args: {},
}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const CustomText: Story = {
  args: {
    text: '데이터를 가져오는 중...',
  },
}

export const NoText: Story = {
  args: {
    text: '',
  },
}
