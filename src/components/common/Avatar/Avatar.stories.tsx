import Avatar from './Avatar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Avatar> = {
  title: 'Common/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {
    name: 'John Doe',
  },
}

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=12',
    alt: 'Sample user avatar',
    name: 'Sample User',
  },
}

export const Initials: Story = {
  args: {
    name: 'Jane Smith',
  },
}

export const Fallback: Story = {
  args: {},
}

export const SmallSize: Story = {
  args: {
    name: 'Alice',
    size: 'sm',
  },
}

export const MediumSize: Story = {
  args: {
    name: 'Bob',
    size: 'md',
  },
}

export const LargeSize: Story = {
  args: {
    name: 'Charlie',
    size: 'lg',
  },
}

export const ExtraLargeSize: Story = {
  args: {
    name: 'David',
    size: 'xl',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar name="A B" size="sm" />
      <Avatar name="C D" size="md" />
      <Avatar name="E F" size="lg" />
      <Avatar name="G H" size="xl" />
    </div>
  ),
}
