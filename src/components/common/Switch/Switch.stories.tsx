import { useState } from 'react'

import Switch from './Switch'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Switch> = {
  title: 'Common/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Switch>

function SwitchDemo({
  initial = false,
  label,
  disabled,
  size,
}: {
  initial?: boolean
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const [checked, setChecked] = useState(initial)
  return (
    <Switch checked={checked} onChange={setChecked} label={label} disabled={disabled} size={size} />
  )
}

export const Default: Story = {
  render: () => <SwitchDemo />,
}

export const Checked: Story = {
  render: () => <SwitchDemo initial={true} />,
}

export const WithLabel: Story = {
  render: () => <SwitchDemo label="알림 받기" />,
}

export const Disabled: Story = {
  render: () => <SwitchDemo label="비활성 상태" disabled />,
}

export const DisabledChecked: Story = {
  render: () => <SwitchDemo label="비활성 + 체크됨" disabled initial={true} />,
}

export const Small: Story = {
  render: () => <SwitchDemo label="작은 사이즈" size="sm" />,
}

export const Medium: Story = {
  render: () => <SwitchDemo label="기본 사이즈" size="md" />,
}
