import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import { monthBreakdown, useBudgetStore } from '@domains/budget'
import { useDiaryStore } from '@domains/diary'
import { useGalleryStore } from '@domains/gallery'
import { detectBreaches, recommendationFor, useHabitatStore } from '@domains/habitat'
import { upcomingDues, useHealthStore, weightTrend } from '@domains/health'
import { useOnboardingStore, type PetProfile } from '@domains/onboarding'
import { REGISTRY_FILINGS, useRegistryStore } from '@domains/registry'
import { useSpeciesList, type Species } from '@domains/species'
import { supplyStatus, useSuppliesStore } from '@domains/supplies'
import useDocumentTitle from '@hooks/useDocumentTitle'
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
  filingsPending: number
}

function emptyMetrics(): PetMetrics {
  return {
    diaryRecent30: 0,
    weightLatest: null,
    weightDelta30g: null,
    nextDueLabel: null,
    nextDueDays: null,
    habitatBreachCount: 0,
    habitatLatestTemp: null,
    habitatLatestHumidity: null,
    monthSpendKrw: 0,
    worstSupplyName: null,
    worstSupplyDaysLeft: null,
    galleryCount: 0,
    filingsPending: 0,
  }
}

function computeMetrics(petId: string, pet: PetProfile, stores: HerdStoreData): PetMetrics {
  const m = emptyMetrics()
  const matches = (recordPetId: string | null | undefined) => !recordPetId || recordPetId === petId

  const cutoff30 = Date.now() - 30 * 24 * 3600 * 1000
  m.diaryRecent30 = stores.diaryEntries.filter(
    (e) => matches(e.petId) && new Date(e.occurredAt).getTime() >= cutoff30
  ).length

  const weights = stores.weights.filter((w) => matches(w.petId))
  const trend = weightTrend(weights)
  m.weightLatest = trend.latest
  m.weightDelta30g = trend.delta30dGrams

  const vaccinations = stores.vaccinations.filter((v) => matches(v.petId))
  const due = upcomingDues(vaccinations, 90)[0]
  if (due) {
    m.nextDueLabel = due.vaccination.name
    m.nextDueDays = due.daysLeft
  }

  const habitats = stores.habitatEntries
    .filter((e) => matches(e.petId))
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
  const latest = habitats[0]
  if (latest) {
    m.habitatLatestTemp = latest.temperatureC
    m.habitatLatestHumidity = latest.humidityPct
    const range = recommendationFor(pet.category ?? undefined)
    m.habitatBreachCount = detectBreaches(latest, range).length
  }

  const budgets = stores.budgetEntries.filter((b) => matches(b.petId))
  m.monthSpendKrw = monthBreakdown(budgets).totalKrw

  const supplies = stores.supplyItems
    .filter((i) => matches(i.petId))
    .map((item) => ({ item, status: supplyStatus(item) }))
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft)
  if (supplies[0]) {
    m.worstSupplyName = supplies[0].item.name
    m.worstSupplyDaysLeft = supplies[0].status.daysLeft
  }

  m.galleryCount = stores.galleryPhotos.filter((p) => matches(p.petId)).length

  const filingsDone = stores.registryByPet[petId] ?? stores.registryDone
  m.filingsPending = REGISTRY_FILINGS.filter((f) => !filingsDone[f]).length

  return m
}

interface HerdStoreData {
  diaryEntries: ReturnType<typeof useDiaryStore.getState>['entries']
  weights: ReturnType<typeof useHealthStore.getState>['weights']
  vaccinations: ReturnType<typeof useHealthStore.getState>['vaccinations']
  habitatEntries: ReturnType<typeof useHabitatStore.getState>['entries']
  budgetEntries: ReturnType<typeof useBudgetStore.getState>['entries']
  supplyItems: ReturnType<typeof useSuppliesStore.getState>['items']
  galleryPhotos: ReturnType<typeof useGalleryStore.getState>['photos']
  registryDone: ReturnType<typeof useRegistryStore.getState>['done']
  registryByPet: ReturnType<typeof useRegistryStore.getState>['byPet']
}

function Herd() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('herd.title'))

  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const switchPet = useOnboardingStore((s) => s.switchPet)

  const diaryEntries = useDiaryStore((s) => s.entries)
  const weights = useHealthStore((s) => s.weights)
  const vaccinations = useHealthStore((s) => s.vaccinations)
  const habitatEntries = useHabitatStore((s) => s.entries)
  const budgetEntries = useBudgetStore((s) => s.entries)
  const supplyItems = useSuppliesStore((s) => s.items)
  const galleryPhotos = useGalleryStore((s) => s.photos)
  const registryDone = useRegistryStore((s) => s.done)
  const registryByPet = useRegistryStore((s) => s.byPet)

  const { data: speciesList = [] } = useSpeciesList({})

  const stores: HerdStoreData = {
    diaryEntries,
    weights,
    vaccinations,
    habitatEntries,
    budgetEntries,
    supplyItems,
    galleryPhotos,
    registryDone,
    registryByPet,
  }

  const rows = pets.map((pet) => {
    const species = speciesList.find((s) => s.id === pet.speciesId) as Species | undefined
    return { pet, species, metrics: computeMetrics(pet.id, pet, stores) }
  })

  if (pets.length === 0) return null

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('herd.title')}</h1>
        <p className={styles.subtitle}>{t('herd.subtitle')}</p>
      </header>

      {pets.length === 1 ? (
        <EmptyState
          icon="🐾"
          title={t('herd.singlePetTitle')}
          description={t('herd.singlePetDesc')}
        />
      ) : (
        <div className={styles.grid}>
          {rows.map(({ pet, species, metrics }) => {
            const isActive = pet.id === activePetId
            const name = pet.petName?.trim() || species?.koreanName || '?'
            return (
              <article
                key={pet.id}
                className={[styles.petCard, isActive ? styles.petCardActive : '']
                  .filter(Boolean)
                  .join(' ')}
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
                        <span className={styles.subMetric}> (D-{metrics.nextDueDays ?? 0})</span>
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
                          <Badge variant="error">
                            {t('herd.metrics.breach', { count: metrics.habitatBreachCount })}
                          </Badge>
                        )}
                      </>
                    )}
                  </Metric>

                  <Metric label={t('herd.metrics.monthSpend')}>
                    ₩{metrics.monthSpendKrw.toLocaleString('ko')}
                  </Metric>

                  <Metric label={t('herd.metrics.worstSupply')}>
                    {metrics.worstSupplyName ? (
                      <>
                        {metrics.worstSupplyName}
                        <span className={styles.subMetric}> (~{metrics.worstSupplyDaysLeft}d)</span>
                      </>
                    ) : (
                      <span className={styles.muted}>{t('herd.metrics.noSupplies')}</span>
                    )}
                  </Metric>

                  <Metric label={t('herd.metrics.diary30')}>{metrics.diaryRecent30}</Metric>
                  <Metric label={t('herd.metrics.gallery')}>{metrics.galleryCount}</Metric>

                  <Metric label={t('herd.metrics.filings')}>
                    {metrics.filingsPending === 0 ? (
                      <Badge variant="success">{t('herd.metrics.filingsDone')}</Badge>
                    ) : (
                      <Badge variant="warning">
                        {t('herd.metrics.filingsPending', { count: metrics.filingsPending })}
                      </Badge>
                    )}
                  </Metric>
                </dl>

                <footer className={styles.petActions}>
                  {!isActive && (
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
                  )}
                  {isActive && (
                    <Link to="/dashboard" className={styles.activeLink}>
                      {t('herd.openDashboard')} →
                    </Link>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export default Herd
