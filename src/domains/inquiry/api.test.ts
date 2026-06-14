import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INQUIRY_ENDPOINT, submitInquiry } from './api'

const fetchMock = vi.fn()

const receipt = {
  id: '11d89008-0648-412f-9997-c22e101d663b',
  status: 'new',
  createdAt: '2026-06-11T08:10:27.392Z',
}

function mockCreated(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('submitInquiry', () => {
  it('targets the TermsDesk public inquiries endpoint for the pettography slug', () => {
    expect(INQUIRY_ENDPOINT).toBe('https://termsdesk.vercel.app/api/public/pettography/inquiries')
  })

  it('posts the payload (honeypot verbatim, no empty contactEmail) and parses the receipt', async () => {
    fetchMock.mockResolvedValue(mockCreated({ ...receipt, siteSlug: 'pettography' }))

    const result = await submitInquiry({
      category: 'question',
      title: '게코 사육 질문',
      body: '레오파드 게코 사육 온도 관련 질문드립니다. 열원 배치가 궁금합니다.',
      originUrl: 'https://pettography.vercel.app/contact',
      website: '',
    })

    expect(result).toEqual(receipt)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(INQUIRY_ENDPOINT)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body).toMatchObject({
      category: 'question',
      title: '게코 사육 질문',
      originUrl: 'https://pettography.vercel.app/contact',
      website: '',
    })
    expect(body).not.toHaveProperty('contactEmail')
  })

  it('includes contactEmail when provided', async () => {
    fetchMock.mockResolvedValue(mockCreated(receipt))

    await submitInquiry({
      category: 'bug',
      title: '다크모드 버그',
      body: '다크모드에서 배지 대비가 깨집니다. 재현 경로를 첨부합니다.',
      contactEmail: 'reporter@example.com',
      originUrl: 'https://pettography.vercel.app/contact',
      website: '',
    })

    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)) as Record<
      string,
      unknown
    >
    expect(body.contactEmail).toBe('reporter@example.com')
  })

  it('throws on non-2xx responses', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429 }))

    await expect(
      submitInquiry({
        category: 'contact',
        title: '문의',
        body: '열 글자 이상 본문입니다.',
        originUrl: 'https://pettography.vercel.app/contact',
        website: '',
      })
    ).rejects.toThrow('HTTP error! status: 429')
  })

  it('throws when the receipt fails validation', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue(mockCreated({ ok: true }))

    await expect(
      submitInquiry({
        category: 'qa',
        title: '검수 요청',
        body: '품질 검수 관련 문의 본문입니다.',
        originUrl: 'https://pettography.vercel.app/contact',
        website: '',
      })
    ).rejects.toThrow('TermsDesk inquiry receipt failed validation')
    consoleError.mockRestore()
  })
})
