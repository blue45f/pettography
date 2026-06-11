import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_COUNT,
  AttachmentRejectionError,
  fileToAttachment,
  type Attachment,
} from '@features/attachments'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './AttachmentPicker.module.css'

interface AttachmentPickerProps {
  attachments: readonly Attachment[]
  onChange: (next: Attachment[]) => void
  /** Surfaces translated rejection messages (toast or inline) at the call site. */
  onError?: (message: string) => void
  disabled?: boolean
}

function formatKb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

/**
 * Composer-side picker: validates, downsizes (≤1600px) and previews files
 * before the owning form persists them. Images become inline thumbnails,
 * PDFs a labelled chip — both removable while drafting.
 */
function AttachmentPicker({ attachments, onChange, onError, disabled }: AttachmentPickerProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()
  const [isProcessing, setIsProcessing] = useState(false)

  const remaining = ATTACHMENT_MAX_COUNT - attachments.length

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setIsProcessing(true)
    const accepted: Attachment[] = []
    try {
      for (const file of Array.from(fileList)) {
        try {
          const attachment = await fileToAttachment(file, attachments.length + accepted.length)
          accepted.push(attachment)
        } catch (error) {
          const reason = error instanceof AttachmentRejectionError ? error.reason : 'processFailed'
          onError?.(t(`attachments.errors.${reason}`, { name: file.name }))
        }
      }
    } finally {
      setIsProcessing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
    if (accepted.length > 0) onChange([...attachments, ...accepted])
  }

  function removeAt(id: string) {
    onChange(attachments.filter((a) => a.id !== id))
  }

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <label htmlFor={inputId} className={styles.label}>
          {t('attachments.label')}
        </label>
        <span className={styles.hint}>
          {t('attachments.hint', { count: ATTACHMENT_MAX_COUNT })}
        </span>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        className={styles.input}
        disabled={disabled || isProcessing || remaining <= 0}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {isProcessing && <p className={styles.processing}>{t('attachments.processing')}</p>}
      {attachments.length > 0 && (
        <ul className={styles.previewList}>
          {attachments.map((attachment) => (
            <li key={attachment.id} className={styles.previewItem}>
              {attachment.kind === 'image' ? (
                <img
                  src={attachment.dataUrl}
                  alt={t('attachments.imageAlt', { name: attachment.name })}
                  className={styles.thumb}
                />
              ) : (
                <span className={styles.pdfChip} aria-hidden="true">
                  PDF
                </span>
              )}
              <span className={styles.previewMeta}>
                <span className={styles.previewName}>{attachment.name}</span>
                <span className={styles.previewSize}>{formatKb(attachment.bytes)}</span>
              </span>
              <button
                type="button"
                className={styles.removeButton}
                aria-label={t('attachments.removeLabel', { name: attachment.name })}
                onClick={() => removeAt(attachment.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AttachmentPicker
