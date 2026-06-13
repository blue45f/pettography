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
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import styles from './Contact.module.css'

const STATUS_BADGE: Record<string, 'warning' | 'primary' | 'success'> = {
  new: 'warning',
  'in-review': 'primary',
  resolved: 'success',
}

/** Older deep links used the previous local-form category ids. */
const LEGACY_CATEGORY_MAP: Record<string, InquiryCategory> = {
  general: 'contact',
  feature: 'question',
  safety: 'question',
  other: 'contact',
}

function resolveInitialCategory(raw: string | null): InquiryCategory {
  if (!raw) return 'contact'
  if ((INQUIRY_CATEGORIES as readonly string[]).includes(raw)) return raw as InquiryCategory
  return LEGACY_CATEGORY_MAP[raw] ?? 'contact'
}

function Contact() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('inquiry.title'))
  const [searchParams] = useSearchParams()

  const receipts = useInquiryStore((s) => s.receipts)
  const addReceipt = useInquiryStore((s) => s.addReceipt)

  const [latestReceipt, setLatestReceipt] = useState<StoredInquiryReceipt | null>(null)
  const [submitError, setSubmitError] = useState(false)

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
        originUrl: window.location.href,
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
    return (
      <Badge variant={STATUS_BADGE[status] ?? 'default'}>
        {status === 'new' ? t('inquiry.status.new') : status}
      </Badge>
    )
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
                ✅
              </span>
              <div>
                <h2 className={styles.receiptTitle}>{t('inquiry.receiptTitle')}</h2>
                <p className={styles.receiptDesc}>{t('inquiry.receiptDesc')}</p>
              </div>
            </div>
            <dl className={styles.receiptGrid}>
              <div className={styles.receiptRow}>
                <dt>{t('inquiry.receiptId')}</dt>
                <dd className={styles.receiptId}>{latestReceipt.id}</dd>
              </div>
              <div className={styles.receiptRow}>
                <dt>{t('inquiry.receiptStatus')}</dt>
                <dd>{statusBadge(latestReceipt.status)}</dd>
              </div>
              <div className={styles.receiptRow}>
                <dt>{t('inquiry.receiptAt')}</dt>
                <dd>{new Date(latestReceipt.createdAt).toLocaleString('ko')}</dd>
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
                  error={errors.contactEmail?.message ? t(errors.contactEmail.message) : undefined}
                  {...register('contactEmail')}
                />
              </div>
              <Input
                label={t('inquiry.titleLabel')}
                placeholder={t('inquiry.titlePlaceholder')}
                error={errors.title?.message ? t(errors.title.message) : undefined}
                {...register('title')}
              />
              <Textarea
                rows={6}
                label={t('inquiry.bodyLabel')}
                placeholder={t('inquiry.bodyPlaceholder')}
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
              {submitError && <p className={styles.submitError}>{t('inquiry.failed')}</p>}
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
                    {new Date(receipt.createdAt).toLocaleString('ko')} ·{' '}
                    <code className={styles.historyId}>{receipt.id.slice(0, 8)}</code>
                  </span>
                </div>
                {statusBadge(receipt.status)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

export default Contact
