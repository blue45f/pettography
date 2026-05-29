import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Switch from '@components/common/Switch'
import { useToast } from '@components/common/Toast'
import {
  ALL_KIT_ITEM_IDS,
  categoryHint,
  KIT_ITEMS,
  kitContactFormSchema,
  kitProgress,
  groupProgress,
  useKitStore,
  type KitContactFormValues,
} from '@features/kit'
import { useOnboardingStore } from '@features/onboarding'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Kit.module.css'

function Kit() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('kit.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const checked = useKitStore((s) => s.checked)
  const contacts = useKitStore((s) => s.contacts)
  const toggleItem = useKitStore((s) => s.toggleItem)
  const addContact = useKitStore((s) => s.addContact)
  const removeContact = useKitStore((s) => s.removeContact)

  const overall = useMemo(() => kitProgress(checked, ALL_KIT_ITEM_IDS), [checked])
  const hintKey = useMemo(() => categoryHint(profile.category), [profile.category])

  const overallVariant = overall.pct === 100 ? 'success' : overall.pct >= 50 ? 'primary' : 'warning'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KitContactFormValues>({
    resolver: zodResolver(kitContactFormSchema),
    defaultValues: { label: '', phone: '', note: '' },
  })

  const onSubmit = handleSubmit((values) => {
    addContact({ label: values.label, phone: values.phone, note: values.note })
    toast(t('kit.contacts.added'), 'success')
    reset({ label: '', phone: '', note: '' })
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('kit.title')}</h1>
        <p className={styles.subtitle}>{t('kit.subtitle')}</p>
      </header>

      <Card padding="lg" className={styles.readinessCard}>
        <Card.Body>
          <div className={styles.readinessTop}>
            <div>
              <h2 className={styles.readinessTitle}>{t('kit.readiness.title')}</h2>
              <p className={styles.readinessDesc}>{t('kit.readiness.desc')}</p>
            </div>
            <div className={styles.readinessCount}>
              <span className={styles.readinessPct}>{overall.pct}%</span>
              <span className={styles.readinessFraction}>
                {t('kit.readiness.count', { done: overall.done, total: overall.total })}
              </span>
            </div>
          </div>
          <Progress
            value={overall.pct}
            variant={overallVariant}
            size="lg"
            label={t('kit.readiness.aria', { pct: overall.pct })}
          />
        </Card.Body>
      </Card>

      <div className={styles.quickRow}>
        <Link to="/sos" className={`${styles.quickLink} ${styles.quickSos}`}>
          <span className={styles.quickIcon} aria-hidden="true">
            🚨
          </span>
          <span className={styles.quickText}>
            <strong>{t('kit.quick.sosTitle')}</strong>
            <span>{t('kit.quick.sosDesc')}</span>
          </span>
          <span className={styles.quickArrow} aria-hidden="true">
            →
          </span>
        </Link>
        <Link to="/hospitals" className={`${styles.quickLink} ${styles.quickHospitals}`}>
          <span className={styles.quickIcon} aria-hidden="true">
            🏥
          </span>
          <span className={styles.quickText}>
            <strong>{t('kit.quick.hospitalsTitle')}</strong>
            <span>{t('kit.quick.hospitalsDesc')}</span>
          </span>
          <span className={styles.quickArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <Card padding="md" className={styles.hintCard}>
        <Card.Body className={styles.hintBody}>
          <span className={styles.hintIcon} aria-hidden="true">
            💡
          </span>
          <div>
            <p className={styles.hintLabel}>{t('kit.hintLabel')}</p>
            <p className={styles.hintText}>{t(hintKey)}</p>
          </div>
        </Card.Body>
      </Card>

      <section aria-labelledby="kit-checklist" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="kit-checklist" className={styles.sectionTitle}>
            {t('kit.checklist.title')}
          </h2>
          <p className={styles.sectionIntro}>{t('kit.checklist.intro')}</p>
        </header>

        <div className={styles.groups}>
          {KIT_ITEMS.map((group) => {
            const prog = groupProgress(checked, group.itemIds)
            return (
              <Card key={group.id} padding="lg" className={styles.groupCard}>
                <Card.Body>
                  <div className={styles.groupHeader}>
                    <h3 className={styles.groupTitle}>{t(`kit.groups.${group.id}`)}</h3>
                    <Badge variant={prog.pct === 100 ? 'success' : 'default'}>
                      {t('kit.readiness.count', { done: prog.done, total: prog.total })}
                    </Badge>
                  </div>
                  <Progress
                    value={prog.pct}
                    variant={prog.pct === 100 ? 'success' : 'primary'}
                    size="sm"
                    label={t('kit.readiness.aria', { pct: prog.pct })}
                  />
                  <ul className={styles.itemList}>
                    {group.itemIds.map((itemId) => {
                      const isChecked = Boolean(checked[itemId])
                      return (
                        <li
                          key={itemId}
                          className={`${styles.item} ${isChecked ? styles.itemChecked : ''}`}
                        >
                          <Switch
                            checked={isChecked}
                            onChange={() => toggleItem(itemId)}
                            label={t(`kit.items.${itemId}`)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </Card.Body>
              </Card>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="kit-contacts" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="kit-contacts" className={styles.sectionTitle}>
            {t('kit.contacts.title')}
          </h2>
          <p className={styles.sectionIntro}>{t('kit.contacts.intro')}</p>
        </header>

        <Card padding="lg">
          <Card.Body>
            <form onSubmit={onSubmit} className={styles.form} noValidate>
              <div className={styles.formRow}>
                <Input
                  label={t('kit.contacts.labelField')}
                  placeholder={t('kit.contacts.labelPlaceholder')}
                  maxLength={40}
                  error={errors.label?.message ? t(errors.label.message) : undefined}
                  {...register('label')}
                />
                <Input
                  type="tel"
                  inputMode="tel"
                  label={t('kit.contacts.phoneField')}
                  placeholder={t('kit.contacts.phonePlaceholder')}
                  maxLength={40}
                  error={errors.phone?.message ? t(errors.phone.message) : undefined}
                  {...register('phone')}
                />
              </div>
              <Input
                label={t('kit.contacts.noteField')}
                placeholder={t('kit.contacts.notePlaceholder')}
                maxLength={120}
                error={errors.note?.message ? t(errors.note.message) : undefined}
                {...register('note')}
              />
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {t('kit.contacts.add')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>

        {contacts.length === 0 ? (
          <EmptyState
            icon="📇"
            title={t('kit.contacts.emptyTitle')}
            description={t('kit.contacts.emptyDesc')}
          />
        ) : (
          <ul className={styles.contactList}>
            {contacts.map((contact) => (
              <li key={contact.id} className={styles.contactItem}>
                <div className={styles.contactBody}>
                  <p className={styles.contactLabel}>{contact.label}</p>
                  <a href={`tel:${contact.phone}`} className={styles.contactPhone}>
                    {contact.phone}
                  </a>
                  {contact.note && <p className={styles.contactNote}>{contact.note}</p>}
                </div>
                <div className={styles.contactActions}>
                  <a href={`tel:${contact.phone}`} className={styles.contactCall}>
                    {t('kit.contacts.call')}
                  </a>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeContact(contact.id)}
                  >
                    {t('kit.contacts.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={styles.disclaimer}>{t('kit.disclaimer')}</p>
    </section>
  )
}

export default Kit
