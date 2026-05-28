import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useToast } from '@components/common/Toast'
import { useAdoptionList } from '@features/adoption'
import { compareAgainstRecommended, monthBreakdown, useActivePetBudget } from '@features/budget'
import { useCareGuide } from '@features/care-guides'
import { useCommunitiesList } from '@features/communities'
import { diaryStats, useActivePetDiary, type DiaryCategory } from '@features/diary'
import {
  useExternalLinks,
  type SpeciesCategory as ExtSpeciesCategory,
} from '@features/external-links'
import { useFuneralList } from '@features/funeral'
import { useActivePetPhotos } from '@features/gallery'
import { detectBreaches, recommendationFor, useActivePetHabitat } from '@features/habitat'
import { upcomingDues, useActivePetHealth, weightTrend } from '@features/health'
import { useHospitalsList } from '@features/hospitals'
import { LOCATION_PRESETS, findPreset } from '@features/location'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import { useActivePetFilings, REGISTRY_FILINGS } from '@features/registry'
import {
  BUILTIN_ROUTINES,
  isDoneWithinWindow,
  useActivePetCustomTasks,
  useRoutineStore,
} from '@features/routine'
import { useShopsList } from '@features/shops'
import { useSpecies } from '@features/species'
import { supplyStatus, useActivePetSupplies } from '@features/supplies'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useAppStore } from '@store/index'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'

import styles from './Dashboard.module.css'

const LIFECYCLE_STAGES = [
  { id: 'pick', emoji: '✨', target: '/onboarding' },
  { id: 'adopt', emoji: '🤝', target: '/adoption' },
  { id: 'raise', emoji: '🏠', target: '/care' },
  { id: 'vet', emoji: '🏥', target: '/hospitals' },
  { id: 'daily', emoji: '🛒', target: '/shops' },
  { id: 'senior', emoji: '🪴', target: '/care' },
  { id: 'funeral', emoji: '🌈', target: '/funeral' },
] as const

