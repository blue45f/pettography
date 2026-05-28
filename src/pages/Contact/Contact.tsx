import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  CONTACT_CATEGORIES,
  contactFormSchema,
  useContactStore,
  type ContactCategory,
  type ContactFormValues,
} from '@features/contact'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Contact.module.css'

const STATUS_VARIANT: Record<string, 'warning' | 'primary' | 'success'> = {
  received: 'warning',
  'in-review': 'primary',
  resolved: 'success',
}

function Contact() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('contact.title'))

  const inquiries = useContactStore((s) => s.inquiries)
  const submit = useContactStore((s) => s.submit)
  const remove = useContactStore((s) => s.remove)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      category: 'general',
      name: '',
      email: '',
      subject: '',
      body: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    submit({ ...values, email: values.email ?? null })
    toast(t('contact.submittedToast'), 'success')
    reset({
      category: values.category,
      name: values.name,
      email: values.email,
      subject: '',
      body: '',
    })
  })

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{t('contact.title')}</h1>
        <p className={styles.subtitle}>{t('contact.subtitle')}</p>
        <div className={styles.categoryBadges}>
          {CONTACT_CATEGORIES.map((c) => (
            <span key={c} className={styles.categoryBadge}>
              {t(`contact.categories.${c}` as const)}
            </span>
          ))}
        </div>
      </header>

      <div className={styles.altRoutes} aria-labelledby="alt-routes-heading">
        <h2 id="alt-routes-heading" className={styles.formTitle}>
          {t('contact.altTitle')}
        </h2>
        <p className={styles.altDesc}>{t('contact.altHint')}</p>
        <div className={styles.altList}>
          <div className={styles.altItem}>
            <Link to="/forum" className={styles.altLabel}>
              {t('nav.forum')} →
            </Link>
            <span className={styles.altDesc}>{t('contact.altForum')}</span>
          </div>
          <div className={styles.altItem}>
            <Link to="/consult" className={styles.altLabel}>
              {t('nav.consult')} →
            </Link>
            <span className={styles.altDesc}>{t('contact.altConsult')}</span>
          </div>
          <div className={styles.altItem}>
            <Link to="/partners" className={styles.altLabel}>
              {t('nav.partners')} →
            </Link>
            <span className={styles.altDesc}>{t('contact.altPartners')}</span>
          </div>
          <div className={styles.altItem}>
            <Link to="/sos" className={styles.altLabel}>
              {t('nav.sos')} →
            </Link>
            <span className={styles.altDesc}>{t('contact.altSos')}</span>
          </div>
        </div>
      </div>

      <Card padding="lg" className={styles.formCard}>
        <Card.Body>
          <h2 className={styles.formTitle}>{t('contact.formTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('contact.categoryLabel')}
                options={CONTACT_CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`contact.categories.${c}` as const),
                }))}
                {...register('category')}
              />
              <Input
                label={t('contact.nameLabel')}
                placeholder={t('contact.namePlaceholder')}
                error={errors.name?.message ? t(errors.name.message) : undefined}
                {...register('name')}
              />
            </div>
            <Input
              type="email"
              label={t('contact.emailLabel')}
              placeholder={t('contact.emailPlaceholder')}
              error={errors.email?.message ? t(errors.email.message) : undefined}
              {...register('email')}
            />
            <Input
              label={t('contact.subjectLabel')}
              placeholder={t('contact.subjectPlaceholder')}
              error={errors.subject?.message ? t(errors.subject.message) : undefined}
              {...register('subject')}
            />
            <Textarea
              rows={6}
              label={t('contact.bodyLabel')}
              placeholder={t('contact.bodyPlaceholder')}
              error={errors.body?.message ? t(errors.body.message) : undefined}
              {...register('body')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('contact.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section aria-labelledby="recent-inquiries-heading">
        <h2 id="recent-inquiries-heading" className={styles.sectionTitle}>
          {t('contact.recentTitle')}
        </h2>
        {inquiries.length === 0 ? (
          <EmptyState icon="✉️" title={t('contact.empty')} description={t('contact.emptyHint')} />
        ) : (
          <ul className={styles.list}>
            {inquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Card padding="md">
                  <Card.Body>
                    <div className={styles.inquiryHeader}>
                      <strong>{inquiry.subject}</strong>
                      <Badge variant={STATUS_VARIANT[inquiry.status]}>
                        {t(`contact.status.${inquiry.status}` as const)}
                      </Badge>
                    </div>
                    <p className={styles.inquiryMeta}>
                      {t(`contact.categories.${inquiry.category as ContactCategory}` as const)} ·{' '}
                      {inquiry.name}
                      {inquiry.email ? ` (${inquiry.email})` : ''} ·{' '}
                      {new Date(inquiry.createdAt).toLocaleString('ko')}
                    </p>
                    <p className={styles.inquiryBody}>{inquiry.body}</p>
                    <div className={styles.inquiryActions}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          remove(inquiry.id)
                          toast(t('contact.removedToast'), 'success')
                        }}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Contact
