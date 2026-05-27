import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useOnboardingStore } from '@features/onboarding'
import { useShopsList, type ShopKind } from '@features/shops'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Shops.module.css'

const KINDS: readonly (ShopKind | 'all')[] = ['all', 'food', 'equipment', 'both'] as const

function Shops() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('shops.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [kind, setKind] = useState<ShopKind | 'all'>('all')

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location]
  )

  const { data, isLoading } = useShopsList({
    category: category === 'all' ? undefined : category,
    kind: kind === 'all' ? undefined : kind,
    origin,
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('shops.title')}</h1>
        <p className={styles.subtitle}>{t('shops.subtitle')}</p>
      </header>

      <div className={styles.filterGroups}>
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

        <div role="radiogroup" aria-label="Kind filter" className={styles.filters}>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              className={[styles.filterChip, kind === k ? styles.filterActive : ''].join(' ')}
              onClick={() => setKind(k)}
            >
              {k === 'all' ? t('hospitals.filterAll') : t(`shops.kind${capitalize(k)}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Skeleton variant="rectangular" height={120} lines={3} />}
      {data && data.length === 0 && <EmptyState icon="🛒" title={t('shops.noResult')} />}

      <ul className={styles.list}>
        {data?.map((s) => (
          <li key={s.id}>
            <Card padding="md">
              <Card.Body>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{s.name}</h2>
                  <Badge variant="primary">{t(`shops.kind${capitalize(s.kind)}`)}</Badge>
                </div>
                <p className={styles.itemMeta}>
                  {s.address ? (
                    <>
                      {s.district} · {s.address}
                      {s.distanceKm !== null && ` · ${s.distanceKm}km`}
                    </>
                  ) : (
                    t('shops.online')
                  )}
                </p>
                <p className={styles.itemDesc}>{s.notes}</p>
                {s.online && (
                  <a className={styles.linkAction} href={s.online} target="_blank" rel="noreferrer">
                    {t('shops.visitSite')} ↗
                  </a>
                )}
              </Card.Body>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

export default Shops
