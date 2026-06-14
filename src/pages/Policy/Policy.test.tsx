import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Policy from './Policy'

const fetchMock = vi.fn()

const FULL_HASH = 'a1b2c3d4e5f6071829304152637485960718293041526374859607182930415'

const termsPayload = {
  policySlug: 'terms-of-service',
  name: '이용약관',
  type: 'terms',
  locale: 'ko',
  versionLabel: 'v3',
  contentHash: FULL_HASH,
  body: '제1조 (목적)\n이 약관은 이용 조건을 정합니다.\n\n- 케어 가이드\n- 병원·샵 정보',
  effectiveAt: '2026-06-08T00:00:00.000Z',
  publishedAt: '2026-06-08T00:00:00.000Z',
  changeSummary: 'TermsDesk 중앙 게시본으로 이전',
}

const privacyPayload = {
  ...termsPayload,
  policySlug: 'privacy-policy',
  name: '개인정보처리방침',
  type: 'privacy',
}

function mockOk(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function renderPolicy(path: '/terms' | '/privacy') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Policy />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Policy', () => {
  it('shows a loading skeleton while the document is fetched', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderPolicy('/terms')

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('renders the terms document from the TermsDesk public API', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    // 본문: 조문 헤딩 + 문단 + 불릿 리스트
    expect(
      await screen.findByRole('heading', { level: 2, name: '제1조 (목적)' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://termsdesk.vercel.app/api/public/pettography/policies/terms-of-service'
    )
    expect(screen.getByText('이 약관은 이용 조건을 정합니다.')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('케어 가이드')).toBeInTheDocument()
  })

  it('surfaces version, truncated content hash and effective date as a trust footer', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    expect(await screen.findByText('v3')).toBeInTheDocument()
    expect(screen.getByText(FULL_HASH.slice(0, 12))).toBeInTheDocument()
    expect(screen.queryByText(FULL_HASH)).not.toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('fetches the privacy policy when mounted on /privacy', async () => {
    fetchMock.mockImplementation(() => mockOk(privacyPayload))
    renderPolicy('/privacy')

    expect(
      await screen.findByRole('heading', { level: 1, name: '개인정보처리방침' })
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://termsdesk.vercel.app/api/public/pettography/policies/privacy-policy'
    )
  })

  it('falls back to a TermsDesk link card on error and recovers via retry', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() => new Response('{}', { status: 503 }))
    renderPolicy('/terms')

    expect(await screen.findByText('문서를 불러오지 못했습니다')).toBeInTheDocument()

    const fallbackLink = screen.getByRole('link', { name: /TermsDesk에서 원문 보기/ })
    expect(fallbackLink).toHaveAttribute(
      'href',
      'https://termsdesk.vercel.app/p/pettography/terms-of-service'
    )

    fetchMock.mockImplementation(() => mockOk(termsPayload))
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: '제1조 (목적)' })).toBeInTheDocument()
    )
  })

  it('cross-links the sibling policy as an internal route', async () => {
    fetchMock.mockImplementation(() => mockOk(termsPayload))
    renderPolicy('/terms')

    await screen.findByRole('heading', { level: 2, name: '제1조 (목적)' })

    expect(screen.getByRole('link', { name: /개인정보처리방침/ })).toHaveAttribute(
      'href',
      '/privacy'
    )
  })
})
