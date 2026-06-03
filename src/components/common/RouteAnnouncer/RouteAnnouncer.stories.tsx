import { MemoryRouter } from 'react-router'

import RouteAnnouncer from './RouteAnnouncer'

import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * `RouteAnnouncer` 는 SPA 라우트 전환을 스크린리더에 알리고, 포커스를 본문(`#main-content`)으로
 * 이동시키는 비시각 컴포넌트다. 화면에 보이는 출력이 없으므로(`.sr-only`) 레이아웃에 영향을 주지 않는다.
 * 실제 동작은 라우트 변경 시점에 일어나므로, 여기서는 마운트되는 live 영역의 구조만 보여준다.
 */
const meta: Meta<typeof RouteAnnouncer> = {
  title: 'Common/RouteAnnouncer',
  component: RouteAnnouncer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <main id="main-content" tabIndex={-1}>
          <p>본 컴포넌트는 시각적 출력이 없습니다. 접근성 트리(role=status)만 추가됩니다.</p>
          <Story />
        </main>
      </MemoryRouter>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof RouteAnnouncer>

export const Default: Story = {}
