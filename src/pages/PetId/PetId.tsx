import Button from '@components/common/Button'
import Input from '@components/common/Input'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import {
  isCardComplete,
  petIdSchema,
  useActivePetIdCard,
  usePetIdStore,
  type PetIdValues,
} from '@domains/petid'
import { useSpecies } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './PetId.module.css'

function PetId() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('petid.title'))

  const card = useActivePetIdCard()
  const save = usePetIdStore((s) => s.save)
  const clear = usePetIdStore((s) => s.clear)
  const profile = useOnboardingStore((s) => s.profile)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)

  const form = useForm<PetIdValues>({
    resolver: zodResolver(petIdSchema),
    defaultValues: card,
  })

  useEffect(() => {
    form.reset(card)
  }, [card, form])

  const onSubmit = form.handleSubmit((values) => {
    save(values)
    toast(t('petid.savedToast'), 'success')
  })

  function fillFromOnboarding() {
    if (!species) return
    form.setValue('speciesLabel', `${species.koreanName} (${species.scientificName})`)
    form.setValue('region', profile.location?.label ?? '')
  }

  function handleClear() {
    clear()
    form.reset({
      petName: '',
      speciesLabel: '',
      ownerName: '',
      ownerPhone: '',
      region: '',
      registrationNumber: '',
      distinctMarks: '',
      foundInstructions: '',
    })
  }

  const watched = useWatch({ control: form.control })
  const previewValues = { ...card, ...watched } as PetIdValues
  const complete = isCardComplete(previewValues)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('petid.title')}</h1>
        <p className={styles.subtitle}>{t('petid.subtitle')}</p>
      </header>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.formActions}>
            {species && (
              <Button type="button" variant="ghost" onClick={fillFromOnboarding}>
                {t('petid.fillFromOnboarding')}
              </Button>
            )}
          </div>

          <Input
            label={t('petid.fields.petName')}
            placeholder={t('petid.placeholders.petName')}
            error={
              form.formState.errors.petName?.message
                ? t(form.formState.errors.petName.message)
                : undefined
            }
            {...form.register('petName')}
          />
          <Input
            label={t('petid.fields.speciesLabel')}
            placeholder={t('petid.placeholders.speciesLabel')}
            error={
              form.formState.errors.speciesLabel?.message
                ? t(form.formState.errors.speciesLabel.message)
                : undefined
            }
            {...form.register('speciesLabel')}
          />
          <Input
            label={t('petid.fields.ownerName')}
            error={
              form.formState.errors.ownerName?.message
                ? t(form.formState.errors.ownerName.message)
                : undefined
            }
            {...form.register('ownerName')}
          />
          <Input
            label={t('petid.fields.ownerPhone')}
            type="tel"
            placeholder="010-0000-0000"
            error={
              form.formState.errors.ownerPhone?.message
                ? t(form.formState.errors.ownerPhone.message)
                : undefined
            }
            {...form.register('ownerPhone')}
          />
          <Input
            label={t('petid.fields.region')}
            placeholder={t('petid.placeholders.region')}
            error={
              form.formState.errors.region?.message
                ? t(form.formState.errors.region.message)
                : undefined
            }
            {...form.register('region')}
          />
          <Input
            label={t('petid.fields.registrationNumber')}
            placeholder={t('petid.placeholders.registrationNumber')}
            error={
              form.formState.errors.registrationNumber?.message
                ? t(form.formState.errors.registrationNumber.message)
                : undefined
            }
            {...form.register('registrationNumber')}
          />
          <Textarea
            label={t('petid.fields.distinctMarks')}
            placeholder={t('petid.placeholders.distinctMarks')}
            rows={2}
            maxLength={240}
            error={
              form.formState.errors.distinctMarks?.message
                ? t(form.formState.errors.distinctMarks.message)
                : undefined
            }
            {...form.register('distinctMarks')}
          />
          <Textarea
            label={t('petid.fields.foundInstructions')}
            placeholder={t('petid.placeholders.foundInstructions')}
            rows={2}
            maxLength={240}
            error={
              form.formState.errors.foundInstructions?.message
                ? t(form.formState.errors.foundInstructions.message)
                : undefined
            }
            {...form.register('foundInstructions')}
          />

          <div className={styles.formFooter}>
            <Button type="submit" variant="primary">
              {t('petid.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear}>
              {t('petid.clear')}
            </Button>
          </div>
        </form>

        <aside className={styles.previewSide}>
          <p className={styles.previewHint}>{t('petid.previewHint')}</p>
          <article className={styles.card} aria-label={t('petid.title')} data-print="petid-card">
            <header className={styles.cardHeader}>
              <span aria-hidden="true" className={styles.cardEmoji}>
                🐾
              </span>
              <div>
                <p className={styles.cardEyebrow}>{t('petid.cardEyebrow')}</p>
                <p className={styles.cardBrand}>Pettography</p>
              </div>
            </header>

            <div className={styles.cardBody}>
              <div className={styles.cardRow}>
                <p className={styles.cardLabel}>{t('petid.fields.petName')}</p>
                <p className={styles.cardValuePrimary}>
                  {previewValues.petName || t('petid.placeholders.petName')}
                </p>
              </div>
              <div className={styles.cardRow}>
                <p className={styles.cardLabel}>{t('petid.fields.speciesLabel')}</p>
                <p className={styles.cardValue}>
                  {previewValues.speciesLabel || t('petid.placeholders.speciesLabel')}
                </p>
              </div>
              <div className={styles.cardGrid}>
                <div>
                  <p className={styles.cardLabel}>{t('petid.fields.ownerName')}</p>
                  <p className={styles.cardValue}>{previewValues.ownerName || '—'}</p>
                </div>
                <div>
                  <p className={styles.cardLabel}>{t('petid.fields.ownerPhone')}</p>
                  {previewValues.ownerPhone ? (
                    <a
                      href={`tel:${previewValues.ownerPhone.replace(/[^0-9+]/g, '')}`}
                      className={styles.cardPhone}
                    >
                      {previewValues.ownerPhone}
                    </a>
                  ) : (
                    <p className={styles.cardValue}>—</p>
                  )}
                </div>
              </div>
              {previewValues.region && (
                <div className={styles.cardRow}>
                  <p className={styles.cardLabel}>{t('petid.fields.region')}</p>
                  <p className={styles.cardValue}>{previewValues.region}</p>
                </div>
              )}
              {previewValues.registrationNumber && (
                <div className={styles.cardRow}>
                  <p className={styles.cardLabel}>{t('petid.fields.registrationNumber')}</p>
                  <p className={styles.cardValueMono}>{previewValues.registrationNumber}</p>
                </div>
              )}
              {previewValues.distinctMarks && (
                <div className={styles.cardRow}>
                  <p className={styles.cardLabel}>{t('petid.fields.distinctMarks')}</p>
                  <p className={styles.cardValue}>{previewValues.distinctMarks}</p>
                </div>
              )}
              {previewValues.foundInstructions && (
                <div className={styles.cardRowEmphasis}>
                  <p className={styles.cardLabel}>{t('petid.fields.foundInstructions')}</p>
                  <p className={styles.cardValue}>{previewValues.foundInstructions}</p>
                </div>
              )}
            </div>

            <footer className={styles.cardFooter}>
              <p>{t('petid.cardFooter')}</p>
            </footer>
          </article>

          <Button
            type="button"
            variant="primary"
            disabled={!complete}
            onClick={() => window.print()}
          >
            {t('petid.print')}
          </Button>
          {!complete && <p className={styles.requiredHint}>{t('petid.requiredHint')}</p>}
        </aside>
      </div>
    </section>
  )
}

export default PetId
