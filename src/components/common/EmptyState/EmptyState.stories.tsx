import Button from '../Button/Button'

import EmptyState from './EmptyState'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'log', 'discover', 'gated'],
    },
  },
}

export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: '데이터가 없습니다',
  },
}

export const WithDescription: Story = {
  args: {
    title: '결과가 없습니다',
    description: '검색 조건에 일치하는 항목을 찾을 수 없습니다.',
  },
}

export const WithIcon: Story = {
  args: {
    title: '비어있음',
    description: '아직 추가된 항목이 없습니다.',
    icon: '📭',
  },
}

export const WithAction: Story = {
  args: {
    title: '항목이 없습니다',
    description: '새로운 항목을 추가해보세요.',
    icon: '✨',
    action: <Button variant="primary">항목 추가하기</Button>,
  },
}

/**
 * `log` — first-run primer for husbandry logging pages. Contained tinted panel
 * with a soft icon medallion and a teaching `hint`. Use when the entry form is
 * already on the page.
 */
export const Log: Story = {
  args: {
    variant: 'log',
    icon: '🍽️',
    title: '아직 급이 기록이 없어요',
    description: '첫 급이를 기록하면 다음 급이일 예측과 거식 추적이 시작됩니다.',
    hint: '팁: 거식이 의심되면 거부한 먹이도 함께 남겨두면 패턴이 보여요.',
  },
}

/**
 * `discover` — empty browse/search results. Stays quiet and airy so it never
 * competes with the filters above it.
 */
export const Discover: Story = {
  args: {
    variant: 'discover',
    icon: '🔍',
    title: '검색 결과가 없어요',
    description: '필터를 바꾸거나 검색어를 줄여보세요.',
  },
}

/**
 * `gated` — a precondition is unmet (pick a pet, choose a vet…). Contained
 * panel with a muted medallion so the next step reads as intentional.
 */
export const Gated: Story = {
  args: {
    variant: 'gated',
    icon: '💬',
    title: '상담할 수의사를 먼저 선택하세요',
    hint: '오른쪽 목록에서 수의사를 고르면 상담 내역이 여기 표시돼요.',
  },
}
