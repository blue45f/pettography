import Card from './Card'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof Card> = {
  title: 'Common/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: <p>기본 카드 내용입니다.</p>,
  },
}

export const WithHeaderAndFooter: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <h3 style={{ margin: 0 }}>카드 제목</h3>
      </Card.Header>
      <Card.Body>
        <p>카드 본문 내용입니다. 여기에 다양한 콘텐츠를 넣을 수 있습니다.</p>
      </Card.Body>
      <Card.Footer>
        <span>푸터 정보</span>
      </Card.Footer>
    </Card>
  ),
}

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: <p>마우스를 올려보세요.</p>,
  },
}

export const PaddingNone: Story = {
  args: {
    padding: 'none',
    children: <div style={{ background: '#eee', padding: 16 }}>패딩 없음</div>,
  },
}

export const PaddingSmall: Story = {
  args: {
    padding: 'sm',
    children: <p>작은 패딩</p>,
  },
}

export const PaddingMedium: Story = {
  args: {
    padding: 'md',
    children: <p>중간 패딩 (기본값)</p>,
  },
}

export const PaddingLarge: Story = {
  args: {
    padding: 'lg',
    children: <p>큰 패딩</p>,
  },
}
