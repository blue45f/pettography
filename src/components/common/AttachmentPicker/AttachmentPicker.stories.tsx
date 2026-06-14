import { useState } from 'react'

import AttachmentPicker from './AttachmentPicker'

import type { Attachment } from '@domains/attachments'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<typeof AttachmentPicker> = {
  title: 'Common/AttachmentPicker',
  component: AttachmentPicker,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AttachmentPicker>

function InteractivePicker() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  return <AttachmentPicker attachments={attachments} onChange={setAttachments} />
}

export const Empty: Story = {
  render: () => <InteractivePicker />,
}

export const WithPendingPdf: Story = {
  args: {
    attachments: [
      {
        id: 'pdf-1',
        kind: 'pdf',
        name: 'vet-report.pdf',
        mimeType: 'application/pdf',
        bytes: 845_000,
        dataUrl: 'data:application/pdf;base64,JVBERi0=',
      },
    ],
    onChange: () => {},
  },
}
