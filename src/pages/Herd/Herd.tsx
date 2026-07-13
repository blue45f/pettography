import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import { monthBreakdown, useBudgetStore } from '@domains/budget'
import { useDiaryStore } from '@domains/diary'
import { useGalleryStore } from '@domains/gallery'
import { detectBreaches, recommendationFor, useHabitatStore } from '@domains/habitat'
import { upcomingDues, useHealthStore, weightTrend } from '@domains/health'
import { useOnboardingStore, type PetProfile } from '@domains/onboarding'
import { useSpeciesList, type Species } from '@domains/species'
import { supplyStatus, useSuppliesStore } from '@domains/supplies'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import styles from './Herd.module.css'

interface PetMetrics {
  diaryRecent30: number
  weightLatest: number | null
  weightDelta30g: number | null
  nextDueLabel: string | null
  nextDueDays: number | null
  habitatBreachCount: number
  habitatLatestTemp: number | null
  habitatLatestHumidity: number | null
  monthSpendKrw: number
  worstSupplyName: string | null
  worstSupplyDaysLeft: number | null
  galleryCount: number
}

interface HerdStoreData {
  diaryEntries: ReturnType<typeof useDiaryStore.getState>['entries']
  weights: ReturnType<typeof useHealthStore.getState>['weights']
  vaccinations: ReturnType<typeof useHealthStore.getState>['vaccinations']
  habitatEntries: ReturnType<typeof useHabitatStore.getState>['entries']
  budgetEntries: ReturnType<typeof useBudgetStore.getState>['entries']
  supplyItems: ReturnType<typeof useSuppliesStore.getState>['items']
  galleryPhotos: ReturnType<typeof useGalleryStore.getState>['photos']
}

function computeMetrics(petId: string, pet: PetProfile, stores: HerdStoreData): PetMetrics {
  const matches = (recordPetId: string | null | undefined) => recordPetId === petId
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000
  const diaryRecent30 = stores.diaryEntries.filter(
    (entry) => matches(entry.petId) && new Date(entry.occurredAt).getTime() >= cutoff30
  ).length
  const trend = weightTrend(stores.weights.filter((weight) => matches(weight.petId)))
  const due = upcomingDues(
    stores.vaccinations.filter((item) => matches(item.petId)),
    90
  )[0]
  const habitats = stores.habitatEntries
    .filter((entry) => matches(entry.petId))
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
  const latestHabitat = habitats[0]
  const habitatRange = recommendationFor(pet.category ?? undefined)
  const supplies = stores.supplyItems
    .filter((item) => matches(item.petId))
    .map((item) => ({ item, status: supplyStatus(item) }))
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft)

  return {
    diaryRecent30,
    weightLatest: trend.latest,
    weightDelta30g: trend.delta30dGrams,
    nextDueLabel: due?.vaccination.name ?? null,
    nextDueDays: due?.daysLeft ?? null,
    habitatBreachCount: latestHabitat ? detectBreaches(latestHabitat, habitatRange).length : 0,
    habitatLatestTemp: latestHabitat?.temperatureC ?? null,
    habitatLatestHumidity: latestHabitat?.humidityPct ?? null,
    monthSpendKrw: monthBreakdown(stores.budgetEntries.filter((item) => matches(item.petId)))
      .totalKrw,
    worstSupplyName: supplies[0]?.item.name ?? null,
    worstSupplyDaysLeft: supplies[0]?.status.daysLeft ?? null,
    galleryCount: stores.galleryPhotos.filter((photo) => matches(photo.petId)).length,
  }
}

