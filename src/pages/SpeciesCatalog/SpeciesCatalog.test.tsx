import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import SpeciesCatalog from './SpeciesCatalog'

import { createAppQueryClient } from '@/app/queryClient'

function renderCatalog(initialEntry = '/species') {
  const queryClient = createAppQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <SpeciesCatalog />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function speciesTitlesInOrder(): Promise<string[]> {
  // Each card renders the Korean name in an <h2>; their DOM order reflects the
  // rendered (sorted) order of the grid.
  return screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent ?? '')
}

describe('SpeciesCatalog', () => {
  it('renders a monthly-budget badge on each species card', async () => {
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('레오파드 게코')).toBeInTheDocument()
    })
    // 레오파드 게코 has monthlyBudgetKrw 30,000 → formatted "월 ₩30,000".
    expect(screen.getByText('월 ₩30,000')).toBeInTheDocument()
  })

  it('sorts by lowest monthly budget when that sort is chosen', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('레오파드 게코')).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText('정렬'), '월 예산 낮은 순')

    await waitFor(async () => {
      const titles = await speciesTitlesInOrder()
      // 마다가스카르 휘파람 바퀴 has the lowest budget (8,000원).
      expect(titles[0]).toBe('마다가스카르 휘파람 바퀴')
    })
  })

  it('offers a reset action in the empty state and restores results when used', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('레오파드 게코')).toBeInTheDocument()
    })

    // A keyword that matches no species drains the grid to the empty state.
    await user.type(
      screen.getByRole('searchbox', { name: '종 이름·학명·태그 검색' }),
      'zzz-no-such-species'
    )

    const emptyState = await screen.findByText('조건에 맞는 종을 찾지 못했어요.')
    expect(emptyState).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '필터 초기화' }))

    await waitFor(() => {
      expect(screen.getByText('레오파드 게코')).toBeInTheDocument()
    })
    expect(screen.queryByText('조건에 맞는 종을 찾지 못했어요.')).not.toBeInTheDocument()
  })

  it('keeps the curated seed order under the default Recommended sort', async () => {
    renderCatalog()
    await waitFor(() => {
      expect(screen.getByText('레오파드 게코')).toBeInTheDocument()
    })
    const titles = await speciesTitlesInOrder()
    expect(titles.slice(0, 3)).toEqual(['레오파드 게코', '크레스티드 게코', '볼파이톤'])
  })

  it('hydrates the sort order from the URL search params', async () => {
    renderCatalog('/species?sort=budgetAsc')
    await waitFor(() => {
      expect(screen.getByText('마다가스카르 휘파람 바퀴')).toBeInTheDocument()
    })
    const titles = await speciesTitlesInOrder()
    // The budget-ascending order puts the cheapest species first.
    expect(titles[0]).toBe('마다가스카르 휘파람 바퀴')
  })

  it('shows an inline reset chip when the URL carries an active query', async () => {
    const user = userEvent.setup()
    renderCatalog('/species?q=zzz-no-such-species')
    // No species matches → empty state, and the inline reset chip is offered.
    await screen.findByText('조건에 맞는 종을 찾지 못했어요.')
    // The inline chip carries a ✕ glyph, distinguishing it from the empty-state
    // button that shares the same label.
    const resetChip = screen.getByRole('button', { name: '필터 초기화 ✕' })

    await user.click(resetChip)

    await waitFor(() => {
      expect(screen.getByText('레오파드 게코')).toBeInTheDocument()
    })
  })
})
