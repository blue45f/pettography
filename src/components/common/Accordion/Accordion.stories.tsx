import Accordion from './Accordion'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Accordion> = {
  title: 'Common/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Accordion>

const items = [
  { id: '1', title: '첫 번째 항목', content: <p>첫 번째 패널 내용입니다.</p> },
  { id: '2', title: '두 번째 항목', content: <p>두 번째 패널 내용입니다.</p> },
  { id: '3', title: '세 번째 항목', content: <p>세 번째 패널 내용입니다.</p> },
]

export const Default: Story = {
  args: {
    items,
  },
}

export const AllowMultiple: Story = {
  args: {
    items,
    allowMultiple: true,
    defaultOpen: ['1', '2'],
  },
}

export const WithDefaultOpen: Story = {
  args: {
    items,
    defaultOpen: ['2'],
  },
}

export const WithDisabledItem: Story = {
  args: {
    items: [
      { id: '1', title: '활성 항목', content: <p>활성 콘텐츠</p> },
      { id: '2', title: '비활성 항목', content: <p>비활성 콘텐츠</p>, disabled: true },
      { id: '3', title: '활성 항목 2', content: <p>활성 콘텐츠 2</p> },
    ],
  },
}
