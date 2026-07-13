import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Progress from '@components/common/Progress'
import Skeleton from '@components/common/Skeleton'
import { useToast } from '@components/common/Toast'
import { LOCATION_PRESETS, findPreset } from '@domains/location'
import {
  isOnboardingComplete,
  ONBOARDING_STEPS,
  useOnboardingStore,
  type OnboardingProfile,
  type OnboardingStep,
} from '@domains/onboarding'
import { isRegulated } from '@domains/registry'
import { SPECIES_CATEGORIES, useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import styles from './Onboarding.module.css'

import type { SpeciesCategory } from '@domains/species'

const NICKNAME_ADJECTIVES = [
  '귀여운',
  '용감한',
  '얌전한',
  '소중한',
  '활기찬',
  '차분한',
  '똑똑한',
  '시크한',
  '눈부신',
  '호기심많은',
  '듬직한',
  '포근한',
  '신비로운',
  '명랑한',
  '느긋한',
]

const NICKNAME_NOUNS: Record<string, string[]> = {
  reptile: ['게코', '카멜레온', '이구아나', '비어디', '모니터', '거북이', '콘스네이크'],
  amphibian: ['팩맨', '우파루파', '뉴트', '청개구리', '다트프로그', '샐러맨더'],
  arthropod: ['타란튤라', '전갈', '사마귀', '사슴벌레', '장수풍뎅이', '지네'],
  mammal: ['슈가글라이더', '페렛', '친칠라', '고슴도치', '햄스터', '마우스'],
  bird: ['왕관앵무', '사랑앵무', '카나리아', '문조', '핀치', '올빼미', '매'],
}

function generateRandomNickname(category?: string | null): string {
  const adjs = NICKNAME_ADJECTIVES
  const adj = adjs[Math.floor(Math.random() * adjs.length)]
  const cat = category && NICKNAME_NOUNS[category] ? category : 'reptile'
  const nouns = NICKNAME_NOUNS[cat] || NICKNAME_NOUNS.reptile
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}

function getInitialStep(profile: OnboardingProfile): OnboardingStep {
  if (isOnboardingComplete(profile)) return 'review'
  if (!profile.category) return 'category'
  if (!profile.speciesId) return 'species'
  if (!profile.location) return 'location'
  return 'review'
}

function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  useDocumentTitle(t('onboarding.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const setCategory = useOnboardingStore((s) => s.setCategory)
  const setSpecies = useOnboardingStore((s) => s.setSpecies)
  const setLocation = useOnboardingStore((s) => s.setLocation)
  const setPetName = useOnboardingStore((s) => s.setPetName)
  const complete = useOnboardingStore((s) => s.complete)

  const [step, setStep] = useState<OnboardingStep>(() => getInitialStep(profile))
  const [locating, setLocating] = useState(false)
  const [petNameDraft, setPetNameDraft] = useState(profile.petName ?? '')
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const hasMountedRef = useRef(false)

  const stepIndex = ONBOARDING_STEPS.indexOf(step)
  const progressValue = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100

  const speciesQuery = useSpeciesList(profile.category ? { category: profile.category } : {})
  const speciesList = speciesQuery.data ?? []

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    stepHeadingRef.current?.focus()
  }, [step])

  function isStepAvailable(candidate: OnboardingStep): boolean {
    const candidateIndex = ONBOARDING_STEPS.indexOf(candidate)
    if (candidateIndex === 0) return true
    if (candidateIndex === 1) return Boolean(profile.category)
    return Boolean(profile.category && profile.speciesId)
  }

  function goNext() {
    const next = ONBOARDING_STEPS[stepIndex + 1]
    if (next && isStepAvailable(next)) setStep(next)
  }

  function goBack() {
    const prev = ONBOARDING_STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  function handleSelectCategory(category: SpeciesCategory) {
    setCategory(category)
    setStep('species')
  }

  function handleSelectSpecies(speciesId: string) {
    setSpecies(speciesId)
    setStep('location')
  }

  function handleSelectPreset(presetId: string, advance = false) {
    const preset = findPreset(presetId)
    if (!preset) return
    setLocation({
      label: preset.label,
      presetId: preset.id,
      lat: preset.coords.lat,
      lng: preset.coords.lng,
    })
    if (advance) setStep('review')
  }

  function handleUseCurrent() {
    if (!('geolocation' in navigator)) {
      toast(t('onboarding.currentFailed'), 'error')
      handleSelectPreset('songpa')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          label: t('onboarding.useCurrent'),
          presetId: null,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setLocating(false)
        setStep('review')
      },
      () => {
        toast(t('onboarding.currentFailed'), 'error')
        handleSelectPreset('songpa', true)
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    )
  }

  function handleFinish() {
    if (!profile.location) {
      handleSelectPreset('songpa')
    }
    setPetName(petNameDraft)
    complete()
    toast(t('onboarding.finish'), 'success')
    navigate('/dashboard')
  }

  function handleReset() {
    setStep('category')
  }

  const reviewLocationLabel =
    profile.location?.label ?? t('onboarding.presetLabel') + ': ' + LOCATION_PRESETS[0].label

  return (
    <section className={styles.onboarding}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {t('onboarding.stepIndicator', {
            current: stepIndex + 1,
            total: ONBOARDING_STEPS.length,
          })}
        </p>
        <h1 className={styles.title}>{t('onboarding.title')}</h1>
        <p className={styles.description}>{t('onboarding.description')}</p>
        <Progress value={progressValue} max={100} className={styles.progress} />
        <nav className={styles.stepBar} aria-label={t('onboarding.title')}>
          {ONBOARDING_STEPS.map((s, idx) => (
            <button
              key={s}
              type="button"
              className={[
                styles.stepChip,
                s === step ? styles.stepChipActive : '',
                idx < stepIndex ? styles.stepChipDone : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (isStepAvailable(s)) setStep(s)
              }}
              disabled={!isStepAvailable(s)}
              aria-current={s === step ? 'step' : undefined}
            >
              {idx + 1}. {t(`onboarding.steps.${s}`)}
            </button>
          ))}
        </nav>
      </header>

      {step === 'category' && (
        <div className={styles.stepBody} aria-labelledby="onboarding-category-heading">
          <h2
            id="onboarding-category-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className={styles.stepTitle}
          >
            {t('onboarding.categoryTitle')}
          </h2>
          <p className={styles.stepHint}>{t('onboarding.categoryHint')}</p>
          <div className={styles.grid} role="group" aria-label={t('onboarding.categoryTitle')}>
            {SPECIES_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={profile.category === category}
                className={[
                  styles.cardOption,
                  profile.category === category ? styles.cardSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectCategory(category)}
              >
                <span className={styles.cardTitle}>{t(`categories.${category}`)}</span>
                <span className={styles.cardDesc}>{t(`categories.${category}Desc`)}</span>
                <span className={styles.optionCta} aria-hidden="true">
                  {profile.category === category
                    ? `✓ ${t('common.done')}`
                    : `${t('common.next')} →`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'species' && (
        <div className={styles.stepBody} aria-labelledby="onboarding-species-heading">
          <h2
            id="onboarding-species-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className={styles.stepTitle}
          >
            {t('onboarding.speciesTitle')}
          </h2>
          <p className={styles.stepHint}>{t('onboarding.speciesHint')}</p>
          {!profile.category && (
            <p className={styles.warning}>{t('onboarding.errors.selectCategory')}</p>
          )}
          {speciesQuery.isLoading && <Skeleton variant="rectangular" height={160} lines={3} />}
          {speciesQuery.isError && (
            <EmptyState
              variant="discover"
              icon="⚠️"
              title={t('common.error')}
              description={t('common.loadErrorHint')}
            />
          )}
          {!speciesQuery.isError && (
            <div className={styles.grid} role="group" aria-label={t('onboarding.speciesTitle')}>
              {speciesList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={profile.speciesId === s.id}
                  className={[
                    styles.cardOption,
                    profile.speciesId === s.id ? styles.cardSelected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelectSpecies(s.id)}
                >
                  <div className={styles.speciesHeader}>
                    <span className={styles.heroEmoji} aria-hidden="true">
                      {s.heroEmoji}
                    </span>
                    <div>
                      <span className={styles.cardTitle}>{s.koreanName}</span>
                      <span className={styles.scientific}>{s.scientificName}</span>
                    </div>
                  </div>
                  <span className={styles.cardDesc}>{s.summary}</span>
                  <div className={styles.badgeRow}>
                    <Badge variant="primary">{t(`difficulty.${s.difficulty}`)}</Badge>
                    {s.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className={styles.optionCta} aria-hidden="true">
                    {profile.speciesId === s.id
                      ? `✓ ${t('common.done')}`
                      : `${t('species.selectThis')} →`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'location' && (
        <div className={styles.stepBody} aria-labelledby="onboarding-location-heading">
          <h2
            id="onboarding-location-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className={styles.stepTitle}
          >
            {t('onboarding.locationTitle')}
          </h2>
          <p className={styles.stepHint}>{t('onboarding.locationHint')}</p>
          <div className={styles.locationActions}>
            <Button variant="primary" onClick={handleUseCurrent} isLoading={locating}>
              {locating ? t('onboarding.currentDetecting') : t('onboarding.useCurrent')}
            </Button>
          </div>
          <h3 className={styles.subTitle}>{t('onboarding.presetLabel')}</h3>
          <div
            className={`${styles.grid} ${styles.locationGrid}`}
            role="group"
            aria-label={t('onboarding.presetLabel')}
          >
            {LOCATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={profile.location?.presetId === preset.id}
                className={[
                  styles.cardOption,
                  styles.locationOption,
                  profile.location?.presetId === preset.id ? styles.cardSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelectPreset(preset.id, true)}
              >
                <span className={styles.cardTitle}>{preset.label}</span>
                <span className={styles.optionCta} aria-hidden="true">
                  {profile.location?.presetId === preset.id
                    ? `✓ ${t('common.done')}`
                    : `${t('common.next')} →`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className={styles.stepBody} aria-labelledby="onboarding-review-heading">
          <h2
            id="onboarding-review-heading"
            ref={stepHeadingRef}
            tabIndex={-1}
            className={styles.stepTitle}
          >
            {t('onboarding.reviewTitle')}
          </h2>
          <Card padding="lg">
            <Card.Body>
              <label className={styles.petNameLabel} htmlFor="onboarding-pet-name">
                {t('onboarding.petNameLabel')}
              </label>
              <div className={styles.petNameRow}>
                <input
                  id="onboarding-pet-name"
                  type="text"
                  maxLength={40}
                  placeholder={t('onboarding.petNamePlaceholder')}
                  value={petNameDraft}
                  onChange={(e) => setPetNameDraft(e.target.value)}
                  onBlur={() => setPetName(petNameDraft)}
                  className={styles.petNameInput}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    const name = generateRandomNickname(profile.category)
                    setPetNameDraft(name)
                    setPetName(name)
                    toast(t('onboarding.suggestedToast', { name }), 'info')
                  }}
                >
                  {t('onboarding.randomNameButton')}
                </Button>
              </div>
              <dl className={styles.summary}>
                <div className={styles.summaryRow}>
                  <dt>{t('onboarding.reviewCategory')}</dt>
                  <dd>
                    {profile.category
                      ? t(`categories.${profile.category}`)
                      : t('onboarding.errors.selectCategory')}
                  </dd>
                </div>
                <div className={styles.summaryRow}>
                  <dt>{t('onboarding.reviewSpecies')}</dt>
                  <dd>
                    {profile.speciesId
                      ? (speciesList.find((s) => s.id === profile.speciesId)?.koreanName ??
                        profile.speciesId)
                      : t('onboarding.errors.selectSpecies')}
                  </dd>
                </div>
                <div className={styles.summaryRow}>
                  <dt>{t('onboarding.reviewLocation')}</dt>
                  <dd>{reviewLocationLabel}</dd>
                </div>
              </dl>
            </Card.Body>
          </Card>
          {isRegulated(profile.category) && (
            <Card padding="lg" className={styles.registryHint}>
              <Card.Body>
                <p className={styles.registryHintEyebrow}>
                  {t('onboarding.registryNoticeEyebrow')}
                </p>
                <h3 className={styles.registryHintTitle}>{t('onboarding.registryNoticeTitle')}</h3>
                <p className={styles.registryHintBody}>{t('onboarding.registryNoticeBody')}</p>
                <Link to="/registry" className={styles.registryHintLink}>
                  {t('onboarding.registryNoticeCta')} →
                </Link>
              </Card.Body>
            </Card>
          )}
          <div className={styles.finishRow}>
            <Button variant="ghost" onClick={handleReset}>
              {t('onboarding.restart')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinish}
              disabled={!profile.category || !profile.speciesId}
            >
              {t('onboarding.finish')}
            </Button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
          {t('common.back')}
        </Button>
        {step !== 'review' && (
          <Button
            variant="outline"
            onClick={goNext}
            disabled={
              (step === 'category' && !profile.category) ||
              (step === 'species' && !profile.speciesId) ||
              (step === 'location' && locating)
            }
          >
            {t('common.next')}
          </Button>
        )}
      </footer>

      {isOnboardingComplete(profile) && (
        <p className={styles.savedNote}>
          {t('onboarding.savedAt')}: {new Date(profile.completedAt ?? '').toLocaleString()}
        </p>
      )}
    </section>
  )
}

export default Onboarding
