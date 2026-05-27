import Button from '../Button/Button'

import Tooltip from './Tooltip'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Tooltip> = {
  title: 'Common/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  args: {
    content: '도움말 텍스트',
    children: <Button>마우스를 올려보세요</Button>,
  },
}

export const Top: Story = {
  args: {
    content: '위쪽 툴팁',
    position: 'top',
    children: <Button>Top</Button>,
  },
}

export const Bottom: Story = {
  args: {
    content: '아래쪽 툴팁',
    position: 'bottom',
    children: <Button>Bottom</Button>,
  },
}

export const Left: Story = {
  args: {
    content: '왼쪽 툴팁',
    position: 'left',
    children: <Button>Left</Button>,
  },
}

export const Right: Story = {
  args: {
    content: '오른쪽 툴팁',
    position: 'right',
    children: <Button>Right</Button>,
  },
}

export const NoDelay: Story = {
  args: {
    content: '즉시 표시되는 툴팁',
    delay: 0,
    children: <Button>즉시 표시</Button>,
  },
}

export const LongDelay: Story = {
  args: {
    content: '1초 후 표시',
    delay: 1000,
    children: <Button>1초 지연</Button>,
  },
}

export const AllPositions: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, auto)',
        gap: 32,
        padding: 64,
      }}
    >
      <Tooltip content="위쪽" position="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="아래쪽" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content="왼쪽" position="left">
        <Button>Left</Button>
      </Tooltip>
      <Tooltip content="오른쪽" position="right">
        <Button>Right</Button>
      </Tooltip>
    </div>
  ),
}
