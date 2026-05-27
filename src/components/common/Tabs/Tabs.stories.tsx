import Tabs from './Tabs'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Tabs> = {
  title: 'Common/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Tabs>

const tabs = [
  { id: 'overview', label: '개요', content: <p>개요 콘텐츠입니다.</p> },
  { id: 'details', label: '상세', content: <p>상세 콘텐츠입니다.</p> },
  { id: 'reviews', label: '리뷰', content: <p>리뷰 콘텐츠입니다.</p> },
]

export const Default: Story = {
  args: {
    tabs,
  },
}

export const WithDefaultTab: Story = {
  args: {
    tabs,
    defaultTab: 'reviews',
  },
}

export const WithDisabledTab: Story = {
  args: {
    tabs: [
      { id: 'a', label: '활성', content: <p>활성 탭 콘텐츠</p> },
      { id: 'b', label: '비활성', content: <p>비활성 탭 콘텐츠</p>, disabled: true },
      { id: 'c', label: '활성 2', content: <p>활성 탭 콘텐츠 2</p> },
    ],
  },
}

export const ManyTabs: Story = {
  args: {
    tabs: Array.from({ length: 6 }, (_, i) => ({
      id: `tab-${i + 1}`,
      label: `탭 ${i + 1}`,
      content: <p>탭 {i + 1}의 콘텐츠입니다.</p>,
    })),
  },
}
