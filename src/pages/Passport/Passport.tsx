import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { useActivePetBcs } from '@domains/bcs'
import { useDiaryStore } from '@domains/diary'
import { useFeedingStore } from '@domains/feeding'
import { useActivePetGrowth } from '@domains/growth'
import { useActivePetHealth } from '@domains/health'
import { useMoltStore } from '@domains/molt'
import { useOnboardingStore } from '@domains/onboarding'
import { computeMetrics, passportNumber } from '@domains/passport'
import { useSpeciesList } from '@domains/species'
import { useActivePetVitals } from '@domains/vitals'
import { useActivePetReadings } from '@domains/water'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Passport.module.css'

function scopeToActivePet<T extends { petId?: string | null }>(
  items: T[],
  activePetId: string | null
): T[] {
  if (!activePetId) return []
  return items.filter((item) => item.petId === activePetId)
}

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function Passport() {
  const { t } = useTranslation()
  useDocumentTitle(t('passport.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const pets = useOnboardingStore((state) => state.pets)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const diaryEntries = useDiaryStore((state) => state.entries)
  const moltEvents = useMoltStore((state) => state.events)
  const feedingLogs = useFeedingStore((state) => state.logs)
  const { data: speciesList = [] } = useSpeciesList({})
  const { weights } = useActivePetHealth()
  const bcs = useActivePetBcs()
  const vitals = useActivePetVitals()
  const water = useActivePetReadings()
  const growth = useActivePetGrowth()

  const activePet = useMemo(
    () => pets.find((pet) => pet.id === activePetId) ?? null,
    [activePetId, pets]
  )
  const species = useMemo(
    () => speciesList.find((item) => item.id === profile.speciesId) ?? null,
    [profile.speciesId, speciesList]
  )
  const diary = useMemo(
    () => scopeToActivePet(diaryEntries, activePetId),
    [activePetId, diaryEntries]
  )
  const molts = useMemo(() => scopeToActivePet(moltEvents, activePetId), [activePetId, moltEvents])
  const feedings = useMemo(
    () => scopeToActivePet(feedingLogs, activePetId),
    [activePetId, feedingLogs]
  )
  const metrics = useMemo(
    () =>
      computeMetrics(
        {
          petCreatedAt: activePet?.createdAt ?? null,
          diary,
          molts,
          feedings,
          clutches: [],
          weights,
          bcs,
          vitals,
          water,
          growth,
        },
        localTodayIso()
      ),
    [activePet?.createdAt, bcs, diary, feedings, growth, molts, vitals, water, weights]
  )

  if (!activePetId || !activePet) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('passport.eyebrow')}</p>
          <h1>{t('passport.title')}</h1>
          <p className={styles.subtitle}>{t('passport.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🐾
            </span>
            <h2>{t('passport.petRequiredTitle')}</h2>
            <p>{t('passport.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('passport.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  const petName = profile.petName?.trim() || species?.koreanName || t('passport.card.unnamed')
  const heroEmoji = species?.heroEmoji ?? '🐾'
  const localCode = passportNumber(activePet.id)
  const totalRecords =
    metrics.diaryCount +
    metrics.moltCount +
    metrics.feedingCount +
    metrics.weightCount +
    metrics.bcsCount +
    metrics.vitalsCount +
    metrics.waterCount +
    metrics.growthCount

  const careGroups = [
    {
      key: 'journal',
      value: metrics.diaryCount,
      href: '/diary',
    },
    {
      key: 'feeding',
      value: metrics.feedingCount,
      href: '/feeding',
    },
    {
      key: 'health',
      value: metrics.weightCount + metrics.bcsCount + metrics.vitalsCount,
      href: '/health',
    },
    {
      key: 'environment',
      value: metrics.waterCount + metrics.growthCount,
      href: '/habitat',
    },
    {
      key: 'molt',
      value: metrics.moltCount,
      href: '/molt',
    },
  ] as const

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('passport.eyebrow')}</p>
        <h1>{t('passport.title')}</h1>
        <p className={styles.subtitle}>{t('passport.subtitle')}</p>
      </header>

      <article className={styles.passport} aria-label={t('passport.card.aria', { name: petName })}>
        <div className={styles.passportTop}>
          <span className={styles.wordmark}>Pettography</span>
          <span className={styles.localOnly}>{t('passport.card.localOnly')}</span>
        </div>
        <div className={styles.passportMain}>
          <span className={styles.hero} aria-hidden="true">
            {heroEmoji}
          </span>
          <div className={styles.identity}>
            <span className={styles.docType}>{t('passport.card.docType')}</span>
            <span className={styles.petName}>{petName}</span>
            <span className={styles.species}>
              {species ? species.koreanName : t('passport.card.speciesUnknown')}
            </span>
            {species?.scientificName && (
              <span className={styles.scientific}>{species.scientificName}</span>
            )}
          </div>
        </div>
        <dl className={styles.passportStats}>
          <div>
            <dt>{t('passport.card.daysTogether')}</dt>
            <dd>{t('passport.card.daysValue', { count: metrics.daysTogether })}</dd>
          </div>
          <div>
            <dt>{t('passport.card.totalRecords')}</dt>
            <dd>{totalRecords}</dd>
          </div>
          <div>
            <dt>{t('passport.card.localReference')}</dt>
            <dd className={styles.passportNo}>{localCode}</dd>
          </div>
        </dl>
        <p className={styles.notOfficial}>{t('passport.card.notOfficial')}</p>
      </article>

      <p className={styles.privateNote}>{t('passport.privateNote')}</p>

      <section aria-labelledby="care-coverage-title" className={styles.coverageSection}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>{t('passport.coverage.kicker')}</p>
            <h2 id="care-coverage-title" className={styles.sectionTitle}>
              {t('passport.coverage.title')}
            </h2>
          </div>
          <span className={styles.recordPill}>
            {t('passport.coverage.total', { count: totalRecords })}
          </span>
        </div>
        <p className={styles.sectionDesc}>{t('passport.coverage.desc')}</p>

        {totalRecords === 0 ? (
          <EmptyState
            icon="🗂️"
            title={t('passport.empty.title')}
            description={t('passport.empty.desc')}
            action={
              <Link to="/dashboard" className={styles.secondaryLink}>
                {t('passport.empty.cta')}
              </Link>
            }
          />
        ) : (
          <ul className={styles.coverageGrid}>
            {careGroups.map((group) => (
              <li key={group.key}>
                <Link to={group.href} className={styles.coverageLink}>
                  <span className={styles.coverageValue}>{group.value}</span>
                  <span className={styles.coverageName}>
                    {t(`passport.coverage.groups.${group.key}.title`)}
                  </span>
                  <span className={styles.coverageDesc}>
                    {t(`passport.coverage.groups.${group.key}.desc`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Passport