function Herd() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('herd.title'))

  const pets = useOnboardingStore((state) => state.pets)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const switchPet = useOnboardingStore((state) => state.switchPet)
  const diaryEntries = useDiaryStore((state) => state.entries)
  const weights = useHealthStore((state) => state.weights)
  const vaccinations = useHealthStore((state) => state.vaccinations)
  const habitatEntries = useHabitatStore((state) => state.entries)
  const budgetEntries = useBudgetStore((state) => state.entries)
  const supplyItems = useSuppliesStore((state) => state.items)
  const galleryPhotos = useGalleryStore((state) => state.photos)
  const { data: speciesList = [] } = useSpeciesList({})
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.resolvedLanguage ?? 'ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }),
    [i18n.resolvedLanguage]
  )

  const stores: HerdStoreData = {
    diaryEntries,
    weights,
    vaccinations,
    habitatEntries,
    budgetEntries,
    supplyItems,
    galleryPhotos,
  }
  const rows = pets.map((pet) => {
    const species = speciesList.find((item) => item.id === pet.speciesId) as Species | undefined
    return { pet, species, metrics: computeMetrics(pet.id, pet, stores) }
  })

  function dueText(days: number | null): string {
    if (days === null) return ''
    if (days < 0) return t('herd.due.overdue', { count: Math.abs(days) })
    if (days === 0) return t('herd.due.today')
    return t('herd.due.future', { count: days })
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('herd.eyebrow')}</p>
        <h1>{t('herd.title')}</h1>
        <p className={styles.subtitle}>{t('herd.subtitle')}</p>
      </header>

      {pets.length === 0 ? (
        <EmptyState
          icon="🐾"
          title={t('herd.emptyTitle')}
          description={t('herd.emptyDesc')}
          action={
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('herd.emptyAction')}
            </Link>
          }
        />
      ) : (
        <>
          {pets.length === 1 && <p className={styles.singleNote}>{t('herd.singlePetNote')}</p>}
          <div className={styles.grid}>
            {rows.map(({ pet, species, metrics }) => {
              const isActive = pet.id === activePetId
              const name = pet.petName?.trim() || species?.koreanName || t('herd.unnamed')
              return (
                <article
                  key={pet.id}
                  className={`${styles.petCard} ${isActive ? styles.petCardActive : ''}`}
                >
                  <header className={styles.petHeader}>
                    <span aria-hidden="true" className={styles.petEmoji}>
                      {species?.heroEmoji ?? '🐾'}
                    </span>
                    <div className={styles.petTitleBlock}>
                      <h2 className={styles.petName}>{name}</h2>
                      {species && (
                        <p className={styles.petSpecies}>
                          {species.koreanName} · {species.scientificName}
                        </p>
                      )}
                    </div>
                    {isActive && <Badge variant="primary">{t('herd.activeBadge')}</Badge>}
                  </header>
                  <dl className={styles.metricList}>
                    <Metric label={t('herd.metrics.weight')}>
                      {metrics.weightLatest === null ? (
                        <span className={styles.muted}>—</span>
                      ) : (
                        <>
                          {metrics.weightLatest}g
                          {metrics.weightDelta30g !== null && (
                            <span className={styles.subMetric}>
                              {' '}
                              ({metrics.weightDelta30g > 0 ? '+' : ''}
                              {metrics.weightDelta30g}g / 30d)
                            </span>
                          )}
                        </>
                      )}
                    </Metric>
                    <Metric label={t('herd.metrics.nextDue')}>
                      {metrics.nextDueLabel ? (
                        <>
                          {metrics.nextDueLabel}
                          <span className={styles.subMetric}>
                            {' '}
                            · {dueText(metrics.nextDueDays)}
                          </span>
                        </>
                      ) : (
                        <span className={styles.muted}>{t('herd.metrics.noneUpcoming')}</span>
                      )}
                    </Metric>
                    <Metric label={t('herd.metrics.habitat')}>
                      {metrics.habitatLatestTemp === null &&
                      metrics.habitatLatestHumidity === null ? (
                        <span className={styles.muted}>—</span>
                      ) : (
                        <>
                          {metrics.habitatLatestTemp ?? '—'}°C ·{' '}
                          {metrics.habitatLatestHumidity ?? '—'}%
                          {metrics.habitatBreachCount > 0 && (
                            <Badge variant="warning">
                              {t('herd.metrics.breach', { count: metrics.habitatBreachCount })}
                            </Badge>
                          )}
                        </>
                      )}
                    </Metric>
                    <Metric label={t('herd.metrics.monthSpend')}>
                      {currency.format(metrics.monthSpendKrw)}
                    </Metric>
                    <Metric label={t('herd.metrics.worstSupply')}>
                      {metrics.worstSupplyName ? (
                        <>
                          {metrics.worstSupplyName}
                          <span className={styles.subMetric}>
                            {' '}
                            · {t('herd.supplyDays', { count: metrics.worstSupplyDaysLeft ?? 0 })}
                          </span>
                        </>
                      ) : (
                        <span className={styles.muted}>{t('herd.metrics.noSupplies')}</span>
                      )}
                    </Metric>
                    <Metric label={t('herd.metrics.diary30')}>{metrics.diaryRecent30}</Metric>
                    <Metric label={t('herd.metrics.gallery')}>{metrics.galleryCount}</Metric>
                  </dl>
                  <footer className={styles.petActions}>
                    {!isActive ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          switchPet(pet.id)
                          navigate('/dashboard')
                        }}
                      >
                        {t('herd.switchAndOpen')}
                      </Button>
                    ) : (
                      <Link to="/dashboard" className={styles.activeLink}>
                        {t('herd.openDashboard')}
                      </Link>
                    )}
                  </footer>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export default Herd
