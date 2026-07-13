import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  INQUIRY_CATEGORIES,
  inquiryFormSchema,
  submitInquiry,
  useInquiryStore,
  type InquiryCategory,
  type InquiryFormValues,
  type StoredInquiryReceipt,
} from '@domains/inquiry'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import styles from './Contact.module.css'

const STATUS_BADGE: Record<string, 'warning' | 'primary' | 'success'> = {
  new: 'warning',
  'in-review': 'primary',
  in_review: 'primary',
  resolved: 'success',
}

const STATUS_LABEL_KEY: Record<string, string> = {
  new: 'new',
  'in-review': 'inReview',
  in_review: 'inReview',
  resolved: 'resolved',
  closed: 'closed',
}

/** Older deep links used the previous local-form category ids. */
const LEGACY_CATEGORY_MAP: Record<string, InquiryCategory> = {
  general: 'contact',
  feature: 'question',
  safety: 'question',
  feedback: 'contact',
  usage: 'question',
  other: 'contact',
}

function resolveInitialCategory(raw: string | null): InquiryCategory {
  if (!raw) return 'contact'
  if ((INQUIRY_CATEGORIES as readonly string[]).includes(raw)) return raw as InquiryCategory
  return LEGACY_CATEGORY_MAP[raw] ?? 'contact'
}

