import LazyImage from './LazyImage'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof LazyImage> = {
  title: 'Common/LazyImage',
  component: LazyImage,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof LazyImage>

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/seed/lazy/400/300',
    alt: '샘플 이미지',
    width: 400,
    height: 300,
  },
}

export const FixedSize: Story = {
  args: {
    src: 'https://picsum.photos/seed/fixed/200/200',
    alt: '고정 크기 이미지',
    width: 200,
    height: 200,
  },
}

export const WithPlaceholder: Story = {
  args: {
    src: 'https://picsum.photos/seed/placeholder/400/300',
    alt: '플레이스홀더 포함 이미지',
    width: 400,
    height: 300,
    placeholder: '로딩 중...',
  },
}

export const BrokenImage: Story = {
  args: {
    src: 'https://invalid-domain-for-testing.example/not-found.jpg',
    alt: '깨진 이미지',
    width: 200,
    height: 200,
  },
}
