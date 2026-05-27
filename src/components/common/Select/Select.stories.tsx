import Select from './Select'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Select> = {
  title: 'Common/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Select>

const options = [
  { value: 'apple', label: '사과' },
  { value: 'banana', label: '바나나' },
  { value: 'cherry', label: '체리' },
  { value: 'date', label: '대추' },
]

export const Default: Story = {
  args: {
    options,
  },
}

export const WithLabel: Story = {
  args: {
    label: '과일 선택',
    options,
  },
}

export const WithPlaceholder: Story = {
  args: {
    label: '과일 선택',
    placeholder: '선택해주세요',
    options,
    defaultValue: '',
  },
}

export const WithHelperText: Story = {
  args: {
    label: '과일 선택',
    helperText: '좋아하는 과일을 골라주세요.',
    options,
  },
}

export const WithError: Story = {
  args: {
    label: '과일 선택',
    options,
    error: '필수 선택 항목입니다.',
  },
}

export const Disabled: Story = {
  args: {
    label: '비활성',
    options,
    disabled: true,
  },
}

export const WithDisabledOption: Story = {
  args: {
    label: '과일 선택',
    options: [
      { value: 'apple', label: '사과' },
      { value: 'banana', label: '바나나 (품절)', disabled: true },
      { value: 'cherry', label: '체리' },
    ],
  },
}
