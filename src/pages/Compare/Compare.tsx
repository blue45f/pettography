import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Skeleton from '@components/common/Skeleton'
import { useSpeciesList, type Species } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import styles from './Compare.module.css'

const MAX_PICKS = 3

function Compare() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('compare.title'))

  const [params, setParams] = useSearchParams()
  const picked = useMemo(() => {
    const raw = params.get('species')
    if (!raw) return [] as string[]
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_PICKS)
  }, [params])

  const { data: allSpecies = [], isLoading, isError, refetch } = useSpeciesList({})
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  // Unknown or stale URL ids must not consume one of the three selection slots.
  const effectivePicks = useMemo(() => {
    const normalized = picked
      .map((id) => allSpecies.find((sp) => sp.id === id || sp.slug === id))
      .filter((sp): sp is Species => Boolean(sp))
      .map((sp) => sp.id)
    return Array.from(new Set(normalized)).slice(0, MAX_PICKS)
  }, [picked, allSpecies])

  const pickedSpecies = useMemo(
    () =>
      effectivePicks
        .map((id) => allSpecies.find((s) => s.id === id || s.slug === id))
        .filter(Boolean) as Species[],
    [effectivePicks, allSpecies]
  )

  const visibleSpecies = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase()
    if (!normalized) return allSpecies
    return allSpecies.filter(
      (sp) =>
        sp.koreanName.toLowerCase().includes(normalized) ||
        sp.scientificName.toLowerCase().includes(normalized) ||
        sp.tags.some((tag) => tag.toLowerCase().includes(normalized))
    )
  }, [allSpecies, deferredQuery])

  function setPicked(next: string[]) {
    const dedup = Array.from(new Set(next)).slice(0, MAX_PICKS)
    const sp = new URLSearchParams(params)
    if (dedup.length === 0) {
      sp.delete('species')
    } else {
      sp.set('species', dedup.join(','))
    }
    setParams(sp, { replace: true })
  }

  function toggle(id: string) {
    if (effectivePicks.includes(id)) {
      setPicked(effectivePicks.filter((x) => x !== id))
    } else if (effectivePicks.length < MAX_PICKS) {
      setPicked([...effectivePicks, id])
    }
  }

  function clear() {
    setPicked([])
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('compare.title')}</h1>
        <p className={styles.subtitle}>{t('compare.subtitle', { max: MAX_PICKS })}</p>
      </header>

      <section aria-labelledby="picker-heading" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="picker-heading" className={styles.sectionTitle}>
            {t('compare.pickerTitle', { current: effectivePicks.length, max: MAX_PICKS })}
          </h2>
          {effectivePicks.length > 0 && (
            <button type="button" onClick={clear} className={styles.clearButton}>
              {t('compare.clear')}
            </button>
          )}
        </header>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('species.searchPlaceholder')}
          aria-label={t('species.searchPlaceholder')}
          className={styles.searchInput}
        />
        {isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        {isError && (
          <EmptyState
            icon="⚠️"
            title={t('common.error')}
            description={t('common.loadErrorHint')}
            action={
              <button type="button" className={styles.retryButton} onClick={() => void refetch()}>
                {t('common.retry')}
              </button>
            }
          />
        )}
        <div className={styles.pickerGrid} role="listbox" aria-multiselectable="true">
          {visibleSpecies.map((sp) => {
            const isPicked = effectivePicks.includes(sp.id)
            const disabled = !isPicked && effectivePicks.length >= MAX_PICKS
            return (
              <button
                key={sp.id}
                type="button"
                role="option"
                aria-selected={isPicked}
                aria-disabled={disabled}
                disabled={disabled}
                onClick={() => toggle(sp.id)}
                className={[
                  styles.pickerChip,
                  isPicked ? styles.pickerChipActive : '',
                  disabled ? styles.pickerChipDisabled : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span aria-hidden="true">{sp.heroEmoji}</span>
                <span>{sp.koreanName}</span>
              </button>
            )
          })}
        </div>
        {!isLoading && !isError && visibleSpecies.length === 0 && (
          <EmptyState
            icon="🔍"
            title={t('species.noResult')}
            description={t('species.noResultHint')}
          />
        )}
      </section>

      {!isLoading &&
        !isError &&
        (pickedSpecies.length === 0 ? (
          <EmptyState icon="🆚" title={t('compare.empty')} />
        ) : (
          <section aria-labelledby="grid-heading" className={styles.section}>
            <h2 id="grid-heading" className={styles.sectionTitle}>
              {t('compare.gridTitle')}
            </h2>
            <div className={styles.compareScroll} aria-label={t('compare.gridTitle')}>
              <div
                className={styles.compareGrid}
                style={{
                  gridTemplateColumns: `140px repeat(${pickedSpecies.length}, minmax(200px, 1fr))`,
                  minWidth: `${140 + pickedSpecies.length * 200}px`,
                }}
              >
                <div className={styles.cornerCell}></div>
                {pickedSpecies.map((sp) => (
                  <div key={`head-${sp.id}`} className={styles.headerCell}>
                    <span aria-hidden="true" className={styles.headerEmoji}>
                      {sp.heroEmoji}
                    </span>
                    <Link to={`/species/${sp.slug}`} className={styles.headerName}>
                      {sp.koreanName}
                    </Link>
                    <span className={styles.headerScientific}>{sp.scientificName}</span>
                  </div>
                ))}

                {(
                  [
                    {
                      key: 'category',
                      label: t('compare.rows.category'),
                      render: (sp: Species) => (
                        <Badge variant="primary">{t(`categories.${sp.category}`)}</Badge>
                      ),
                    },
                    {
                      key: 'difficulty',
                      label: t('compare.rows.difficulty'),
                      render: (sp: Species) => (
                        <Badge variant="default">{t(`difficulty.${sp.difficulty}`)}</Badge>
                      ),
                    },
                    {
                      key: 'lifespan',
                      label: t('compare.rows.lifespan'),
                      render: (sp: Species) => (
                        <span className={styles.numCell}>
                          {sp.lifespanMinYears}~{sp.lifespanMaxYears}
                          {t('compare.units.years')}
                        </span>
                      ),
                    },
                    {
                      key: 'space',
                      label: t('compare.rows.space'),
                      render: (sp: Species) => t(`compare.values.space.${sp.spaceNeed}`),
                    },
                    {
                      key: 'handling',
                      label: t('compare.rows.handling'),
                      render: (sp: Species) => t(`compare.values.handling.${sp.handlingTolerance}`),
                    },
                    {
                      key: 'activity',
                      label: t('compare.rows.activity'),
                      render: (sp: Species) => t(`compare.values.activity.${sp.activityPattern}`),
                    },
                    {
                      key: 'budget',
                      label: t('compare.rows.budget'),
                      render: (sp: Species) => (
                        <span className={styles.numCell}>
                          ₩
                          {sp.monthlyBudgetKrw.toLocaleString(
                            i18n.resolvedLanguage ?? i18n.language
                          )}
                          {t('compare.units.perMonth')}
                        </span>
                      ),
                    },
                    {
                      key: 'beginnerTip',
                      label: t('compare.rows.beginnerTip'),
                      render: (sp: Species) => sp.beginnerTip,
                    },
                    {
                      key: 'commonProblem',
                      label: t('compare.rows.commonProblem'),
                      render: (sp: Species) => sp.commonProblem,
                    },
                  ] as const
                ).map((row) => (
                  <FragmentRow key={row.key} label={row.label}>
                    {pickedSpecies.map((sp) => (
                      <div key={`${row.key}-${sp.id}`} className={styles.cell}>
                        {row.render(sp)}
                      </div>
                    ))}
                  </FragmentRow>
                ))}
              </div>
            </div>
          </section>
        ))}
    </section>
  )
}

function FragmentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className={styles.rowLabel}>{label}</div>
      {children}
    </>
  )
}

export default Compare
