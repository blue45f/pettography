import Divider from './Divider'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Divider> = {
  title: 'Common/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Divider>

export const Default: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <p>위 콘텐츠</p>
      <Divider />
      <p>아래 콘텐츠</p>
    </div>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <p>위 콘텐츠</p>
      <Divider orientation="horizontal" />
      <p>아래 콘텐츠</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', height: 80, gap: 16 }}>
      <span>왼쪽</span>
      <Divider orientation="vertical" />
      <span>오른쪽</span>
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <p>위 콘텐츠</p>
      <Divider label="또는" />
      <p>아래 콘텐츠</p>
    </div>
  ),
}
