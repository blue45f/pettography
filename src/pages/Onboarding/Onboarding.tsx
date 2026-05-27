import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Progress from '@components/common/Progress'
import { useToast } from '@components/common/Toast'
import { LOCATION_PRESETS, findPreset } from '@features/location'
import {
  isOnboardingComplete,
  ONBOARDING_STEPS,
  useOnboardingStore,
  type OnboardingStep,
} from '@features/onboarding'
import { isRegulated } from '@features/registry'
import { SPECIES_CATEGORIES, useSpeciesList } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import styles from './Onboarding.module.css'

import type { SpeciesCategory } from '@features/species'

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
  const reset = useOnboardingStore((s) => s.reset)

  const [step, setStep] = useState<OnboardingStep>(profile.category ? 'species' : 'category')
  const [locating, setLocating] = useState(false)

  const stepIndex = ONBOARDING_STEPS.indexOf(step)
  const progressValue = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100

  const { data: speciesList = [] } = useSpeciesList(
    profile.category ? { category: profile.category } : {}
  )

  function goNext() {
    const next = ONBOARDING_STEPS[stepIndex + 1]
    if (next) setStep(next)
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

  function handleSelectPreset(presetId: string) {
    const preset = findPreset(presetId)
    if (!preset) return
    setLocation({
      label: preset.label,
      presetId: preset.id,
      lat: preset.coords.lat,
      lng: preset.coords.lng,
    })
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
      },
      () => {
        toast(t('onboarding.currentFailed'), 'error')
        handleSelectPreset('songpa')
        setLocating(false)
      },
      { timeout: 5000 }
    )
  }

  function handleFinish() {
    if (!profile.location) {
      handleSelectPreset('songpa')
    }
    complete()
    toast(t('onboarding.finish'), 'success')
    navigate('/dashboard')
  }

  function handleReset() {
    reset()
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
              onClick={() => setStep(s)}
            >
              {idx + 1}. {t(`onboarding.steps.${s}`)}
            </button>
          ))}
        </nav>
      </header>

      {step === 'category' && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>{t('onboarding.categoryTitle')}</h2>
          <p className={styles.stepHint}>{t('onboarding.categoryHint')}</p>
          <div className={styles.grid}>
            {SPECIES_CATEGORIES.map((category) => (
              <Card
                key={category}
                hoverable
                padding="lg"
                className={[
                  styles.cardOption,
                  profile.category === category ? styles.cardSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Card.Body>
                  <h3 className={styles.cardTitle}>{t(`categories.${category}`)}</h3>
                  <p className={styles.cardDesc}>{t(`categories.${category}Desc`)}</p>
                  <Button
                    variant={profile.category === category ? 'primary' : 'outline'}
                    onClick={() => handleSelectCategory(category)}
                  >
                    {profile.category === category ? t('common.done') : t('common.next')}
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 'species' && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>{t('onboarding.speciesTitle')}</h2>
          <p className={styles.stepHint}>{t('onboarding.speciesHint')}</p>
          {!profile.category && (
            <p className={styles.warning}>{t('onboarding.errors.selectCategory')}</p>
          )}
          <div className={styles.grid}>
            {speciesList.map((s) => (
              <Card
                key={s.id}
                hoverable
                padding="lg"
                className={[
                  styles.cardOption,
                  profile.speciesId === s.id ? styles.cardSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Card.Body>
                  <div className={styles.speciesHeader}>
                    <span className={styles.heroEmoji} aria-hidden="true">
                      {s.heroEmoji}
                    </span>
                    <div>
                      <h3 className={styles.cardTitle}>{s.koreanName}</h3>
                      <p className={styles.scientific}>{s.scientificName}</p>
                    </div>
                  </div>
                  <p className={styles.cardDesc}>{s.summary}</p>
                  <div className={styles.badgeRow}>
                    <Badge variant="primary">{t(`difficulty.${s.difficulty}`)}</Badge>
                    {s.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant={profile.speciesId === s.id ? 'primary' : 'outline'}
                    onClick={() => handleSelectSpecies(s.id)}
                  >
                    {profile.speciesId === s.id ? t('common.done') : t('species.selectThis')}
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 'location' && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>{t('onboarding.locationTitle')}</h2>
          <p className={styles.stepHint}>{t('onboarding.locationHint')}</p>
          <div className={styles.locationActions}>
            <Button variant="primary" onClick={handleUseCurrent} isLoading={locating}>
              {locating ? t('onboarding.currentDetecting') : t('onboarding.useCurrent')}
            </Button>
          </div>
          <h3 className={styles.subTitle}>{t('onboarding.presetLabel')}</h3>
          <div className={styles.grid}>
            {LOCATION_PRESETS.map((preset) => (
              <Card
                key={preset.id}
                hoverable
                padding="lg"
                className={[
                  styles.cardOption,
                  profile.location?.presetId === preset.id ? styles.cardSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Card.Body>
                  <h3 className={styles.cardTitle}>{preset.label}</h3>
                  <p className={styles.cardDesc}>
                    {preset.coords.lat.toFixed(4)}, {preset.coords.lng.toFixed(4)}
                  </p>
                  <Button
                    variant={profile.location?.presetId === preset.id ? 'primary' : 'outline'}
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    {profile.location?.presetId === preset.id ? t('common.done') : t('common.next')}
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>{t('onboarding.reviewTitle')}</h2>
          <Card padding="lg">
            <Card.Body>
              <label className={styles.petNameLabel} htmlFor="onboarding-pet-name">
                {t('onboarding.petNameLabel')}
              </label>
              <input
                id="onboarding-pet-name"
                type="text"
                maxLength={40}
                placeholder={t('onboarding.petNamePlaceholder')}
                value={profile.petName ?? ''}
                onChange={(e) => setPetName(e.target.value)}
                className={styles.petNameInput}
              />
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
              (step === 'species' && !profile.speciesId)
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