function Dashboard() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  const setLocation = useOnboardingStore((s) => s.setLocation)
  const user = useAppStore((s) => s.user)
  useDocumentTitle(t('nav.dashboard'))

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location],
  )

  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const hospitalsQuery = useHospitalsList(
    profile.category ? { category: profile.category, origin } : { origin },
  )
  const shopsQuery = useShopsList(
    profile.category ? { category: profile.category, origin } : { origin },
  )
  const careQuery = useCareGuide(profile.speciesId ?? undefined)
  const communitiesQuery = useCommunitiesList(
    profile.category ? { category: profile.category } : {},
  )
  const adoptionQuery = useAdoptionList(profile.category ? { category: profile.category } : {})
  const funeralQuery = useFuneralList(profile.category ? { category: profile.category } : {})
  const externalLinksQuery = useExternalLinks(
    profile.category ? { speciesCategory: profile.category as ExtSpeciesCategory } : {},
  )
  const diaryEntries = useActivePetDiary()
  const diaryAggregate = useMemo(() => diaryStats(diaryEntries), [diaryEntries])
  const recentDiary = diaryEntries.slice(0, 2)

  const { toast } = useToast()
  const { weights, vaccinations } = useActivePetHealth()
  const habitatEntries = useActivePetHabitat()
  const budgetEntries = useActivePetBudget()
  const supplyItems = useActivePetSupplies()
  const registryDone = useActivePetFilings()
  const galleryPhotos = useActivePetPhotos(profile.speciesId ?? null)
  const routineCustom = useActivePetCustomTasks()
  const routineCompletions = useRoutineStore((s) => s.completions)

  const healthSummary = useMemo(() => {
    const trend = weightTrend(weights)
    const dues = upcomingDues(vaccinations, 30)
    return { trend, nextDue: dues[0] ?? null }
  }, [weights, vaccinations])

  const habitatSummary = useMemo(() => {
    const range = recommendationFor(profile.category)
    const sortedEntries = [...habitatEntries].sort((a, b) =>
      b.measuredAt.localeCompare(a.measuredAt),
    )
    const latest = sortedEntries[0] ?? null
    const breaches = detectBreaches(latest, range)
    return { latest, breaches, hasRange: !!range }
  }, [habitatEntries, profile.category])

  const budgetSummary = useMemo(() => {
    const month = monthBreakdown(budgetEntries)
    const compare = compareAgainstRecommended(month.totalKrw, species?.monthlyBudgetKrw ?? null)
    return { month, compare }
  }, [budgetEntries, species?.monthlyBudgetKrw])

  const suppliesSummary = useMemo(() => {
    if (supplyItems.length === 0)
      return { worst: null as null | (typeof supplyItems)[number], status: null }
    const ranked = supplyItems
      .map((item) => ({ item, status: supplyStatus(item) }))
      .sort((a, b) => a.status.daysLeft - b.status.daysLeft)
    return { worst: ranked[0].item, status: ranked[0].status }
  }, [supplyItems])

  const routineSummary = useMemo(() => {
    const builtIn = profile.category ? (BUILTIN_ROUTINES[profile.category] ?? []) : []
    const all = [...builtIn, ...routineCustom]
    if (all.length === 0) return { done: 0, total: 0 }
    const done = all.filter((t) => isDoneWithinWindow(routineCompletions[t.id], t.cadence)).length
    return { done, total: all.length }
  }, [profile.category, routineCustom, routineCompletions])

  const galleryPreview = useMemo(() => {
    if (!profile.speciesId) return [] as typeof galleryPhotos
    return galleryPhotos.filter((p) => p.speciesId === profile.speciesId).slice(0, 6)
  }, [galleryPhotos, profile.speciesId])

  const weekActivity = countWeekActivity(diaryEntries, galleryPhotos, routineCompletions, weights)

  const upcomingPreview = useMemo(() => {
    const items: { id: string; daysLeft: number; label: string; link: string }[] = []
    for (const due of upcomingDues(vaccinations, 14)) {
      items.push({
        id: `vax-${due.vaccination.id}`,
        daysLeft: due.daysLeft,
        label: due.vaccination.name,
        link: '/health',
      })
    }
    for (const item of supplyItems) {
      const status = supplyStatus(item)
      if (status.daysLeft <= 14) {
        items.push({
          id: `sup-${item.id}`,
          daysLeft: status.daysLeft,
          label: item.name,
          link: '/supplies',
        })
      }
    }
    const filingPending = REGISTRY_FILINGS.filter((f) => !registryDone[f]).length
    if (filingPending > 0) {
      items.push({
        id: 'registry',
        daysLeft: 30,
        label: t('dashboard.upcoming.filings', { count: filingPending }),
        link: '/registry',
      })
    }
    return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4)
  }, [vaccinations, supplyItems, registryDone, t])

  const alertedRef = useRef(false)
  useEffect(() => {
    if (alertedRef.current) return
    const urgent = upcomingPreview.filter((i) => i.daysLeft <= 3)
    if (urgent.length > 0) {
      toast(t('dashboard.urgentToast', { count: urgent.length }), 'warning')
      alertedRef.current = true
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        try {
          new Notification('Pettography', {
            body: t('dashboard.urgentToast', { count: urgent.length }),
            tag: 'pettography-urgent',
          })
        } catch {
          /* notification ctor failures are non-fatal */
        }
      }
    }
  }, [upcomingPreview, toast, t])

  function askNotificationPermission() {
    if (typeof Notification === 'undefined') {
      toast(t('dashboard.notifyUnsupported'), 'error')
      return
    }
    if (Notification.permission === 'granted') {
      toast(t('dashboard.notifyAlreadyOn'), 'success')
      return
    }
    if (Notification.permission === 'denied') {
      toast(t('dashboard.notifyDenied'), 'error')
      return
    }
    void Notification.requestPermission().then((res) => {
      if (res === 'granted') toast(t('dashboard.notifyEnabled'), 'success')
      else toast(t('dashboard.notifyDenied'), 'error')
    })
  }

  if (!isOnboardingComplete(profile)) {
    return <Navigate to="/onboarding" replace />
  }

  const greetingName = profile.petName ?? user?.name ?? t('dashboard.guest')

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.title', { name: greetingName })}</h1>
          <p className={styles.subtitle}>{t('dashboard.subtitle')}</p>
          {profile.location && (
            <p className={styles.locationNote}>
              {t('dashboard.locationNote', { label: profile.location.label })}
            </p>
          )}
          <div
            className={styles.locationPicker}
            role="group"
            aria-label={t('dashboard.locationPickerTitle')}
          >
            <span className={styles.locationPickerLabel}>{t('dashboard.changeLocation')}:</span>
            {LOCATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={[
                  styles.locationChip,
                  profile.location?.presetId === preset.id ? styles.locationChipActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  const found = findPreset(preset.id)
                  if (!found) return
                  setLocation({
                    label: found.label,
                    presetId: found.id,
                    lat: found.coords.lat,
                    lng: found.coords.lng,
                  })
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        {species && (
          <Card padding="md" className={styles.speciesCard}>
            <Card.Body>
              <div className={styles.speciesHeader}>
                <span aria-hidden="true" className={styles.heroEmoji}>
                  {species.heroEmoji}
                </span>
                <div>
                  <p className={styles.eyebrow}>{t('dashboard.selectedSpecies')}</p>
                  <h2 className={styles.speciesName}>{species.koreanName}</h2>
                  <p className={styles.scientific}>{species.scientificName}</p>
                </div>
              </div>
              <div className={styles.speciesBadges}>
                <Badge variant="primary">{t(`categories.${species.category}`)}</Badge>
                <Badge variant="default">{t(`difficulty.${species.difficulty}`)}</Badge>
              </div>
              <Link to="/onboarding" className={styles.speciesAction}>
                {t('dashboard.speciesChange')} →
              </Link>
            </Card.Body>
          </Card>
        )}
      </header>

      <section aria-labelledby="lifecycle-heading">
        <header className={styles.sectionHeader}>
          <h2 id="lifecycle-heading">{t('lifecycle.title')}</h2>
          <p className={styles.sectionSubtitle}>{t('lifecycle.subtitle')}</p>
        </header>
        <div className={styles.lifecycleRail} role="list" aria-label={t('lifecycle.title')}>
          {LIFECYCLE_STAGES.map((stage, idx) => (
            <Link
              key={stage.id}
              to={stage.target}
              className={styles.lifecycleStep}
              role="listitem"
              aria-label={t(`lifecycle.stages.${stage.id}`)}
            >
              <span className={styles.stepNumber}>{String(idx + 1).padStart(2, '0')}</span>
              <span aria-hidden="true" className={styles.stepEmoji}>
                {stage.emoji}
              </span>
              <span className={styles.stepLabel}>{t(`lifecycle.stages.${stage.id}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.notifyRow}>
        <button type="button" className={styles.notifyButton} onClick={askNotificationPermission}>
          🔔 {t('dashboard.notifyButton')}
        </button>
      </div>

      <section aria-labelledby="weekly-heading" className={styles.weeklySection}>
        <header className={styles.sectionHeader}>
          <h2 id="weekly-heading">{t('dashboard.weeklyTitle')}</h2>
        </header>
        <ul className={styles.weeklyList}>
          <li className={styles.weeklyChip}>
            <span className={styles.weeklyNum}>{weekActivity.diary}</span>
            <span className={styles.weeklyLabel}>{t('dashboard.weekly.diary')}</span>
          </li>
          <li className={styles.weeklyChip}>
            <span className={styles.weeklyNum}>{weekActivity.photos}</span>
            <span className={styles.weeklyLabel}>{t('dashboard.weekly.photos')}</span>
          </li>
          <li className={styles.weeklyChip}>
            <span className={styles.weeklyNum}>{weekActivity.routine}</span>
            <span className={styles.weeklyLabel}>{t('dashboard.weekly.routine')}</span>
          </li>
          <li className={styles.weeklyChip}>
            <span className={styles.weeklyNum}>{weekActivity.weights}</span>
            <span className={styles.weeklyLabel}>{t('dashboard.weekly.weights')}</span>
          </li>
        </ul>
      </section>

      {routineSummary.total > 0 && (
        <section aria-labelledby="routine-heading" className={styles.routineSummary}>
          <div>
            <p className={styles.routineLabel}>{t('dashboard.routineSummaryLabel')}</p>
            <p className={styles.routineValue}>
              {routineSummary.done} / {routineSummary.total}
              <span className={styles.routinePercent}>
                {' · '}
                {Math.round((routineSummary.done / routineSummary.total) * 100)}%
              </span>
            </p>
          </div>
          <Link to="/routine" className={styles.routineLink}>
            {t('dashboard.routineOpen')} →
          </Link>
        </section>
      )}

      {galleryPreview.length > 0 && (
        <section aria-labelledby="gallery-preview-heading" className={styles.gallerySection}>
          <header className={styles.sectionHeader}>
            <h2 id="gallery-preview-heading">{t('dashboard.galleryTitle')}</h2>
            <Link to={`/species/${species?.slug}`} className={styles.sectionLink}>
              {t('dashboard.galleryOpen')} →
            </Link>
          </header>
          <ul className={styles.galleryRail}>
            {galleryPreview.map((p) => (
              <li key={p.id}>
                <img
                  src={p.imageUrl}
                  alt={p.caption ?? species?.koreanName ?? 'photo'}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className={styles.galleryThumb}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcomingPreview.length > 0 && (
        <section aria-labelledby="upcoming-heading" className={styles.upcomingSection}>
          <header className={styles.sectionHeader}>
            <h2 id="upcoming-heading">{t('dashboard.upcomingTitle')}</h2>
            <Link to="/calendar" className={styles.sectionLink}>
              {t('dashboard.openCalendar')} →
            </Link>
          </header>
          <ul className={styles.upcomingList}>
            {upcomingPreview.map((item) => (
              <li key={item.id}>
                <Link to={item.link} className={styles.upcomingItem}>
                  <span className={styles.upcomingDays}>
                    {item.daysLeft <= 0
                      ? t('dashboard.upcoming.now')
                      : t('dashboard.upcoming.daysLeft', { days: item.daysLeft })}
                  </span>
                  <span className={styles.upcomingLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="condition-heading">
        <header className={styles.sectionHeader}>
          <h2 id="condition-heading">{t('dashboard.conditionTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('dashboard.conditionSubtitle')}</p>
        </header>
        <div className={styles.conditionGrid}>
          <Link to="/health" className={styles.conditionTile}>
            <div className={styles.conditionHeader}>
              <span aria-hidden="true" className={styles.conditionEmoji}>
                ⚖️
              </span>
              <span className={styles.conditionLabel}>{t('dashboard.condition.health.label')}</span>
            </div>
            {healthSummary.trend.latest === null ? (
              <p className={styles.conditionEmpty}>{t('dashboard.condition.health.empty')}</p>
            ) : (
              <>
                <p className={styles.conditionValue}>
                  {healthSummary.trend.latest.toLocaleString('ko')} g
                </p>
                <p className={styles.conditionMeta}>
                  {healthSummary.nextDue
                    ? t('dashboard.condition.health.nextDue', {
                        label: healthSummary.nextDue.vaccination.name,
                        days: healthSummary.nextDue.daysLeft,
                      })
                    : t('dashboard.condition.health.noUpcoming')}
                </p>
              </>
            )}
          </Link>

          <Link to="/habitat" className={styles.conditionTile}>
            <div className={styles.conditionHeader}>
              <span aria-hidden="true" className={styles.conditionEmoji}>
                🌡️
              </span>
              <span className={styles.conditionLabel}>
                {t('dashboard.condition.habitat.label')}
              </span>
            </div>
            {!habitatSummary.latest ? (
              <p className={styles.conditionEmpty}>{t('dashboard.condition.habitat.empty')}</p>
            ) : (
              <>
                <p className={styles.conditionValue}>
                  {habitatSummary.latest.temperatureC ?? '—'}°C ·{' '}
                  {habitatSummary.latest.humidityPct ?? '—'}%
                </p>
                {habitatSummary.breaches.length > 0 ? (
                  <p className={`${styles.conditionMeta} ${styles.conditionAlert}`}>
                    {t('dashboard.condition.habitat.breach', {
                      count: habitatSummary.breaches.length,
                    })}
                  </p>
                ) : (
                  <p className={styles.conditionMeta}>
                    {habitatSummary.hasRange
                      ? t('dashboard.condition.habitat.inRange')
                      : t('dashboard.condition.habitat.noRange')}
                  </p>
                )}
              </>
            )}
          </Link>

          <Link to="/budget" className={styles.conditionTile}>
            <div className={styles.conditionHeader}>
              <span aria-hidden="true" className={styles.conditionEmoji}>
                💴
              </span>
              <span className={styles.conditionLabel}>{t('dashboard.condition.budget.label')}</span>
            </div>
            {budgetSummary.month.count === 0 ? (
              <p className={styles.conditionEmpty}>{t('dashboard.condition.budget.empty')}</p>
            ) : (
              <>
                <p className={styles.conditionValue}>
                  ₩{budgetSummary.month.totalKrw.toLocaleString('ko')}
                </p>
                <p
                  className={`${styles.conditionMeta} ${
                    budgetSummary.compare.status === 'over' ? styles.conditionAlert : ''
                  }`}
                >
                  {budgetSummary.compare.percent !== null
                    ? t(`dashboard.condition.budget.${budgetSummary.compare.status}`, {
                        percent: budgetSummary.compare.percent,
                      })
                    : t('dashboard.condition.budget.noRecommended')}
                </p>
              </>
            )}
          </Link>

          <Link to="/supplies" className={styles.conditionTile}>
            <div className={styles.conditionHeader}>
              <span aria-hidden="true" className={styles.conditionEmoji}>
                🥣
              </span>
              <span className={styles.conditionLabel}>
                {t('dashboard.condition.supplies.label')}
              </span>
            </div>
            {!suppliesSummary.worst || !suppliesSummary.status ? (
              <p className={styles.conditionEmpty}>{t('dashboard.condition.supplies.empty')}</p>
            ) : (
              <>
                <p className={styles.conditionValue}>{suppliesSummary.worst.name}</p>
                <p
                  className={`${styles.conditionMeta} ${
                    suppliesSummary.status.level === 'critical' ||
                    suppliesSummary.status.level === 'depleted'
                      ? styles.conditionAlert
                      : ''
                  }`}
                >
                  {t(`dashboard.condition.supplies.${suppliesSummary.status.level}`, {
                    days: suppliesSummary.status.daysLeft,
                  })}
                </p>
              </>
            )}
          </Link>
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="hospitals-heading">
        <header className={styles.sectionHeader}>
          <h2 id="hospitals-heading">{t('dashboard.nearHospitalsTitle')}</h2>
          <Link to="/hospitals" className={styles.sectionLink}>
            {t('dashboard.viewAllHospitals')} →
          </Link>
        </header>
        {hospitalsQuery.isLoading && <Skeleton variant="rectangular" height={120} lines={2} />}
        {hospitalsQuery.data && hospitalsQuery.data.length === 0 && (
          <EmptyState icon="🏥" title={t('dashboard.emptyHospitals')} />
        )}
        <div className={styles.cardGrid}>
          {hospitalsQuery.data?.slice(0, 3).map((h) => (
            <Card key={h.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{h.name}</h3>
                <p className={styles.itemMeta}>
                  {h.district}
                  {Number.isFinite(h.distanceKm) && ` · ${h.distanceKm}km`}
                </p>
                <p className={styles.itemDesc}>{h.hours}</p>
                {h.hasEmergency && <Badge variant="error">{t('hospitals.emergencyBadge')}</Badge>}
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="shops-heading">
        <header className={styles.sectionHeader}>
          <h2 id="shops-heading">{t('dashboard.nearShopsTitle')}</h2>
          <Link to="/shops" className={styles.sectionLink}>
            {t('dashboard.viewAllShops')} →
          </Link>
        </header>
        {shopsQuery.isLoading && <Skeleton variant="rectangular" height={120} lines={2} />}
        {shopsQuery.data && shopsQuery.data.length === 0 && (
          <EmptyState icon="🛒" title={t('dashboard.emptyShops')} />
        )}
        <div className={styles.cardGrid}>
          {shopsQuery.data?.slice(0, 3).map((shop) => (
            <Card key={shop.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{shop.name}</h3>
                <p className={styles.itemMeta}>
                  {shop.district ?? t('shops.online')}
                  {shop.distanceKm !== null && ` · ${shop.distanceKm}km`}
                </p>
                <p className={styles.itemDesc}>{shop.notes}</p>
                <Badge variant="primary">{t(`shops.kind${capitalize(shop.kind)}`)}</Badge>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="care-heading">
        <header className={styles.sectionHeader}>
          <h2 id="care-heading">{t('dashboard.careGuideTitle')}</h2>
          <Link to="/care" className={styles.sectionLink}>
            {t('dashboard.viewCareGuide')} →
          </Link>
        </header>
        {careQuery.isLoading && <Skeleton variant="text" lines={3} />}
        {careQuery.data && (
          <Card padding="md">
            <Card.Body>
              <h3 className={styles.itemTitle}>{careQuery.data.sections[0]?.title}</h3>
              <p className={styles.itemDesc}>{careQuery.data.sections[0]?.body}</p>
            </Card.Body>
          </Card>
        )}
        {!careQuery.isLoading && !careQuery.data && (
          <EmptyState icon="📝" title={t('care.notFound')} />
        )}
      </section>

      <section className={styles.gridSection} aria-labelledby="diary-heading">
        <header className={styles.sectionHeader}>
          <h2 id="diary-heading">{t('dashboard.diaryTitle')}</h2>
          <Link to="/diary" className={styles.sectionLink}>
            {t('dashboard.viewDiary')} →
          </Link>
        </header>
        {diaryEntries.length === 0 ? (
          <EmptyState icon="📓" title={t('dashboard.diaryEmpty')} />
        ) : (
          <div className={styles.cardGrid}>
            <Card padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{t('diary.stats.title')}</h3>
                <p className={styles.itemMeta}>
                  {t('diary.stats.total')}: {diaryAggregate.total} · {t('diary.stats.recent30')}:{' '}
                  {diaryAggregate.recent30}
                </p>
                <p className={styles.itemDesc}>
                  {t('diary.stats.latestWeight')}:{' '}
                  {diaryAggregate.latestWeight
                    ? `${diaryAggregate.latestWeight} g`
                    : t('diary.stats.noWeight')}
                </p>
              </Card.Body>
            </Card>
            {recentDiary.map((entry) => (
              <Card key={entry.id} padding="md">
                <Card.Body>
                  <p className={styles.itemMeta}>
                    <Badge variant="primary">
                      {t(`diary.categories.${entry.category as DiaryCategory}`)}
                    </Badge>{' '}
                    {entry.occurredAt}
                  </p>
                  <p className={styles.itemDesc}>{entry.body}</p>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className={styles.gridSection} aria-labelledby="communities-heading">
        <header className={styles.sectionHeader}>
          <h2 id="communities-heading">{t('dashboard.communitiesTitle')}</h2>
          <Link to="/communities" className={styles.sectionLink}>
            {t('dashboard.viewCommunities')} →
          </Link>
        </header>
        {communitiesQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        <div className={styles.cardGrid}>
          {communitiesQuery.data?.slice(0, 3).map((c) => (
            <Card key={c.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{c.name}</h3>
                <Badge variant="default">{t(`communities.kind${capitalize(c.kind)}`)}</Badge>
                <p className={styles.itemDesc}>{c.memberHint ?? c.language.toUpperCase()}</p>
                <a className={styles.externalLink} href={c.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="adoption-heading">
        <header className={styles.sectionHeader}>
          <h2 id="adoption-heading">{t('dashboard.adoptionTitle')}</h2>
          <Link to="/adoption" className={styles.sectionLink}>
            {t('dashboard.viewAdoption')} →
          </Link>
        </header>
        <div className={styles.cardGrid}>
          {adoptionQuery.data?.slice(0, 3).map((a) => (
            <Card key={a.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{a.name}</h3>
                <p className={styles.itemMeta}>
                  {a.region} ·{' '}
                  <Badge variant="default">{t(`adoption.kind${capitalize(a.kind)}`)}</Badge>
                </p>
                <p className={styles.itemDesc}>{a.description}</p>
                <a className={styles.externalLink} href={a.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="funeral-heading">
        <header className={styles.sectionHeader}>
          <h2 id="funeral-heading">{t('dashboard.funeralTitle')}</h2>
          <Link to="/funeral" className={styles.sectionLink}>
            {t('dashboard.viewFuneral')} →
          </Link>
        </header>
        <div className={styles.cardGrid}>
          {funeralQuery.data?.slice(0, 3).map((f) => (
            <Card key={f.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{f.name}</h3>
                <p className={styles.itemMeta}>{f.region}</p>
                <p className={styles.itemDesc}>{f.description}</p>
                {f.certified ? (
                  <Badge variant="success">{t('funeral.certified')}</Badge>
                ) : (
                  <Badge variant="warning">{t('funeral.uncertified')}</Badge>
                )}{' '}
                <a className={styles.externalLink} href={f.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="external-heading">
        <header className={styles.sectionHeader}>
          <h2 id="external-heading">{t('dashboard.externalTitle')}</h2>
          <Link to="/resources" className={styles.sectionLink}>
            {t('nav.resources')} →
          </Link>
        </header>
        {externalLinksQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        <div className={styles.cardGrid}>
          {externalLinksQuery.data?.slice(0, 4).map((link) => (
            <Card key={link.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{link.name}</h3>
                <p className={styles.itemMeta}>
                  <Badge variant="default">{t(`resources.categories.${link.category}`)}</Badge>
                  {link.badge && (
                    <>
                      {' '}
                      <Badge variant="success">{link.badge}</Badge>
                    </>
                  )}
                </p>
                <p className={styles.itemDesc}>{link.description}</p>
                <a className={styles.externalLink} href={link.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <div className={styles.footerActions}>
        <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑ Top
        </Button>
      </div>
    </section>
  )
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

function countWeekActivity(
  diary: { occurredAt: string }[],
  photos: { addedAt: string }[],
  completions: Record<string, string>,
  weights: { measuredAt: string }[],
) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const since = (iso: string) => iso >= weekAgo
  return {
    diary: diary.filter((e) => since(e.occurredAt)).length,
    photos: photos.filter((p) => since(p.addedAt)).length,
    routine: Object.values(completions).filter((ts) => since(ts)).length,
    weights: weights.filter((w) => since(w.measuredAt)).length,
  }
}

export default Dashboard
