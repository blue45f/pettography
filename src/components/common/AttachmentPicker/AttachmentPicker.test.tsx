import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import AttachmentPicker from './AttachmentPicker'

import type { Attachment } from '@features/attachments'

const pdfAttachment: Attachment = {
  id: 'att-pdf',
  kind: 'pdf',
  name: 'vet-report.pdf',
  mimeType: 'application/pdf',
  bytes: 4096,
  dataUrl: 'data:application/pdf;base64,JVBERi0=',
}

describe('AttachmentPicker', () => {
  it('파일 입력과 용량 안내를 렌더링한다', () => {
    render(<AttachmentPicker attachments={[]} onChange={() => {}} />)
    expect(screen.getByLabelText(/첨부/)).toBeInTheDocument()
  })

  it('선택된 첨부를 목록으로 보여주고 제거할 수 있다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<AttachmentPicker attachments={[pdfAttachment]} onChange={onChange} />)

    expect(screen.getByText('vet-report.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /vet-report\.pdf/ }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('disabled면 파일 입력이 비활성화된다', () => {
    render(<AttachmentPicker attachments={[]} onChange={() => {}} disabled />)
    expect(screen.getByLabelText(/첨부/)).toBeDisabled()
  })
})
