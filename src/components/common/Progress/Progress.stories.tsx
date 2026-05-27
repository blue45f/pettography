import Progress from './Progress'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Progress> = {
  title: 'Common/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Progress>

export const Default: Story = {
  args: {
    value: 50,
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const CustomLabel: Story = {
  args: {
    value: 42,
    showLabel: true,
    label: '42 / 100 작업 완료',
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Primary: Story = {
  args: { value: 60, variant: 'primary' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Success: Story = {
  args: { value: 100, variant: 'success', showLabel: true },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Warning: Story = {
  args: { value: 80, variant: 'warning' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Error: Story = {
  args: { value: 30, variant: 'error' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Small: Story = {
  args: { value: 50, size: 'sm' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Medium: Story = {
  args: { value: 50, size: 'md' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const Large: Story = {
  args: { value: 50, size: 'lg' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}

export const CustomMax: Story = {
  args: { value: 30, max: 50, showLabel: true },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Progress {...args} />
    </div>
  ),
}
