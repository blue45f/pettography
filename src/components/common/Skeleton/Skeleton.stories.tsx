import Skeleton from './Skeleton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Skeleton> = {
  title: 'Common/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: {
    width: 240,
    height: 16,
  },
}

export const Text: Story = {
  args: {
    variant: 'text',
    width: 240,
  },
}

export const TextMultipleLines: Story = {
  args: {
    variant: 'text',
    width: 320,
    lines: 4,
  },
}

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 64,
    height: 64,
  },
}

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 240,
    height: 120,
  },
}

export const CardSkeleton: Story = {
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton variant="rectangular" width="100%" height={140} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" lines={3} />
    </div>
  ),
}
