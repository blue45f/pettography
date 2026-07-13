import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import { useToast } from '@components/common/Toast'
import {
  enclosureFormSchema,
  enclosureVolumeLiters,
  meetsMinimum,
  minEnclosure,
  useActivePetEnclosure,
  useEnclosureStore,
  verdict,
  type EnclosureFormValues,
} from '@domains/enclosure'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Enclosure.module.css'

const DIM_KEYS = ['l', 'w', 'h'] as const
type DimKey = (typeof DIM_KEYS)[number]

function numberSetter(value: unknown): number {
  if (value === '' || value === null || value === undefined) return Number.NaN
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function Enclosure() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('enclosure.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: speciesList = [] } = useSpeciesList({})
  const setCheck = useEnclosureStore((state) => state.setCheck)
  const resetCheck = useEnclosureStore((state) => state.reset)
  const saved = useActivePetEnclosure()

  const activeSpecies = useMemo(
    () => speciesList.find((species) => species.id === profile.speciesId) ?? null,
    [profile.speciesId, speciesList]
  )
  const reference = useMemo(
    () => minEnclosure(activeSpecies?.slug ?? null, profile.category),
    [activeSpecies?.slug, profile.category]
  )
  const referenceLiters = useMemo(
    () => enclosureVolumeLiters(reference.lengthCm, reference.widthCm, reference.heightCm),
    [reference]
  )

  const form = useForm<EnclosureFormValues>({
    resolver: zodResolver(enclosureFormSchema),
    defaultValues: {
      lengthCm: saved?.lengthCm ?? Number.NaN,
      widthCm: saved?.widthCm ?? Number.NaN,
      heightCm: saved?.heightCm ?? Number.NaN,
    },
  })
  const resetForm = form.reset

  useEffect(() => {
    resetForm({
      lengthCm: saved?.lengthCm ?? Number.NaN,
      widthCm: saved?.widthCm ?? Number.NaN,
      heightCm: saved?.heightCm ?? Number.NaN,
    })
  }, [activePetId, resetForm, saved?.heightCm, saved?.lengthCm, saved?.widthCm])

  const watchedLength = useWatch({ control: form.control, name: 'lengthCm' })
  const watchedWidth = useWatch({ control: form.control, name: 'widthCm' })
  const watchedHeight = useWatch({ control: form.control, name: 'heightCm' })
  const current = useMemo(
    () => ({
      l: Number.isFinite(watchedLength) ? watchedLength : null,
      w: Number.isFinite(watchedWidth) ? watchedWidth : null,
      h: Number.isFinite(watchedHeight) ? watchedHeight : null,
    }),
    [watchedHeight, watchedLength, watchedWidth]
  )
  const referenceDims = useMemo(
    () => ({ l: reference.lengthCm, w: reference.widthCm, h: reference.heightCm }),
    [reference]
  )
  const result = useMemo(() => verdict(current, referenceDims), [current, referenceDims])
  const shortfall = useMemo(
    () => meetsMinimum(current, referenceDims).shortfall,
    [current, referenceDims]
  )
  const currentLiters = useMemo(
    () =>
      current.l !== null && current.w !== null && current.h !== null
        ? enclosureVolumeLiters(current.l, current.w, current.h)
        : null,
    [current]
  )

  const onSubmit = form.handleSubmit((values) => {
    if (!activePetId) return
    setCheck(activePetId, {
      speciesId: profile.speciesId ?? null,
      lengthCm: values.lengthCm,
      widthCm: values.widthCm,
      heightCm: values.heightCm,
    })
    toast(t('enclosure.saved'), 'success')
  })

  function handleReset() {
    if (!activePetId || !window.confirm(t('enclosure.resetConfirm'))) return
    resetCheck(activePetId)
    resetForm({ lengthCm: Number.NaN, widthCm: Number.NaN, heightCm: Number.NaN })
    toast(t('enclosure.resetDone'), 'info')
  }

  const dimensionLabel: Record<DimKey, string> = {
    l: t('enclosure.length'),
    w: t('enclosure.width'),
    h: t('enclosure.height'),
  }
  const referenceByDimension: Record<DimKey, number> = {
    l: reference.lengthCm,
    w: reference.widthCm,
    h: reference.heightCm,
  }
  const currentByDimension: Record<DimKey, number | null> = current

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('enclosure.eyebrow')}</p>
          <h1>{t('enclosure.title')}</h1>
          <p className={styles.subtitle}>{t('enclosure.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🏡
            </span>
            <h2>{t('enclosure.petRequiredTitle')}</h2>
            <p>{t('enclosure.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('enclosure.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('enclosure.eyebrow')}</p>
        <h1>{t('enclosure.title')}</h1>
        <p className={styles.subtitle}>{t('enclosure.subtitle')}</p>
      </header>

      <div className={styles.context}>
        <span className={styles.contextEmoji} aria-hidden="true">
          {activeSpecies?.heroEmoji ?? '🐾'}
        </span>
        <div className={styles.contextText}>
          <span className={styles.contextName}>
            {profile.petName?.trim() || activeSpecies?.koreanName || t('enclosure.aPet')}
          </span>
          <span className={styles.contextMeta}>
            {activeSpecies
              ? t('enclosure.basis.species', { name: activeSpecies.koreanName })
              : t('enclosure.basis.category', {
                  category: profile.category
                    ? t(`enclosure.categories.${profile.category}`)
                    : t('enclosure.categories.unknown'),
                })}
          </span>
        </div>
      </div>

      <Alert variant="warning" title={t('enclosure.referenceWarningTitle')}>
        {t('enclosure.referenceWarningBody')}
      </Alert>

      <div className={styles.workspace}>
        <Card padding="lg" className={styles.referenceCard}>
          <Card.Body>
            <div className={styles.cardHead}>
              <div>
                <p className={styles.sectionKicker}>{t('enclosure.referenceKicker')}</p>
                <h2 className={styles.cardTitle}>{t('enclosure.recommendedTitle')}</h2>
              </div>
              <Badge variant={reference.source === 'species' ? 'primary' : 'default'}>
                {reference.source === 'species'
                  ? t('enclosure.badge.speciesMin')
                  : t('enclosure.badge.categoryMin')}
              </Badge>
            </div>
            <p className={styles.referenceDims}>
              {reference.lengthCm} × {reference.widthCm} × {reference.heightCm} {t('enclosure.cm')}
            </p>
            <p className={styles.referenceLiters}>
              {t('enclosure.approxLiters', { liters: referenceLiters })}
            </p>
            <p className={styles.ruleNote}>{t(`enclosure.rules.${reference.rule}`)}</p>
          </Card.Body>
        </Card>

        <Card padding="lg">
          <Card.Body>
            <p className={styles.sectionKicker}>{t('enclosure.measureKicker')}</p>
            <h2 className={styles.cardTitle}>{t('enclosure.currentTitle')}</h2>
            <p className={styles.helpText}>{t('enclosure.currentHelp')}</p>
            <form onSubmit={onSubmit} className={styles.dimForm} noValidate>
              {DIM_KEYS.map((dimension) => {
                const fieldName =
                  dimension === 'l' ? 'lengthCm' : dimension === 'w' ? 'widthCm' : 'heightCm'
                const fieldError = form.formState.errors[fieldName]
                return (
                  <Input
                    key={dimension}
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="1"
                    max="2000"
                    label={dimensionLabel[dimension]}
                    error={fieldError?.message ? t(fieldError.message) : undefined}
                    {...form.register(fieldName, { setValueAs: numberSetter })}
                  />
                )
              })}
              <div className={styles.formActions}>
                {saved && (
                  <Button type="button" variant="outline" onClick={handleReset}>
                    {t('enclosure.reset')}
                  </Button>
                )}
                <Button type="submit" variant="primary">
                  {t('enclosure.save')}
                </Button>
              </div>
            </form>
            {saved && (
              <p className={styles.savedAt}>
                {t('enclosure.savedAt', {
                  date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'ko-KR', {
                    dateStyle: 'medium',
                  }).format(new Date(saved.updatedAt)),
                })}
              </p>
            )}
          </Card.Body>
        </Card>
      </div>

      <div aria-live="polite">
        <Card padding="lg" className={styles.verdictCard}>
          <Card.Body>
            <div className={styles.cardHead}>
              <div>
                <p className={styles.sectionKicker}>{t('enclosure.compareKicker')}</p>
                <h2 className={styles.cardTitle}>{t('enclosure.verdictTitle')}</h2>
              </div>
              <Badge
                variant={
                  result === 'adequate' ? 'primary' : result === 'upgrade' ? 'warning' : 'default'
                }
              >
                {t(`enclosure.verdict.${result}`)}
              </Badge>
            </div>
            <p className={styles.verdictMsg}>
              {result === 'unknown'
                ? t('enclosure.verdict.unknownHint')
                : result === 'adequate'
                  ? t('enclosure.verdict.adequateMsg')
                  : t('enclosure.verdict.upgradeMsg')}
            </p>

            <div className={styles.tableScroll}>
              <table className={styles.compareTable}>
                <thead>
                  <tr>
                    <th scope="col">{t('enclosure.dimension')}</th>
                    <th scope="col">{t('enclosure.yourSize')}</th>
                    <th scope="col">{t('enclosure.minSize')}</th>
                    <th scope="col">{t('enclosure.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DIM_KEYS.map((dimension) => {
                    const value = currentByDimension[dimension]
                    return (
                      <tr key={dimension}>
                        <th scope="row">{dimensionLabel[dimension]}</th>
                        <td className={styles.numCell}>
                          {value === null ? '—' : `${value} ${t('enclosure.cm')}`}
                        </td>
                        <td className={styles.numCell}>
                          {referenceByDimension[dimension]} {t('enclosure.cm')}
                        </td>
                        <td>
                          {value === null ? (
                            <span className={styles.statusMuted}>—</span>
                          ) : shortfall[dimension] ? (
                            <Badge variant="warning">{t('enclosure.short')}</Badge>
                          ) : (
                            <Badge variant="default">{t('enclosure.ok')}</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {currentLiters !== null && (
              <p className={styles.volumeRow}>
                {t('enclosure.yourVolume', { liters: currentLiters })}
              </p>
            )}
            <p className={styles.floorNote}>{t('enclosure.floorNote')}</p>
          </Card.Body>
        </Card>
      </div>
    </section>
  )
}

export default Enclosure
