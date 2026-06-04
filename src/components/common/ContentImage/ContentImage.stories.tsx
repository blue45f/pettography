import ContentImage from './ContentImage'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof ContentImage> = {
  title: 'Common/ContentImage',
  component: ContentImage,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof ContentImage>

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/seed/content/320/240',
    alt: '샘플 사진',
  },
}

export const BrokenImage: Story = {
  args: {
    src: 'https://invalid-domain-for-testing.example/not-found.jpg',
    alt: '깨진 사진',
  },
}
