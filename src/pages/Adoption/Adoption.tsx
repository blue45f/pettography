import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Skeleton from '@components/common/Skeleton'
import { useAdoptionList } from '@domains/adoption'
import { useOnboardingStore } from '@domains/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Adoption.module.css'

function Adoption() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('adoption.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const { data, isLoading, isError, refetch } = useAdoptionList({
    category: category === 'all' ? undefined : category,
  })
  const needle = deferredSearch.trim().toLowerCase()
  const visible = data?.filter(
    (listing) =>
      isHttpUrl(listing.url) &&
      (!needle ||
        listing.name.toLowerCase().includes(needle) ||
        listing.region.toLowerCase().includes(needle) ||
        listing.description.toLowerCase().includes(needle))
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('adoption.title')}</h1>
        <p className={styles.subtitle}>{t('adoption.subtitle')}</p>
      </header>

      <Input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('forum.searchPlaceholder')}
        aria-label={t('forum.searchLabel')}
        className={styles.searchInput}
      />

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

      {isLoading && <Skeleton variant="rectangular" height={100} lines={3} />}
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
      {!isError && visible && visible.length === 0 && (
        <EmptyState
          icon="🤝"
          title={t('adoption.noResult')}
          action={
            category !== 'all' || search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategory('all')
                  setSearch('')
                }}
              >
                {t('species.resetFilters')}
              </Button>
            ) : undefined
          }
        />
      )}

      <ul className={styles.list}>
        {visible?.map((a) => (
          <li key={a.id} className={styles.listItem}>
            <article>
              <div className={styles.itemHeader}>
                <h2 className={styles.itemTitle}>{a.name}</h2>
                <Badge variant="primary">{t(`adoption.kind${capitalize(a.kind)}`)}</Badge>
              </div>
              <p className={styles.itemMeta}>{a.region}</p>
              <p className={styles.itemDesc}>{a.description}</p>
              {a.badge && <Badge variant="success">{a.badge}</Badge>}{' '}
              <a
                href={a.url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkAction}
              >
                {t('common.openLink')} ↗
              </a>{' '}
              <Link to="/contact?category=contact" className={styles.linkAction}>
                {t('adoption.inquireCta')}
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

export default Adoption
