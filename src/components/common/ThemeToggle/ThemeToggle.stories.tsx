import ThemeToggle from './ThemeToggle'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Common/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof ThemeToggle>

export const Default: Story = {}
