import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Skeleton from '@components/common/Skeleton'
import {
  LINK_CATEGORIES,
  useExternalLinks,
  type LinkCategory,
  type SpeciesCategory as ExtSpeciesCategory,
} from '@features/external-links'
import { useOnboardingStore } from '@features/onboarding'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Resources.module.css'

import type { SpeciesCategory } from '@features/species'

const RESOURCES_SPECIES_FILTER: readonly (ExtSpeciesCategory | 'all')[] = [
  'all',
  'general',
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const

function Resources() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('resources.title'))

  const [linkCategory, setLinkCategory] = useState<LinkCategory | 'all'>('all')
  const [speciesCategory, setSpeciesCategory] = useState<ExtSpeciesCategory | 'all'>(
    (profile.category as SpeciesCategory | null) ?? 'all',
  )
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const { data, isLoading } = useExternalLinks({
    category: linkCategory === 'all' ? undefined : linkCategory,
    speciesCategory: speciesCategory === 'all' ? undefined : speciesCategory,
  })

  const filtered = useMemo(() => {
    if (!data) return undefined
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.region ?? '').toLowerCase().includes(q),
    )
  }, [data, deferredQuery])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('resources.title')}</h1>
        <p className={styles.subtitle}>{t('resources.subtitle')}</p>
      </header>

      <div className={styles.controls}>
        <Input
          type="search"
          placeholder={t('resources.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('resources.searchPlaceholder')}
        />
      </div>

      <div
        role="radiogroup"
        aria-label={t('resources.filterByLinkCategory')}
        className={styles.filters}
      >
        <button
          type="button"
          role="radio"
          aria-checked={linkCategory === 'all'}
          className={[styles.filterChip, linkCategory === 'all' ? styles.filterActive : ''].join(
            ' ',
          )}
          onClick={() => setLinkCategory('all')}
        >
          {t('resources.filterAll')}
        </button>
        {LINK_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={linkCategory === c}
            className={[styles.filterChip, linkCategory === c ? styles.filterActive : ''].join(' ')}
            onClick={() => setLinkCategory(c)}
          >
            {t(`resources.categories.${c}`)}
          </button>
        ))}
      </div>

      <div
        role="radiogroup"
        aria-label={t('resources.filterByCategory')}
        className={styles.filters}
      >
        {RESOURCES_SPECIES_FILTER.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={speciesCategory === c}
            className={[
              styles.filterChip,
              styles.filterChipSubtle,
              speciesCategory === c ? styles.filterActive : '',
            ].join(' ')}
            onClick={() => setSpeciesCategory(c)}
          >
            {c === 'all' ? t('resources.filterAll') : t(`resources.speciesCategories.${c}`)}
          </button>
        ))}
      </div>

      <p className={styles.countLine}>
        {filtered ? `${filtered.length} / ${data?.length ?? 0}` : '...'}
      </p>

      {isLoading && <Skeleton variant="rectangular" height={100} lines={3} />}
      {filtered && filtered.length === 0 && (
        <EmptyState icon="🔍" title={t('resources.noResult')} />
      )}

      <ul className={styles.list}>
        {filtered?.map((item) => (
          <li key={item.id}>
            <Card padding="md">
              <Card.Body>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{item.name}</h2>
                  <Badge variant="primary">{t(`resources.categories.${item.category}`)}</Badge>
                </div>
                <p className={styles.itemDesc}>{item.description}</p>
                <div className={styles.itemMeta}>
                  {item.region && (
                    <span>
                      {t('resources.regionLabel')}: {item.region}
                    </span>
                  )}
                  {item.badge && <Badge variant="success">{item.badge}</Badge>}
                  <span className={styles.speciesTags}>
                    {item.speciesCategories.map((c) => (
                      <Badge key={c} variant="default">
                        {t(`resources.speciesCategories.${c}`)}
                      </Badge>
                    ))}
                  </span>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className={styles.linkAction}>
                  {t('resources.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Resources
