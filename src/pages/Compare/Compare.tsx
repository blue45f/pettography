import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useSpeciesList, type Species } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import styles from './Compare.module.css'

const MAX_PICKS = 3

function Compare() {
  const { t } = useTranslation()
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

  const { data: allSpecies = [], isLoading } = useSpeciesList({})

  const pickedSpecies = useMemo(
    () =>
      picked
        .map((id) => allSpecies.find((s) => s.id === id || s.slug === id))
        .filter(Boolean) as Species[],
    [picked, allSpecies]
  )

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
    if (picked.includes(id)) {
      setPicked(picked.filter((x) => x !== id))
    } else if (picked.length < MAX_PICKS) {
      setPicked([...picked, id])
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
            {t('compare.pickerTitle', { current: picked.length, max: MAX_PICKS })}
          </h2>
          {picked.length > 0 && (
            <button type="button" onClick={clear} className={styles.clearButton}>
              {t('compare.clear')}
            </button>
          )}
        </header>
        {isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        <div className={styles.pickerGrid} role="listbox" aria-multiselectable="true">
          {allSpecies.map((sp) => {
            const isPicked = picked.includes(sp.id)
            const disabled = !isPicked && picked.length >= MAX_PICKS
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
      </section>

      {pickedSpecies.length === 0 ? (
        <EmptyState icon="🆚" title={t('compare.empty')} />
      ) : (
        <section aria-labelledby="grid-heading" className={styles.section}>
          <h2 id="grid-heading" className={styles.sectionTitle}>
            {t('compare.gridTitle')}
          </h2>
          <div
            className={styles.compareGrid}
            style={{
              gridTemplateColumns: `minmax(0, 160px) repeat(${pickedSpecies.length}, minmax(0, 1fr))`,
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
                      ₩{sp.monthlyBudgetKrw.toLocaleString('ko')}
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
        </section>
      )}
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
