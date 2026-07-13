import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import KakaoMap, { type KakaoMapMarker } from '@components/common/KakaoMap'
import Select from '@components/common/Select'
import Skeleton from '@components/common/Skeleton'
import { useHospitalsList, type HospitalWithDistance } from '@domains/hospitals'
import { SONGPA_CENTER } from '@domains/location'
import { useOnboardingStore } from '@domains/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Hospitals.module.css'

type HospitalSort = 'distance' | 'name' | 'emergency'

function sortHospitals(list: HospitalWithDistance[], sort: HospitalSort): HospitalWithDistance[] {
  const copy = [...list]
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    case 'emergency':
      return copy.sort((a, b) => {
        if (a.hasEmergency !== b.hasEmergency) return a.hasEmergency ? -1 : 1
        return a.distanceKm - b.distanceKm
      })
    case 'distance':
    default:
      return copy.sort((a, b) => a.distanceKm - b.distanceKm)
  }
}

function Hospitals() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('hospitals.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [sort, setSort] = useState<HospitalSort>(profile.location ? 'distance' : 'name')

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location]
  )

  const { data, isLoading, isError } = useHospitalsList({
    category: category === 'all' ? undefined : category,
    origin,
  })

  const sorted = useMemo(() => (data ? sortHospitals(data, sort) : data), [data, sort])

  const mapCenter = useMemo(
    () =>
      profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : SONGPA_CENTER,
    [profile.location]
  )

  const mapMarkers: KakaoMapMarker[] = useMemo(
    () =>
      sorted?.map((h) => ({
        id: h.id,
        lat: h.lat,
        lng: h.lng,
        title: h.name,
        popupHtml: `<div style="padding:8px;font-size:13px"><strong>${h.name}</strong><br/>${h.district}</div>`,
      })) ?? [],
    [sorted]
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('hospitals.title')}</h1>
        <p className={styles.subtitle}>
          {t(profile.location ? 'hospitals.subtitleWithLocation' : 'hospitals.subtitle')}
        </p>
        {profile.location && (
          <div className={styles.locationBar}>
            <span>{t('dashboard.locationNote', { label: profile.location.label })}</span>
            <Link to="/onboarding" className={styles.locationLink}>
              {t('dashboard.changeLocation')} →
            </Link>
          </div>
        )}
        {!profile.location && (
          <Link to="/onboarding" className={styles.locationLink}>
            {t('dashboard.changeLocation')} →
          </Link>
        )}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <p id="hospital-category-filter" className={styles.filterLabel}>
            {t('hospitals.filterByCategory')}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="hospital-category-filter"
            className={styles.filters}
          >
            <button
              type="button"
              role="radio"
              aria-checked={category === 'all'}
              className={[styles.filterChip, category === 'all' ? styles.filterActive : ''].join(
                ' '
              )}
              onClick={() => setCategory('all')}
            >
              {t('hospitals.filterAll')}
            </button>
            {SPECIES_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                className={[styles.filterChip, category === c ? styles.filterActive : ''].join(' ')}
                onClick={() => setCategory(c)}
              >
                {t(`categories.${c}`)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sortRow}>
          <Select
            label={t('hospitals.sortLabel')}
            value={sort}
            onChange={(e) => setSort(e.target.value as HospitalSort)}
            options={[
              ...(profile.location
                ? [{ value: 'distance', label: t('hospitals.sortDistance') }]
                : []),
              { value: 'name', label: t('hospitals.sortName') },
              { value: 'emergency', label: t('hospitals.sortEmergency') },
            ]}
          />
        </div>
      </div>

      <div className={styles.resultsLayout}>
        <div className={styles.resultsPanel} aria-live="polite">
          {isLoading && <Skeleton variant="rectangular" height={120} lines={3} />}
          {isError && (
            <EmptyState
              variant="discover"
              icon="⚠️"
              title={t('common.error')}
              description={t('common.loadErrorHint')}
            />
          )}
          {!isError && sorted && sorted.length === 0 && (
            <EmptyState variant="discover" icon="🏥" title={t('hospitals.noResult')} />
          )}

          <ul className={styles.list}>
            {sorted?.map((h) => (
              <li key={h.id} className={styles.hospitalItem}>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{h.name}</h2>
                  <div className={styles.itemBadges}>
                    {Number.isFinite(h.distanceKm) && (
                      <span className={styles.distanceBadge}>{h.distanceKm}km</span>
                    )}
                    {h.hasEmergency && (
                      <Badge variant="error">{t('hospitals.emergencyBadge')}</Badge>
                    )}
                  </div>
                </div>
                <p className={styles.itemMeta}>{h.address}</p>
                <p className={styles.itemDesc}>
                  <strong>{t('hospitals.hours')}:</strong> {h.hours}
                </p>
                <p className={styles.itemDesc}>
                  <strong>{t('hospitals.supports')}:</strong>{' '}
                  {h.supportedCategories.map((c) => t(`categories.${c}`)).join(', ')}
                </p>
                <div className={styles.itemActions}>
                  <a
                    href={`tel:${h.phone}`}
                    className={`${styles.linkAction} ${styles.callAction}`}
                    aria-label={`${h.name}, ${t('common.phone')}, ${h.phone}`}
                  >
                    <span aria-hidden="true">☎</span>
                    <span>{h.phone}</span>
                  </a>
                  <a
                    href={h.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${styles.linkAction} ${styles.mapAction}`}
                  >
                    {t('common.openMap')} ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className={styles.mapPanel} aria-label={t('common.openMap')}>
          <KakaoMap center={mapCenter} markers={mapMarkers} height={360} />
        </aside>
      </div>
    </section>
  )
}

export default Hospitals
