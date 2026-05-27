import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Select from '@components/common/Select'
import Skeleton from '@components/common/Skeleton'
import { useHospitalsList, type HospitalWithDistance } from '@features/hospitals'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

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

  const { data, isLoading } = useHospitalsList({
    category: category === 'all' ? undefined : category,
    origin,
  })

  const sorted = useMemo(() => (data ? sortHospitals(data, sort) : data), [data, sort])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('hospitals.title')}</h1>
        <p className={styles.subtitle}>{t('hospitals.subtitle')}</p>
        {profile.location && (
          <p className={styles.locationNote}>
            {t('dashboard.locationNote', { label: profile.location.label })}
          </p>
        )}
      </header>

      <div
        role="radiogroup"
        aria-label={t('hospitals.filterByCategory')}
        className={styles.filters}
      >
        <button
          type="button"
          role="radio"
          aria-checked={category === 'all'}
          className={[styles.filterChip, category === 'all' ? styles.filterActive : ''].join(' ')}
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

      <div className={styles.sortRow}>
        <Select
          label={t('hospitals.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as HospitalSort)}
          options={[
            { value: 'distance', label: t('hospitals.sortDistance') },
            { value: 'name', label: t('hospitals.sortName') },
            { value: 'emergency', label: t('hospitals.sortEmergency') },
          ]}
          disabled={!profile.location && sort === 'distance'}
        />
      </div>

      <div className={styles.mapPlaceholder} aria-hidden="true">
        🗺️ {t('hospitals.mapPlaceholder')}
      </div>

      {isLoading && <Skeleton variant="rectangular" height={120} lines={3} />}
      {sorted && sorted.length === 0 && <EmptyState icon="🏥" title={t('hospitals.noResult')} />}

      <ul className={styles.list}>
        {sorted?.map((h) => (
          <li key={h.id}>
            <Card padding="md">
              <Card.Body>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{h.name}</h2>
                  {h.hasEmergency && <Badge variant="error">{t('hospitals.emergencyBadge')}</Badge>}
                </div>
                <p className={styles.itemMeta}>
                  {h.address}
                  {Number.isFinite(h.distanceKm) && ` · ${h.distanceKm}km`}
                </p>
                <p className={styles.itemDesc}>
                  <strong>{t('hospitals.hours')}:</strong> {h.hours}
                </p>
                <p className={styles.itemDesc}>
                  <strong>{t('hospitals.supports')}:</strong>{' '}
                  {h.supportedCategories.map((c) => t(`categories.${c}`)).join(', ')}
                </p>
                <div className={styles.itemActions}>
                  <a href={`tel:${h.phone}`} className={styles.linkAction}>
                    {t('common.phone')}: {h.phone}
                  </a>
                  <a href={h.mapUrl} target="_blank" rel="noreferrer" className={styles.linkAction}>
                    {t('common.openMap')} ↗
                  </a>
                </div>
              </Card.Body>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Hospitals
