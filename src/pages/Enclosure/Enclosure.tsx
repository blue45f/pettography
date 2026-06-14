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
  resolvePetKey,
  useActivePetEnclosure,
  useEnclosureStore,
  verdict,
  type EnclosureFormValues,
} from '@features/enclosure'
import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Enclosure.module.css'

const DIM_KEYS = ['l', 'w', 'h'] as const
type DimKey = (typeof DIM_KEYS)[number]

function numberSetter(value: unknown): number {
  if (value === '' || value === null || value === undefined) return Number.NaN
  const n = Number(value)
  return Number.isFinite(n) ? n : Number.NaN
}

function Enclosure() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('enclosure.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const { data: speciesList = [] } = useSpeciesList({})
  const setCheck = useEnclosureStore((s) => s.setCheck)
  const saved = useActivePetEnclosure()

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId]
  )

  const min = useMemo(
    () => minEnclosure(activeSpecies?.slug ?? null, profile.category),
    [activeSpecies?.slug, profile.category]
  )

  const minLiters = useMemo(
    () => enclosureVolumeLiters(min.lengthCm, min.widthCm, min.heightCm),
    [min]
  )

  const form = useForm<EnclosureFormValues>({
    resolver: zodResolver(enclosureFormSchema),
    defaultValues: {
      lengthCm: saved?.lengthCm ?? Number.NaN,
      widthCm: saved?.widthCm ?? Number.NaN,
      heightCm: saved?.heightCm ?? Number.NaN,
    },
  })

  const watchedLength = useWatch({ control: form.control, name: 'lengthCm' })
  const watchedWidth = useWatch({ control: form.control, name: 'widthCm' })
  const watchedHeight = useWatch({ control: form.control, name: 'heightCm' })
  const current = useMemo(
    () => ({
      l: Number.isFinite(watchedLength) ? watchedLength : null,
      w: Number.isFinite(watchedWidth) ? watchedWidth : null,
      h: Number.isFinite(watchedHeight) ? watchedHeight : null,
    }),
    [watchedLength, watchedWidth, watchedHeight]
  )

  const minDims = useMemo(() => ({ l: min.lengthCm, w: min.widthCm, h: min.heightCm }), [min])
  const result = useMemo(() => verdict(current, minDims), [current, minDims])
  const shortfall = useMemo(() => meetsMinimum(current, minDims).shortfall, [current, minDims])
  const currentLiters = useMemo(
    () =>
      current.l !== null && current.w !== null && current.h !== null
        ? enclosureVolumeLiters(current.l, current.w, current.h)
        : null,
    [current]
  )

  const onSubmit = form.handleSubmit((values) => {
    const petKey = resolvePetKey(activePetId)
    setCheck(petKey, {
      speciesId: profile.speciesId ?? null,
      lengthCm: values.lengthCm,
      widthCm: values.widthCm,
      heightCm: values.heightCm,
    })
    toast(t('enclosure.saved'), 'success')
  })

  const verdictVariant: 'success' | 'warning' | 'default' =
    result === 'adequate' ? 'success' : result === 'upgrade' ? 'warning' : 'default'

  const dimLabel: Record<DimKey, string> = {
    l: t('enclosure.length'),
    w: t('enclosure.width'),
    h: t('enclosure.height'),
  }
  const dimMin: Record<DimKey, number> = { l: min.lengthCm, w: min.widthCm, h: min.heightCm }
  const dimCurrent: Record<DimKey, number | null> = { l: current.l, w: current.w, h: current.h }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('enclosure.title')}</h1>
        <p className={styles.subtitle}>{t('enclosure.subtitle')}</p>
      </header>

      <div className={styles.context}>
        {activeSpecies ? (
          <>
            <span className={styles.contextEmoji} aria-hidden="true">
              {activeSpecies.heroEmoji}
            </span>
            <div className={styles.contextText}>
              <span className={styles.contextName}>
                {profile.petName?.trim()
                  ? `${profile.petName.trim()} · ${activeSpecies.koreanName}`
                  : activeSpecies.koreanName}
              </span>
              <span className={styles.contextMeta}>
                {t('enclosure.basis.species', { name: activeSpecies.koreanName })}
              </span>
            </div>
          </>
        ) : (
          <>
            <span className={styles.contextEmoji} aria-hidden="true">
              🐾
            </span>
            <div className={styles.contextText}>
              <span className={styles.contextName}>{t('enclosure.noSpeciesTitle')}</span>
              <span className={styles.contextMeta}>
                {profile.category
                  ? t('enclosure.basis.category', {
                      category: t(`enclosure.categories.${profile.category}`),
                    })
                  : t('enclosure.basis.default')}
              </span>
            </div>
          </>
        )}
      </div>

      <Card padding="lg">
        <Card.Body>
          <div className={styles.minHead}>
            <h2 className={styles.cardTitle}>{t('enclosure.recommendedTitle')}</h2>
            <Badge variant={min.source === 'species' ? 'primary' : 'default'}>
              {min.source === 'species'
                ? t('enclosure.badge.speciesMin')
                : t('enclosure.badge.categoryMin')}
            </Badge>
          </div>
          <p className={styles.minDims}>
            {min.lengthCm} × {min.widthCm} × {min.heightCm} {t('enclosure.cm')}
          </p>
          <p className={styles.minLiters}>{t('enclosure.approxLiters', { liters: minLiters })}</p>
          <p className={styles.ruleNote}>{t(`enclosure.rules.${min.rule}`)}</p>
        </Card.Body>
      </Card>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.cardTitle}>{t('enclosure.currentTitle')}</h2>
          <p className={styles.helpText}>{t('enclosure.currentHelp')}</p>
          <form onSubmit={onSubmit} className={styles.dimForm} noValidate>
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              label={t('enclosure.length')}
              error={
                form.formState.errors.lengthCm?.message
                  ? t(form.formState.errors.lengthCm.message)
                  : undefined
              }
              {...form.register('lengthCm', { setValueAs: numberSetter })}
            />
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              label={t('enclosure.width')}
              error={
                form.formState.errors.widthCm?.message
                  ? t(form.formState.errors.widthCm.message)
                  : undefined
              }
              {...form.register('widthCm', { setValueAs: numberSetter })}
            />
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              label={t('enclosure.height')}
              error={
                form.formState.errors.heightCm?.message
                  ? t(form.formState.errors.heightCm.message)
                  : undefined
              }
              {...form.register('heightCm', { setValueAs: numberSetter })}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {t('enclosure.save')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <Card padding="lg" className={styles.verdictCard}>
        <Card.Body>
          <div className={styles.verdictHead}>
            <h2 className={styles.cardTitle}>{t('enclosure.verdictTitle')}</h2>
            <Badge variant={verdictVariant}>{t(`enclosure.verdict.${result}`)}</Badge>
          </div>

          {result === 'unknown' ? (
            <p className={styles.verdictMsg}>{t('enclosure.verdict.unknownHint')}</p>
          ) : (
            <p className={styles.verdictMsg}>
              {result === 'adequate'
                ? t('enclosure.verdict.adequateMsg')
                : t('enclosure.verdict.upgradeMsg')}
            </p>
          )}

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
              {DIM_KEYS.map((d) => {
                const cur = dimCurrent[d]
                const short = shortfall[d]
                return (
                  <tr key={d}>
                    <th scope="row">{dimLabel[d]}</th>
                    <td className={styles.numCell}>
                      {cur === null ? '—' : `${cur} ${t('enclosure.cm')}`}
                    </td>
                    <td className={styles.numCell}>
                      {dimMin[d]} {t('enclosure.cm')}
                    </td>
                    <td>
                      {cur === null ? (
                        <span className={styles.statusMuted}>—</span>
                      ) : short ? (
                        <Badge variant="warning">{t('enclosure.short')}</Badge>
                      ) : (
                        <Badge variant="success">{t('enclosure.ok')}</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {currentLiters !== null && (
            <p className={styles.volumeRow}>
              {t('enclosure.yourVolume', { liters: currentLiters })}
            </p>
          )}

          <p className={styles.floorNote}>{t('enclosure.floorNote')}</p>
        </Card.Body>
      </Card>
    </section>
  )
}

export default Enclosure
