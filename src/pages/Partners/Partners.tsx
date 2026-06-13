import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  partnerFormSchema,
  usePartnersStore,
  type PartnerFormValues,
  type PartnerKind,
} from '@domains/partners'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Partners.module.css'

const KINDS: readonly PartnerKind[] = ['shop', 'hospital', 'treat-shop'] as const

function Partners() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('partners.title'))

  const applications = usePartnersStore((s) => s.applications)
  const apply = usePartnersStore((s) => s.apply)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      kind: 'shop',
      name: '',
      contact: '',
      region: '',
      description: '',
      url: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    apply({ ...values, url: values.url || null })
    toast(t('partners.submittedToast'), 'success')
    reset({ kind: values.kind, name: '', contact: '', region: '', description: '', url: '' })
  })

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{t('partners.title')}</h1>
        <p className={styles.subtitle}>{t('partners.subtitle')}</p>
        <div className={styles.kindBadges}>
          {KINDS.map((kind) => (
            <span key={kind} className={styles.kindBadge}>
              {t(`partners.kinds.${kind}`)}
            </span>
          ))}
        </div>
      </header>

      <Card padding="lg" className={styles.formCard}>
        <Card.Body>
          <h2 className={styles.formTitle}>{t('partners.formTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('partners.kindLabel')}
                options={KINDS.map((k) => ({
                  value: k,
                  label: t(`partners.kinds.${k}`),
                }))}
                {...register('kind')}
              />
              <Input
                label={t('partners.nameLabel')}
                placeholder={t('partners.namePlaceholder')}
                error={errors.name?.message ? t(errors.name.message) : undefined}
                {...register('name')}
              />
            </div>
            <div className={styles.formRow}>
              <Input
                label={t('partners.contactLabel')}
                placeholder={t('partners.contactPlaceholder')}
                error={errors.contact?.message ? t(errors.contact.message) : undefined}
                {...register('contact')}
              />
              <Input
                label={t('partners.regionLabel')}
                placeholder={t('partners.regionPlaceholder')}
                error={errors.region?.message ? t(errors.region.message) : undefined}
                {...register('region')}
              />
            </div>
            <Input
              type="url"
              label={t('partners.urlLabel')}
              placeholder="https://"
              error={errors.url?.message ? t(errors.url.message) : undefined}
              {...register('url')}
            />
            <Textarea
              rows={4}
              label={t('partners.descriptionLabel')}
              placeholder={t('partners.descriptionPlaceholder')}
              error={errors.description?.message ? t(errors.description.message) : undefined}
              {...register('description')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('partners.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section aria-labelledby="recent-applications-heading" className={styles.recent}>
        <h2 id="recent-applications-heading" className={styles.sectionTitle}>
          {t('partners.recentTitle')}
        </h2>
        <ul className={styles.list}>
          {applications.slice(0, 5).map((a) => (
            <li key={a.id}>
              <Card padding="md">
                <Card.Body>
                  <div className={styles.recentHeader}>
                    <strong>{a.name}</strong>
                    <Badge
                      variant={
                        a.status === 'approved'
                          ? 'success'
                          : a.status === 'rejected'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {t(`partners.status.${a.status}`)}
                    </Badge>
                  </div>
                  <p className={styles.recentMeta}>
                    {t(`partners.kinds.${a.kind}`)} · {a.region}
                  </p>
                  <p className={styles.recentBody}>{a.description}</p>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default Partners
