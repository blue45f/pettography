import Modal from '@components/common/Modal'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './AttachmentGallery.module.css'

import type { Attachment } from '@features/attachments'

interface AttachmentGalleryProps {
  attachments: readonly Attachment[]
}

/**
 * Read-side renderer for post attachments. Images show inline (same register
 * as gallery photos) and zoom in a modal; PDFs render as labelled download
 * chips because data-URL navigation is blocked in modern browsers.
 */
function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const { t } = useTranslation()
  const [openImage, setOpenImage] = useState<Attachment | null>(null)

  if (attachments.length === 0) return null

  const images = attachments.filter((a) => a.kind === 'image')
  const pdfs = attachments.filter((a) => a.kind === 'pdf')

  return (
    <div className={styles.root} aria-label={t('attachments.galleryLabel')}>
      {images.length > 0 && (
        <ul className={styles.imageGrid}>
          {images.map((attachment) => (
            <li key={attachment.id}>
              <button
                type="button"
                className={styles.imageButton}
                onClick={() => setOpenImage(attachment)}
              >
                <img
                  src={attachment.dataUrl}
                  alt={t('attachments.imageAlt', { name: attachment.name })}
                  loading="lazy"
                  width={attachment.width}
                  height={attachment.height}
                  className={styles.image}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {pdfs.length > 0 && (
        <ul className={styles.pdfList}>
          {pdfs.map((attachment) => (
            <li key={attachment.id}>
              <a href={attachment.dataUrl} download={attachment.name} className={styles.pdfLink}>
                <span className={styles.pdfBadge} aria-hidden="true">
                  PDF
                </span>
                {t('attachments.downloadPdf', { name: attachment.name })}
              </a>
            </li>
          ))}
        </ul>
      )}
      <Modal
        isOpen={openImage !== null}
        onClose={() => setOpenImage(null)}
        title={openImage?.name ?? t('attachments.previewTitle')}
        size="lg"
      >
        {openImage && (
          <img
            src={openImage.dataUrl}
            alt={t('attachments.imageAlt', { name: openImage.name })}
            className={styles.zoomImage}
          />
        )}
      </Modal>
    </div>
  )
}

export default AttachmentGallery
