import AttachmentGallery from './AttachmentGallery'

import type { Attachment } from '@features/attachments'
import type { Meta, StoryObj } from '@storybook/react-vite'

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const image = (id: string, name: string): Attachment => ({
  id,
  kind: 'image',
  name,
  mimeType: 'image/jpeg',
  bytes: 153_600,
  dataUrl: TINY_PNG,
  width: 1,
  height: 1,
})

const pdf: Attachment = {
  id: 'pdf-1',
  kind: 'pdf',
  name: 'caresheet.pdf',
  mimeType: 'application/pdf',
  bytes: 512_000,
  dataUrl: 'data:application/pdf;base64,JVBERi0=',
}

const meta: Meta<typeof AttachmentGallery> = {
  title: 'Common/AttachmentGallery',
  component: AttachmentGallery,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AttachmentGallery>

export const ImagesAndPdf: Story = {
  args: {
    attachments: [image('img-1', 'gecko-shed.jpg'), image('img-2', 'enclosure.jpg'), pdf],
  },
}

export const PdfOnly: Story = {
  args: { attachments: [pdf] },
}
