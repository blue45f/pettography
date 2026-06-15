import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Skeleton from '@components/common/Skeleton'
import {
  SPECIES_CATEGORIES,
  useSpeciesList,
  type Difficulty,
  type SpeciesCategory,
} from '@domains/species'
import usePageMeta from '@hooks/usePageMeta'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import styles from './SpeciesCatalog.module.css'

const DIFFICULTIES: readonly Difficulty[] = ['beginner', 'intermediate', 'advanced'] as const
const COMPARE_MAX = 3

const SORT_OPTIONS = ['relevance', 'nameAsc', 'lifespanDesc', 'budgetAsc'] as const
type SortKey = (typeof SORT_OPTIONS)[number]

function SpeciesCatalog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  usePageMeta({
    title: `${t('species.catalogTitle')} · ${t('common.appName')}`,
    description: t('pageMeta.speciesDescription'),
    path: '/species',
  })

  const [category, setCategory] = useState<SpeciesCategory | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [comparePicks, setComparePicks] = useState<string[]>([])
  const deferredQuery = useDeferredValue(query)

  const hasActiveFilters = category !== 'all' || difficulty !== 'all' || query.trim() !== ''

  function resetFilters() {
    setCategory('all')
    setDifficulty('all')
    setQuery('')
  }

  function toggleCompare(id: string) {
    setComparePicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= COMPARE_MAX) return prev
      return [...prev, id]
    })
  }

  function openCompare() {
    if (comparePicks.length === 0) return
    navigate(`/compare?species=${comparePicks.join(',')}`)
  }

  const { data, isLoading, isError } = useSpeciesList(category === 'all' ? {} : { category })

  const filtered = useMemo(() => {
    if (!data) return undefined
    const q = deferredQuery.trim().toLowerCase()
    const matches = data.filter((s) => {
      if (difficulty !== 'all' && s.difficulty !== difficulty) return false
      if (!q) return true
      return (
        s.koreanName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        s.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
    // 'relevance' keeps the curated seed order; other keys sort a copy so the
    // source array is never mutated.
    if (sort === 'relevance') return matches
    const sorted = [...matches]
    if (sort === 'nameAsc') {
      sorted.sort((a, b) => a.koreanName.localeCompare(b.koreanName))
    } else if (sort === 'lifespanDesc') {
      sorted.sort((a, b) => b.lifespanMaxYears - a.lifespanMaxYears)
    } else if (sort === 'budgetAsc') {
      sorted.sort((a, b) => a.monthlyBudgetKrw - b.monthlyBudgetKrw)
    }
    return sorted
  }, [data, deferredQuery, difficulty, sort])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('species.catalogTitle')}</h1>
        <p className={styles.subtitle}>{t('species.catalogSubtitle')}</p>
      </header>

      <div className={styles.controls}>
        <Input
          type="search"
          placeholder={t('species.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('species.searchPlaceholder')}
        />
      </div>

      <div role="radiogroup" aria-label={t('species.categoryFilter')} className={styles.filters}>
        <button
          type="button"
          role="radio"
          aria-checked={category === 'all'}
          className={[styles.filterChip, category === 'all' ? styles.filterActive : ''].join(' ')}
          onClick={() => setCategory('all')}
        >
          {t('species.filterAll')}
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

      <div role="radiogroup" aria-label={t('species.difficultyFilter')} className={styles.filters}>
        <button
          type="button"
          role="radio"
          aria-checked={difficulty === 'all'}
          className={[
            styles.filterChip,
            styles.filterChipSubtle,
            difficulty === 'all' ? styles.filterActive : '',
          ].join(' ')}
          onClick={() => setDifficulty('all')}
        >
          {t('species.filterAll')}
        </button>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={difficulty === d}
            className={[
              styles.filterChip,
              styles.filterChipSubtle,
              difficulty === d ? styles.filterActive : '',
            ].join(' ')}
            onClick={() => setDifficulty(d)}
          >
            {t(`difficulty.${d}`)}
          </button>
        ))}
      </div>

      <div className={styles.resultRow}>
        <p className={styles.countLine}>
          {filtered ? t('species.resultCount', { count: filtered.length }) : '...'}
        </p>
        <Select
          className={styles.sortSelect}
          aria-label={t('species.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          options={SORT_OPTIONS.map((key) => ({
            value: key,
            label: t(`species.sort${key.charAt(0).toUpperCase()}${key.slice(1)}`),
          }))}
        />
      </div>

      {isLoading && <Skeleton variant="rectangular" height={100} lines={3} />}
      {isError && (
        <EmptyState
          variant="discover"
          icon="⚠️"
          title={t('common.error')}
          description={t('common.loadErrorHint')}
        />
      )}
      {!isError && filtered && filtered.length === 0 && (
        <EmptyState
          variant="discover"
          icon="🔍"
          title={t('species.noResult')}
          description={t('species.noResultHint')}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                {t('species.resetFilters')}
              </Button>
            ) : undefined
          }
        />
      )}

      <ul className={styles.grid}>
        {filtered?.map((s) => {
          const isPicked = comparePicks.includes(s.id)
          const canPick = comparePicks.length < COMPARE_MAX || isPicked
          return (
            <li key={s.id} className={styles.gridItem}>
              <Link to={`/species/${s.slug}`} className={styles.cardLink}>
                <Card padding="lg" hoverable className={styles.card}>
                  <Card.Body>
                    <div className={styles.cardHeader}>
                      <span aria-hidden="true" className={styles.emoji}>
                        {s.heroEmoji}
                      </span>
                      <div>
                        <h2 className={styles.cardTitle}>{s.koreanName}</h2>
                        <p className={styles.scientific}>{s.scientificName}</p>
                      </div>
                    </div>
                    <p className={styles.summary}>{s.summary}</p>
                    <div className={styles.badges}>
                      <Badge variant="primary">{t(`categories.${s.category}`)}</Badge>
                      <Badge variant="default">{t(`difficulty.${s.difficulty}`)}</Badge>
                      <Badge variant="success">
                        {t('care.lifespanYears', {
                          min: s.lifespanMinYears,
                          max: s.lifespanMaxYears,
                        })}
                      </Badge>
                      <Badge variant="warning">
                        {t('species.monthlyBudgetBadge', {
                          amount: s.monthlyBudgetKrw.toLocaleString('ko'),
                        })}
                      </Badge>
                    </div>
                    <span className={styles.cta}>{t('species.openDetail')} →</span>
                  </Card.Body>
                </Card>
              </Link>
              <button
                type="button"
                className={[styles.compareTick, isPicked ? styles.compareTickOn : ''].join(' ')}
                aria-pressed={isPicked}
                aria-label={
                  isPicked
                    ? t('species.compareTickRemove')
                    : t('species.compareTickAdd', { name: s.koreanName })
                }
                disabled={!canPick}
                onClick={(e) => {
                  e.preventDefault()
                  toggleCompare(s.id)
                }}
              >
                {isPicked ? '✓' : '+'}
              </button>
            </li>
          )
        })}
      </ul>

      {comparePicks.length > 0 && (
        <div className={styles.compareBar} role="region" aria-label={t('species.compareBarLabel')}>
          <span className={styles.compareBarLabel}>
            {t('species.compareBarPicked', { count: comparePicks.length, max: COMPARE_MAX })}
          </span>
          <div className={styles.compareBarActions}>
            <button
              type="button"
              className={styles.compareBarClear}
              onClick={() => setComparePicks([])}
            >
              {t('species.compareBarClear')}
            </button>
            <button type="button" className={styles.compareBarGo} onClick={openCompare}>
              {t('species.compareBarGo')} →
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default SpeciesCatalog
