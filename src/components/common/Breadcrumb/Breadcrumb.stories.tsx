import { MemoryRouter } from 'react-router'

import Breadcrumb from './Breadcrumb'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Common/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Breadcrumb>

export const Default: Story = {
  args: {
    items: [{ label: '홈', href: '/' }, { label: '제품', href: '/products' }, { label: '상세' }],
  },
}

export const TwoLevels: Story = {
  args: {
    items: [{ label: '홈', href: '/' }, { label: '대시보드' }],
  },
}

export const DeepNesting: Story = {
  args: {
    items: [
      { label: '홈', href: '/' },
      { label: '카테고리', href: '/category' },
      { label: '서브 카테고리', href: '/category/sub' },
      { label: '아이템', href: '/category/sub/item' },
      { label: '상세' },
    ],
  },
}

export const CustomSeparator: Story = {
  args: {
    separator: '›',
    items: [{ label: '홈', href: '/' }, { label: '문서', href: '/docs' }, { label: '튜토리얼' }],
  },
}
