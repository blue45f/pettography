import Input from './Input'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Input> = {
  title: 'Common/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: '입력하세요',
  },
}

export const WithLabel: Story = {
  args: {
    label: '이메일',
    placeholder: 'name@example.com',
    type: 'email',
  },
}

export const WithHelperText: Story = {
  args: {
    label: '비밀번호',
    type: 'password',
    helperText: '최소 8자 이상 입력해주세요.',
  },
}

export const WithError: Story = {
  args: {
    label: '이메일',
    placeholder: 'name@example.com',
    error: '올바른 이메일 형식이 아닙니다.',
    value: 'invalid-email',
  },
}

export const Disabled: Story = {
  args: {
    label: '이름',
    placeholder: '입력 불가',
    disabled: true,
  },
}

export const ReadOnly: Story = {
  args: {
    label: '읽기 전용',
    value: '수정할 수 없음',
    readOnly: true,
  },
}

export const Password: Story = {
  args: {
    label: '비밀번호',
    type: 'password',
    placeholder: '비밀번호 입력',
  },
}