function Contact() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('inquiry.title'))
  const [searchParams] = useSearchParams()

  const receipts = useInquiryStore((s) => s.receipts)
  const addReceipt = useInquiryStore((s) => s.addReceipt)
  const removeReceipt = useInquiryStore((s) => s.removeReceipt)

  const [latestReceipt, setLatestReceipt] = useState<StoredInquiryReceipt | null>(null)
  const [submitError, setSubmitError] = useState(false)
  const receiptHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (latestReceipt) receiptHeadingRef.current?.focus()
  }, [latestReceipt])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      category: resolveInitialCategory(searchParams.get('category')),
      title: '',
      body: '',
      contactEmail: '',
      website: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(false)
    try {
      const receipt = await submitInquiry({
        category: values.category,
        title: values.title,
        body: values.body,
        contactEmail: values.contactEmail?.trim() ? values.contactEmail.trim() : undefined,
        originUrl: globalThis.location.href,
        website: values.website ?? '',
      })
      const stored: StoredInquiryReceipt = {
        ...receipt,
        category: values.category,
        title: values.title,
      }
      addReceipt(stored)
      setLatestReceipt(stored)
      toast(t('inquiry.submittedToast'), 'success')
      reset({
        category: values.category,
        title: '',
        body: '',
        contactEmail: values.contactEmail,
        website: '',
      })
    } catch {
      setSubmitError(true)
      toast(t('inquiry.failed'), 'error')
    }
  })

  function statusBadge(status: string) {
    const labelKey = STATUS_LABEL_KEY[status]
    return (
      <Badge variant={STATUS_BADGE[status] ?? 'default'}>
        {labelKey ? t(`inquiry.status.${labelKey}`) : t('inquiry.status.unknown')}
      </Badge>
    )
  }

  const formatReceiptDate = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  }

  const copyReceiptId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      toast(t('inquiry.receiptCopied'), 'success')
    } catch {
      toast(t('inquiry.receiptCopyFailed'), 'error')
    }
  }

  const deleteLocalReceipt = (receipt: StoredInquiryReceipt) => {
    if (!globalThis.confirm(t('inquiry.removeReceiptConfirm', { title: receipt.title }))) return
    removeReceipt(receipt.id)
    if (latestReceipt?.id === receipt.id) setLatestReceipt(null)
    toast(t('inquiry.receiptRemovedToast'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('inquiry.title')}</h1>
        <p className={styles.subtitle}>{t('inquiry.subtitle')}</p>
      </header>

      {latestReceipt ? (
        <Card padding="lg" className={styles.receiptCard}>
          <Card.Body>
            <div className={styles.receiptHead}>
              <span className={styles.receiptIcon} aria-hidden="true">
                OK
              </span>
              <div>
                <h2 ref={receiptHeadingRef} className={styles.receiptTitle} tabIndex={-1}>
                  {t('inquiry.receiptTitle')}
                </h2>
                <p className={styles.receiptDesc}>{t('inquiry.receiptDesc')}</p>
              </div>
            </div>
            <dl className={styles.receiptGrid}>
              <div className={styles.receiptRow}>
                <dt>{t('inquiry.receiptId')}</dt>
                <dd className={styles.receiptValue}>
                  <code className={styles.receiptId}>{latestReceipt.id}</code>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => copyReceiptId(latestReceipt.id)}
                  >
                    {t('inquiry.copyReceiptId')}
                  </button>
                </dd>
              </div>
              <div className={styles.receiptRow}>
                <dt>{t('inquiry.receiptStatus')}</dt>
                <dd>{statusBadge(latestReceipt.status)}</dd>
              </div>
              <div className={styles.receiptRow}>
                <dt>{t('inquiry.receiptAt')}</dt>
                <dd>{formatReceiptDate(latestReceipt.createdAt)}</dd>
              </div>
            </dl>
            <div className={styles.receiptActions}>
              <Button type="button" variant="outline" onClick={() => setLatestReceipt(null)}>
                {t('inquiry.newInquiry')}
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card padding="lg" className={styles.formCard}>
          <Card.Body>
            <form onSubmit={onSubmit} className={styles.form} noValidate>
              <div className={styles.formRow}>
                <Select
                  label={t('inquiry.categoryLabel')}
                  options={INQUIRY_CATEGORIES.map((c) => ({
                    value: c,
                    label: t(`inquiry.categories.${c}`),
                  }))}
                  {...register('category')}
                />
                <Input
                  type="email"
                  label={t('inquiry.emailLabel')}
                  placeholder={t('inquiry.emailPlaceholder')}
                  maxLength={254}
                  autoComplete="email"
                  error={errors.contactEmail?.message ? t(errors.contactEmail.message) : undefined}
                  {...register('contactEmail')}
                />
              </div>
              <Input
                label={t('inquiry.titleLabel')}
                placeholder={t('inquiry.titlePlaceholder')}
                maxLength={140}
                error={errors.title?.message ? t(errors.title.message) : undefined}
                {...register('title')}
              />
              <Textarea
                rows={6}
                label={t('inquiry.bodyLabel')}
                placeholder={t('inquiry.bodyPlaceholder')}
                maxLength={4000}
                error={errors.body?.message ? t(errors.body.message) : undefined}
                {...register('body')}
              />
              {/* Honeypot: invisible to humans, bots fill it, server triages. */}
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="inquiry-website">Website</label>
                <input
                  id="inquiry-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register('website')}
                />
              </div>
              {submitError && (
                <p className={styles.submitError} role="alert">
                  {t('inquiry.failed')}
                </p>
              )}
              <p className={styles.privacyNote}>{t('inquiry.privacyNote')}</p>
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {t('inquiry.submit')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      <nav className={styles.channels} aria-label={t('inquiry.altTitle')}>
        <span className={styles.channelsLabel}>{t('inquiry.altTitle')}</span>
        <Link to="/forum" className={styles.channelLink}>
          {t('inquiry.channelForum')} →
        </Link>
        <Link to="/consult" className={styles.channelLink}>
          {t('inquiry.channelConsult')} →
        </Link>
        <Link to="/sos" className={styles.channelLink}>
          {t('inquiry.channelSos')} →
        </Link>
      </nav>

      {receipts.length > 0 && (
        <section aria-labelledby="inquiry-history-heading" className={styles.history}>
          <h2 id="inquiry-history-heading" className={styles.historyTitle}>
            {t('inquiry.historyTitle')}
          </h2>
          <ul className={styles.historyList}>
            {receipts.map((receipt) => (
              <li key={receipt.id} className={styles.historyItem}>
                <div className={styles.historyMeta}>
                  <strong className={styles.historyItemTitle}>{receipt.title}</strong>
                  <span className={styles.historySub}>
                    {t(`inquiry.categories.${receipt.category}`)} ·{' '}
                    {formatReceiptDate(receipt.createdAt)} ·{' '}
                    <code className={styles.historyId}>{receipt.id.slice(0, 8)}</code>
                  </span>
                </div>
                <div className={styles.historyActions}>
                  {statusBadge(receipt.status)}
                  <button
                    type="button"
                    className={styles.historyRemove}
                    onClick={() => deleteLocalReceipt(receipt)}
                    aria-label={t('inquiry.removeReceipt', { title: receipt.title })}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

export default Contact
