import Textarea from './Textarea'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Textarea> = {
  title: 'Common/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: '내용을 입력하세요',
    rows: 4,
  },
}

export const WithLabel: Story = {
  args: {
    label: '메시지',
    placeholder: '메시지를 입력하세요',
    rows: 4,
  },
}

export const WithHelperText: Story = {
  args: {
    label: '자기소개',
    placeholder: '자기소개를 작성해 주세요.',
    helperText: '최대 500자까지 입력 가능합니다.',
    rows: 5,
  },
}

export const WithError: Story = {
  args: {
    label: '메시지',
    placeholder: '메시지를 입력하세요',
    error: '필수 항목입니다.',
    rows: 4,
  },
}

export const Disabled: Story = {
  args: {
    label: '읽기 전용',
    value: '수정할 수 없는 내용',
    disabled: true,
    rows: 4,
  },
}
