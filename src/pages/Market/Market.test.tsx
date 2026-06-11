import ToastProvider from '@components/common/Toast'
import { useMarketStore } from '@features/market'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import Market, { MARKET_LISTING_DRAFT_KEY } from './Market'

import { createAppQueryClient } from '@/app/queryClient'

function renderMarket() {
  const queryClient = createAppQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <Market />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('Market', () => {
  beforeEach(() => {
    localStorage.clear()
    useMarketStore.setState({
      listings: [],
      ownIds: {},
      lastAuthor: '',
      seeded: false,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('restores and discards a saved listing draft', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      MARKET_LISTING_DRAFT_KEY,
      JSON.stringify({
        title: '임시 저장된 크레스티드 게코',
        speciesId: null,
        morph: '릴리화이트',
        region: 'jamsil',
        cbStatus: 'cb',
        isFree: true,
        priceKrw: null,
        contact: 'keeper@example.com',
        description: '먹이 반응과 탈피 기록을 같이 전달합니다.',
        author: '테스터',
      }),
    )

    renderMarket()

    expect(screen.getByRole('status')).toHaveTextContent('작성 중이던 분양 글')
    expect(screen.getByDisplayValue('임시 저장된 크레스티드 게코')).toBeInTheDocument()
    expect(screen.getByDisplayValue('릴리화이트')).toBeInTheDocument()
    expect(screen.getByDisplayValue('테스터')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '임시 저장 삭제' }))

    expect(localStorage.getItem(MARKET_LISTING_DRAFT_KEY)).toBeNull()
    await waitFor(() => {
      expect(screen.getByLabelText('제목')).toHaveValue('')
    })
  })

  it('autosaves composer values and renders a live listing preview', async () => {
    const user = userEvent.setup()
    renderMarket()

    await user.type(screen.getByLabelText('제목'), '볼파이톤 파스텔 CB')
    await user.type(screen.getByLabelText('모프 (선택)'), '파스텔')
    await user.click(screen.getByRole('switch', { name: '무료 나눔으로 등록' }))
    await user.type(screen.getByLabelText('연락처'), 'https://open.kakao.com/o/example')
    await user.type(screen.getByLabelText('상세 설명'), '온순하고 냉동쥐 피딩 중입니다.')
    await user.type(screen.getByLabelText('작성자'), '송파키퍼')

    const preview = screen.getByRole('region', { name: '실시간 미리보기' })
    expect(within(preview).getByText('볼파이톤 파스텔 CB')).toBeInTheDocument()
    expect(within(preview).getAllByText(/파스텔/).length).toBeGreaterThanOrEqual(2)
    expect(within(preview).getByText('무료 나눔')).toBeInTheDocument()
    expect(within(preview).getByText('온순하고 냉동쥐 피딩 중입니다.')).toBeInTheDocument()

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(MARKET_LISTING_DRAFT_KEY) ?? '{}')).toMatchObject({
        title: '볼파이톤 파스텔 CB',
        morph: '파스텔',
        isFree: true,
        contact: 'https://open.kakao.com/o/example',
        description: '온순하고 냉동쥐 피딩 중입니다.',
        author: '송파키퍼',
      })
    })

    await user.click(screen.getByRole('button', { name: '등록하기' }))

    await waitFor(() => {
      expect(localStorage.getItem(MARKET_LISTING_DRAFT_KEY)).toBeNull()
    })
  })
})
