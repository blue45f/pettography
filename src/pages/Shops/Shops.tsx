import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Skeleton from '@components/common/Skeleton'
import { useOnboardingStore } from '@domains/onboarding'
import { useShopsList, type ShopKind, type ShopWithDistance } from '@domains/shops'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Shops.module.css'

const KINDS: readonly (ShopKind | 'all')[] = ['all', 'food', 'equipment', 'both'] as const

type ShopSort = 'distance' | 'name' | 'online'

function sortShops(list: ShopWithDistance[], sort: ShopSort, locale: string): ShopWithDistance[] {
  const copy = [...list]
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, locale))
    case 'online':
      return copy.sort((a, b) => {
        const aOnline = a.online !== null ? 1 : 0
        const bOnline = b.online !== null ? 1 : 0
        if (aOnline !== bOnline) return bOnline - aOnline
        return a.name.localeCompare(b.name, locale)
      })
    case 'distance':
    default:
      return copy.sort((a, b) => {
        const ad = a.distanceKm ?? Number.POSITIVE_INFINITY
        const bd = b.distanceKm ?? Number.POSITIVE_INFINITY
        return ad - bd
      })
  }
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function Shops() {
  const { t, i18n } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('shops.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [kind, setKind] = useState<ShopKind | 'all'>('all')
  const [sort, setSort] = useState<ShopSort>(profile.location ? 'distance' : 'name')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location]
  )

  const { data, isLoading, isError, refetch } = useShopsList({
    category: category === 'all' ? undefined : category,
    kind: kind === 'all' ? undefined : kind,
    origin,
  })

  const sorted = useMemo(() => {
    if (!data) return data
    const needle = deferredSearch.trim().toLowerCase()
    const filtered = data.filter(
      (shop) =>
        !needle ||
        [shop.name, shop.district ?? '', shop.address ?? '', shop.notes].some((value) =>
          value.toLowerCase().includes(needle)
        )
    )
    return sortShops(filtered, sort, i18n.resolvedLanguage ?? i18n.language)
  }, [data, deferredSearch, i18n.language, i18n.resolvedLanguage, sort])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('shops.title')}</h1>
        <p className={styles.subtitle}>{t('shops.subtitle')}</p>
      </header>

      <Input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('forum.searchPlaceholder')}
        aria-label={t('forum.searchLabel')}
        className={styles.searchInput}
      />

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

        <div role="radiogroup" aria-label={t('shops.filterByKind')} className={styles.filters}>
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

      <div className={styles.sortRow}>
        <Select
          label={t('shops.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as ShopSort)}
          options={[
            ...(profile.location ? [{ value: 'distance', label: t('shops.sortDistance') }] : []),
            { value: 'name', label: t('shops.sortName') },
            { value: 'online', label: t('shops.sortOnline') },
          ]}
        />
      </div>

      {isLoading && <Skeleton variant="rectangular" height={120} lines={3} />}
      {isError && (
        <EmptyState
          icon="⚠️"
          title={t('common.error')}
          description={t('common.loadErrorHint')}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      )}
      {sorted && sorted.length === 0 && (
        <EmptyState
          variant="discover"
          icon="🛒"
          title={t('shops.noResult')}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCategory('all')
                setKind('all')
                setSort(profile.location ? 'distance' : 'name')
                setSearch('')
              }}
            >
              {t('species.resetFilters')}
            </Button>
          }
        />
      )}

      <ul className={styles.list}>
        {sorted?.map((s) => (
          <li key={s.id} className={styles.listItem}>
            <article>
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
              {s.online && isHttpUrl(s.online) && (
                <a
                  className={styles.linkAction}
                  href={s.online.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('shops.visitSite')} ↗
                </a>
              )}
              {!profile.location && s.address && (
                <Link to="/onboarding" className={styles.locationLink}>
                  {t('onboarding.locationTitle')}
                </Link>
              )}
            </article>
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
