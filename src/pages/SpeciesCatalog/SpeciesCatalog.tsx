import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Reveal from '@components/common/Reveal'
import Select from '@components/common/Select'
import Skeleton from '@components/common/Skeleton'
import { SponsoredRail } from '@components/deskcloud/SponsoredRail'
import {
  SPECIES_CATEGORIES,
  useSpeciesList,
  type Difficulty,
  type SpeciesCategory,
} from '@domains/species'
import usePageMeta from '@hooks/usePageMeta'
import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'

import styles from './SpeciesCatalog.module.css'

const DIFFICULTIES: readonly Difficulty[] = ['beginner', 'intermediate', 'advanced'] as const
const COMPARE_MAX = 3

const SORT_OPTIONS = ['relevance', 'nameAsc', 'lifespanDesc', 'budgetAsc'] as const
type SortKey = (typeof SORT_OPTIONS)[number]

const CATEGORY_VALUES = new Set<string>(SPECIES_CATEGORIES)
const DIFFICULTY_VALUES = new Set<string>(DIFFICULTIES)
const SORT_VALUES = new Set<string>(SORT_OPTIONS)

/** Read a typed enum value from the URL, falling back when absent or invalid. */
function readParam<T extends string>(raw: string | null, allowed: Set<string>, fallback: T): T {
  return raw && allowed.has(raw) ? (raw as T) : fallback
}

function SpeciesCatalog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  usePageMeta({
    title: `${t('species.catalogTitle')} · ${t('common.appName')}`,
    description: t('pageMeta.speciesDescription'),
    path: '/species',
  })

  // Filter/sort live in the URL so a curated browse is shareable, bookmarkable,
  // and survives a refresh — matching how /compare already deep-links picks.
  const [params, setParams] = useSearchParams()
  const category = readParam<SpeciesCategory | 'all'>(
    params.get('category'),
    CATEGORY_VALUES,
    'all'
  )
  const difficulty = readParam<Difficulty | 'all'>(
    params.get('difficulty'),
    DIFFICULTY_VALUES,
    'all'
  )
  const sort = readParam<SortKey>(params.get('sort'), SORT_VALUES, 'relevance')
  const query = params.get('q') ?? ''
  const [comparePicks, setComparePicks] = useState<string[]>([])
  const deferredQuery = useDeferredValue(query)

  const hasActiveFilters = category !== 'all' || difficulty !== 'all' || query.trim() !== ''

  // Write one param, dropping it when it returns to the default so URLs stay
  // tidy. `replace` keeps filter tweaks out of the history stack.
  const patchParam = useCallback(
    (key: string, value: string, isDefault: boolean) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (isDefault) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true }
      )
    },
    [setParams]
  )

  const setCategory = useCallback(
    (value: SpeciesCategory | 'all') => patchParam('category', value, value === 'all'),
    [patchParam]
  )
  const setDifficulty = useCallback(
    (value: Difficulty | 'all') => patchParam('difficulty', value, value === 'all'),
    [patchParam]
  )
  const setSort = useCallback(
    (value: SortKey) => patchParam('sort', value, value === 'relevance'),
    [patchParam]
  )
  const setQuery = useCallback(
    (value: string) => patchParam('q', value, value.trim() === ''),
    [patchParam]
  )

  const resetFilters = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('category')
        next.delete('difficulty')
        next.delete('q')
        return next
      },
      { replace: true }
    )
  }, [setParams])

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
        <div className={styles.resultMeta}>
          <p className={styles.countLine}>
            {filtered ? t('species.resultCount', { count: filtered.length }) : '...'}
          </p>
          {hasActiveFilters && (
            <button type="button" className={styles.resetChip} onClick={resetFilters}>
              {t('species.resetFilters')} ✕
            </button>
          )}
        </div>
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

      {/* 추천(Sponsored) 레일 — 네이티브 AdDesk; 서빙될 때만 렌더 */}
      <SponsoredRail />

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
        {filtered?.map((s, idx) => {
          const isPicked = comparePicks.includes(s.id)
          const canPick = comparePicks.length < COMPARE_MAX || isPicked
          return (
            <Reveal as="li" key={s.id} delay={Math.min(idx, 8) * 45} className={styles.gridItem}>
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
            </Reveal>
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
