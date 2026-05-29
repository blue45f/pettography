import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  clutchFormSchema,
  clutchStatusLabelCode,
  daysUntil,
  estimateHatchWindow,
  fertilityRate,
  incubationProgress,
  incubationRef,
  pairingFormSchema,
  useActivePetClutches,
  useActivePetPairings,
  useBreedingStore,
  type Clutch,
  type ClutchFormValues,
  type ClutchStatusCode,
  type Pairing,
  type PairingFormValues,
} from '@features/breeding'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies, useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Breeding.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_BADGE: Record<
  ClutchStatusCode,
  'default' | 'primary' | 'success' | 'warning' | 'error'
> = {
  incubating: 'primary',
  due: 'warning',
  overdue: 'error',
  hatched: 'success',
  failed: 'default',
}

const PROGRESS_VARIANT: Record<ClutchStatusCode, 'primary' | 'success' | 'warning' | 'error'> = {
  incubating: 'primary',
  due: 'warning',
  overdue: 'error',
  hatched: 'success',
  failed: 'error',
}

function Breeding() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('breeding.title'))

  const today = todayIso()
  const profile = useOnboardingStore((s) => s.profile)
  const { data: activeSpecies } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const pairings = useActivePetPairings()
  const clutches = useActivePetClutches()
  const addPairing = useBreedingStore((s) => s.addPairing)
  const removePairing = useBreedingStore((s) => s.removePairing)
  const addClutch = useBreedingStore((s) => s.addClutch)
  const updateClutchStatus = useBreedingStore((s) => s.updateClutchStatus)
  const removeClutch = useBreedingStore((s) => s.removeClutch)

  const clutchFormRef = useRef<HTMLDivElement>(null)

  /** Resolve an internal speciesId (sp-…) to its slug for the reference table. */
  function slugFor(speciesId: string | null | undefined): string | null {
    if (!speciesId) return null
    return speciesList.find((s) => s.id === speciesId)?.slug ?? null
  }

  /** A friendly emoji + Korean name for a species id, with a safe fallback. */
  function speciesLabel(speciesId: string | null | undefined): { name: string; emoji: string } {
    const sp = speciesId ? speciesList.find((s) => s.id === speciesId) : undefined
    return { name: sp?.koreanName ?? t('breeding.speciesUnknown'), emoji: sp?.heroEmoji ?? '🥚' }
  }

  function pairingLabel(pairingId: string | null): string {
    if (!pairingId) return t('breeding.clutch.noPairing')
    const p = pairings.find((x) => x.id === pairingId)
    if (!p) return t('breeding.clutch.noPairing')
    const sire = p.sireName.trim() || t('breeding.unknownParent')
    const dam = p.damName.trim() || t('breeding.unknownParent')
    return `${sire} × ${dam}`
  }

  // ── Pairing form ───────────────────────────────────────────────
  const pairingForm = useForm<PairingFormValues>({
    resolver: zodResolver(pairingFormSchema),
    defaultValues: { sireName: '', damName: '', pairedAt: today, notes: '' },
  })

  const onCreatePairing = pairingForm.handleSubmit((values) => {
    addPairing({
      speciesId: profile.speciesId,
      sireName: values.sireName?.trim() ?? '',
      damName: values.damName?.trim() ?? '',
      pairedAt: values.pairedAt,
      notes: values.notes?.trim() ?? '',
    })
    toast(t('breeding.pairing.created'), 'success')
    pairingForm.reset({ sireName: '', damName: '', pairedAt: today, notes: '' })
  })

  // ── Clutch form ────────────────────────────────────────────────
  const clutchForm = useForm<ClutchFormValues>({
    resolver: zodResolver(clutchFormSchema),
    defaultValues: {
      pairingId: '',
      laidAt: today,
      eggCount: 1,
      fertileCount: null,
      incubationTempC: null,
      notes: '',
    },
  })

  const onCreateClutch = clutchForm.handleSubmit((values) => {
    const linkedPairing = values.pairingId
      ? pairings.find((p) => p.id === values.pairingId)
      : undefined
    addClutch({
      pairingId: values.pairingId || null,
      // Prefer the linked pairing's species, falling back to the active pet's.
      speciesId: linkedPairing?.speciesId ?? profile.speciesId,
      laidAt: values.laidAt,
      eggCount: values.eggCount,
      fertileCount: values.fertileCount ?? null,
      incubationTempC: values.incubationTempC ?? null,
      notes: values.notes?.trim() ?? '',
    })
    toast(t('breeding.clutch.created'), 'success')
    clutchForm.reset({
      pairingId: '',
      laidAt: today,
      eggCount: 1,
      fertileCount: null,
      incubationTempC: null,
      notes: '',
    })
  })

  /** Prefill the clutch form from a pairing and scroll it into view. */
  function startClutchFor(pairing: Pairing) {
    clutchForm.setValue('pairingId', pairing.id, { shouldDirty: true })
    clutchFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const numberSetter = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(v)
    return Number.isFinite(num) ? num : null
  }

  const pairingOptions = [
    { value: '', label: t('breeding.clutch.noPairing') },
    ...pairings.map((p) => ({ value: p.id, label: pairingLabel(p.id) })),
  ]

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('breeding.title')}</h1>
        <p className={styles.subtitle}>{t('breeding.subtitle')}</p>
        {activeSpecies && (
          <span className={styles.speciesChip}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {activeSpecies.koreanName}
          </span>
        )}
      </header>

      <Link to="/genetics" className={styles.geneticsLink}>
        <span className={styles.geneticsLinkText}>
          <span className={styles.geneticsLinkTitle}>{t('breeding.geneticsCta.title')}</span>
          <span className={styles.geneticsLinkDesc}>{t('breeding.geneticsCta.desc')}</span>
        </span>
        <span className={styles.geneticsLinkArrow} aria-hidden="true">
          →
        </span>
      </Link>

      {/* ── Pairings ─────────────────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('breeding.pairing.title')}</h2>
        <p className={styles.sectionIntro}>{t('breeding.pairing.intro')}</p>

        <Card padding="lg">
          <Card.Body>
            <h3 className={styles.formTitle}>{t('breeding.pairing.newTitle')}</h3>
            <form onSubmit={onCreatePairing} className={styles.form} noValidate>
              <div className={styles.formRow}>
                <Input
                  label={t('breeding.pairing.sire')}
                  placeholder={t('breeding.pairing.sirePlaceholder')}
                  error={
                    pairingForm.formState.errors.sireName?.message
                      ? t(pairingForm.formState.errors.sireName.message)
                      : undefined
                  }
                  {...pairingForm.register('sireName')}
                />
                <Input
                  label={t('breeding.pairing.dam')}
                  placeholder={t('breeding.pairing.damPlaceholder')}
                  error={
                    pairingForm.formState.errors.damName?.message
                      ? t(pairingForm.formState.errors.damName.message)
                      : undefined
                  }
                  {...pairingForm.register('damName')}
                />
                <Input
                  type="date"
                  label={t('breeding.pairing.pairedAt')}
                  error={
                    pairingForm.formState.errors.pairedAt?.message
                      ? t(pairingForm.formState.errors.pairedAt.message)
                      : undefined
                  }
                  {...pairingForm.register('pairedAt')}
                />
              </div>
              <Textarea
                label={t('breeding.notes')}
                rows={2}
                helperText={t('breeding.notesOptional')}
                error={
                  pairingForm.formState.errors.notes?.message
                    ? t(pairingForm.formState.errors.notes.message)
                    : undefined
                }
                {...pairingForm.register('notes')}
              />
              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={pairingForm.formState.isSubmitting}
                >
                  {t('breeding.pairing.add')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>

        {pairings.length === 0 ? (
          <EmptyState
            icon="💞"
            title={t('breeding.pairing.emptyTitle')}
            description={t('breeding.pairing.emptyDesc')}
            headingLevel={3}
          />
        ) : (
          <ul className={styles.pairingList}>
            {pairings.map((pairing) => {
              const sp = speciesLabel(pairing.speciesId)
              const sire = pairing.sireName.trim() || t('breeding.unknownParent')
              const dam = pairing.damName.trim() || t('breeding.unknownParent')
              return (
                <li key={pairing.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.pairingHeader}>
                        <div>
                          <div className={styles.pairingNames}>
                            {sire}
                            <span className={styles.pairingCross} aria-hidden="true">
                              ×
                            </span>
                            {dam}
                          </div>
                          <div className={styles.pairingMeta}>
                            <Badge variant="default">
                              <span aria-hidden="true">{sp.emoji}</span> {sp.name}
                            </Badge>
                            <span>
                              {t('breeding.pairing.pairedOn')} {pairing.pairedAt}
                            </span>
                          </div>
                        </div>
                        <div className={styles.pairingActions}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startClutchFor(pairing)}
                          >
                            {t('breeding.pairing.addClutch')}
                          </Button>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => removePairing(pairing.id)}
                          >
                            {t('breeding.remove')}
                          </button>
                        </div>
                      </div>
                      {pairing.notes.trim() && (
                        <p className={styles.pairingNotes}>{pairing.notes}</p>
                      )}
                    </Card.Body>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Clutches / Incubation ────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('breeding.clutch.title')}</h2>
        <p className={styles.sectionIntro}>{t('breeding.clutch.intro')}</p>

        <div ref={clutchFormRef}>
          <Card padding="lg">
            <Card.Body>
              <h3 className={styles.formTitle}>{t('breeding.clutch.newTitle')}</h3>
              <form onSubmit={onCreateClutch} className={styles.form} noValidate>
                <Select
                  label={t('breeding.clutch.pairing')}
                  options={pairingOptions}
                  {...clutchForm.register('pairingId')}
                />
                <div className={styles.formRow}>
                  <Input
                    type="date"
                    label={t('breeding.clutch.laidAt')}
                    error={
                      clutchForm.formState.errors.laidAt?.message
                        ? t(clutchForm.formState.errors.laidAt.message)
                        : undefined
                    }
                    {...clutchForm.register('laidAt')}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="1"
                    label={t('breeding.clutch.eggCount')}
                    error={
                      clutchForm.formState.errors.eggCount?.message
                        ? t(clutchForm.formState.errors.eggCount.message)
                        : undefined
                    }
                    {...clutchForm.register('eggCount', { setValueAs: numberSetter })}
                  />
                </div>
                <div className={styles.formRow}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    label={t('breeding.clutch.fertileCount')}
                    helperText={t('breeding.clutch.fertileHelper')}
                    error={
                      clutchForm.formState.errors.fertileCount?.message
                        ? t(clutchForm.formState.errors.fertileCount.message)
                        : undefined
                    }
                    {...clutchForm.register('fertileCount', { setValueAs: numberSetter })}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    label={t('breeding.clutch.temp')}
                    helperText={t('breeding.clutch.tempHelper')}
                    error={
                      clutchForm.formState.errors.incubationTempC?.message
                        ? t(clutchForm.formState.errors.incubationTempC.message)
                        : undefined
                    }
                    {...clutchForm.register('incubationTempC', { setValueAs: numberSetter })}
                  />
                </div>
                <Textarea
                  label={t('breeding.notes')}
                  rows={2}
                  helperText={t('breeding.notesOptional')}
                  error={
                    clutchForm.formState.errors.notes?.message
                      ? t(clutchForm.formState.errors.notes.message)
                      : undefined
                  }
                  {...clutchForm.register('notes')}
                />
                <div className={styles.formActions}>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={clutchForm.formState.isSubmitting}
                  >
                    {t('breeding.clutch.add')}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>

        {clutches.length === 0 ? (
          <EmptyState
            icon="🥚"
            title={t('breeding.clutch.emptyTitle')}
            description={t('breeding.clutch.emptyDesc')}
            headingLevel={3}
          />
        ) : (
          <ul className={styles.clutchGrid}>
            {clutches.map((clutch) => (
              <li key={clutch.id}>
                <ClutchCard
                  clutch={clutch}
                  slug={slugFor(clutch.speciesId)}
                  today={today}
                  species={speciesLabel(clutch.speciesId)}
                  pairingText={pairingLabel(clutch.pairingId)}
                  onHatched={() => {
                    updateClutchStatus(clutch.id, 'hatched')
                    toast(t('breeding.clutch.markedHatched'), 'success')
                  }}
                  onFailed={() => {
                    updateClutchStatus(clutch.id, 'failed')
                    toast(t('breeding.clutch.markedFailed'), 'info')
                  }}
                  onRemove={() => removeClutch(clutch.id)}
                />
              </li>
            ))}
          </ul>
        )}

        <p className={styles.disclaimer}>{t('breeding.disclaimer')}</p>
      </div>
    </section>
  )
}

interface ClutchCardProps {
  clutch: Clutch
  slug: string | null
  today: string
  species: { name: string; emoji: string }
  pairingText: string
  onHatched: () => void
  onFailed: () => void
  onRemove: () => void
}

function ClutchCard({
  clutch,
  slug,
  today,
  species,
  pairingText,
  onHatched,
  onFailed,
  onRemove,
}: ClutchCardProps) {
  const { t } = useTranslation()
  const code = clutchStatusLabelCode(clutch, today, slug)
  const window = estimateHatchWindow(clutch.laidAt, slug)
  const progress = incubationProgress(clutch.laidAt, slug, today)
  const ref = incubationRef(slug)
  const fertility = fertilityRate(clutch)
  const isActive = clutch.status === 'incubating'

  // Days to the midpoint hatch estimate; only meaningful while incubating.
  const ddays = daysUntil(window.midpoint, today)
  const ddayLabel =
    ddays > 0 ? `D-${ddays}` : ddays === 0 ? t('breeding.dday.today') : `D+${Math.abs(ddays)}`

  return (
    <Card padding="md">
      <Card.Body>
        <div className={styles.clutchTop}>
          <span className={styles.clutchSpecies}>
            <span aria-hidden="true">{species.emoji}</span> {species.name}
          </span>
          <Badge variant={STATUS_BADGE[code]}>{t(`breeding.statusCode.${code}`)}</Badge>
        </div>

        {isActive && (
          <div className={styles.statBlock}>
            <span className={styles.dday}>{ddayLabel}</span>{' '}
            <span className={styles.ddaySub}>{t('breeding.dday.sub')}</span>
          </div>
        )}

        <div className={styles.statBlock}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t('breeding.clutch.eggCount')}</span>
            <span className={styles.statValue}>
              {t('breeding.clutch.eggUnit', { count: clutch.eggCount })}
            </span>
          </div>
          {fertility !== null && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>{t('breeding.clutch.fertility')}</span>
              <span className={styles.statValue}>
                {Math.round(fertility)}% ({clutch.fertileCount}/{clutch.eggCount})
              </span>
            </div>
          )}
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t('breeding.clutch.laidAt')}</span>
            <span className={styles.statValue}>{clutch.laidAt}</span>
          </div>
          {clutch.incubationTempC !== null && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>{t('breeding.clutch.temp')}</span>
              <span className={styles.statValue}>{clutch.incubationTempC}°C</span>
            </div>
          )}
          {clutch.pairingId && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>{t('breeding.clutch.fromPairing')}</span>
              <span className={styles.statValue}>{pairingText}</span>
            </div>
          )}
        </div>

        <div className={styles.progressWrap}>
          <Progress value={progress} variant={PROGRESS_VARIANT[code]} size="sm" />
          <span className={styles.ddaySub}>
            {t('breeding.clutch.progressLabel', { pct: Math.round(progress) })}
          </span>
        </div>

        <p className={styles.window}>
          {t('breeding.clutch.windowLabel')}{' '}
          <span className={styles.windowDates}>
            {window.earliest} ~ {window.latest}
          </span>
        </p>

        {ref.tdsd && <p className={styles.tdsdNote}>{t('breeding.tdsdNote')}</p>}
        <p className={styles.refNote}>{ref.note}</p>

        {clutch.notes.trim() && <p className={styles.clutchNotes}>{clutch.notes}</p>}

        <div className={styles.clutchControls}>
          {isActive ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onHatched}>
                {t('breeding.clutch.markHatched')}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onFailed}>
                {t('breeding.clutch.markFailed')}
              </Button>
            </>
          ) : (
            <span className={styles.ddaySub}>{t(`breeding.statusCode.${code}`)}</span>
          )}
          <button type="button" className={styles.removeButton} onClick={onRemove}>
            {t('breeding.remove')}
          </button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default Breeding
