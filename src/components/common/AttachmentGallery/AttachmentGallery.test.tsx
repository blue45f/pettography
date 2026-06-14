import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import AttachmentGallery from './AttachmentGallery'

import type { Attachment } from '@domains/attachments'

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const imageAttachment: Attachment = {
  id: 'att-1',
  kind: 'image',
  name: 'gecko.jpg',
  mimeType: 'image/jpeg',
  bytes: 1024,
  dataUrl: TINY_PNG,
  width: 1,
  height: 1,
}

const pdfAttachment: Attachment = {
  id: 'att-2',
  kind: 'pdf',
  name: 'caresheet.pdf',
  mimeType: 'application/pdf',
  bytes: 2048,
  dataUrl: 'data:application/pdf;base64,JVBERi0=',
}

describe('AttachmentGallery', () => {
  it('첨부가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<AttachmentGallery attachments={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('이미지를 인라인 썸네일로 렌더링한다', () => {
    render(<AttachmentGallery attachments={[imageAttachment]} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', TINY_PNG)
  })

  it('PDF는 다운로드 링크로 렌더링한다', () => {
    render(<AttachmentGallery attachments={[pdfAttachment]} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('download', 'caresheet.pdf')
    expect(link).toHaveAttribute('href', pdfAttachment.dataUrl)
  })

  it('이미지를 클릭하면 확대 모달이 열린다', async () => {
    const user = userEvent.setup()
    render(<AttachmentGallery attachments={[imageAttachment]} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2)
  })
})
