import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useCommunitiesList } from '@features/communities'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import styles from './Communities.module.css'

const COMMUNITY_DEMO_LOG_KEY = 'pettography-community-demo-log-v1'
const COMMUNITY_DEMO_LOG_LIMIT = 40

type CommunityDemoAction = 'filter' | 'open' | 'suggest'
type CommunityDemoLog = {
  id: string
  at: number
  action: CommunityDemoAction
  label: string
  detail?: string
}

const makeCommunityDemoLogId = () =>
  `pet-community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const readCommunityDemoLogs = (): CommunityDemoLog[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(COMMUNITY_DEMO_LOG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is CommunityDemoLog => {
        const candidate = item as Partial<CommunityDemoLog>
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.at === 'number' &&
          typeof candidate.action === 'string' &&
          typeof candidate.label === 'string'
        )
      })
      .slice(-COMMUNITY_DEMO_LOG_LIMIT)
  } catch {
    return []
  }
}

const writeCommunityDemoLogs = (logs: CommunityDemoLog[]) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      COMMUNITY_DEMO_LOG_KEY,
      JSON.stringify(logs.slice(-COMMUNITY_DEMO_LOG_LIMIT))
    )
  } catch {
    // Demo log persistence is optional.
  }
}

function Communities() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('communities.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [demoLogs, setDemoLogs] = useState<CommunityDemoLog[]>(readCommunityDemoLogs)
  const { data, isLoading } = useCommunitiesList({
    category: category === 'all' ? undefined : category,
  })

  const recordDemoLog = (action: CommunityDemoAction, label: string, detail?: string) => {
    const next = [
      ...demoLogs,
      { id: makeCommunityDemoLogId(), at: Date.now(), action, label, detail },
    ].slice(-COMMUNITY_DEMO_LOG_LIMIT)
    writeCommunityDemoLogs(next)
    setDemoLogs(next)
  }

  const demoSummary = useMemo(
    () => ({
      filterCount: demoLogs.filter((log) => log.action === 'filter').length,
      openCount: demoLogs.filter((log) => log.action === 'open').length,
      suggestCount: demoLogs.filter((log) => log.action === 'suggest').length,
    }),
    [demoLogs]
  )
  const recentDemoLogs = useMemo(() => demoLogs.slice().reverse().slice(0, 3), [demoLogs])
  const selectCategory = (next: SpeciesCategory | 'all', label: string) => {
    setCategory(next)
    recordDemoLog('filter', t('communities.demoFilterAction'), label)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('communities.title')}</h1>
        <p className={styles.subtitle}>{t('communities.subtitle')}</p>
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
          onClick={() => selectCategory('all', t('hospitals.filterAll'))}
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
            onClick={() => selectCategory(c, t(`categories.${c}`))}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      <Card padding="md" className={styles.demoCard}>
        <Card.Body>
          <div className={styles.demoHeader}>
            <div>
              <p className={styles.demoKicker}>{t('communities.demoKicker')}</p>
              <h2 className={styles.demoTitle}>{t('communities.demoTitle')}</h2>
              <p className={styles.demoDesc}>{t('communities.demoDesc')}</p>
            </div>
            <div className={styles.demoMetrics} aria-label={t('communities.demoMetrics')}>
              <span>{t('communities.demoFilters', { count: demoSummary.filterCount })}</span>
              <span>{t('communities.demoOpens', { count: demoSummary.openCount })}</span>
              <span>{t('communities.demoSuggestions', { count: demoSummary.suggestCount })}</span>
            </div>
          </div>
          <div className={styles.demoChecklist}>
            <span className={demoSummary.filterCount > 0 ? styles.demoDone : styles.demoPending}>
              {demoSummary.filterCount > 0
                ? t('communities.demoDone')
                : t('communities.demoPending')}{' '}
              · {t('communities.demoChecklistFilter')}
            </span>
            <span className={demoSummary.openCount > 0 ? styles.demoDone : styles.demoPending}>
              {demoSummary.openCount > 0 ? t('communities.demoDone') : t('communities.demoPending')}{' '}
              · {t('communities.demoChecklistOpen')}
            </span>
            <span className={demoSummary.suggestCount > 0 ? styles.demoDone : styles.demoPending}>
              {demoSummary.suggestCount > 0
                ? t('communities.demoDone')
                : t('communities.demoPending')}{' '}
              · {t('communities.demoChecklistSuggest')}
            </span>
          </div>
          {recentDemoLogs.length > 0 ? (
            <ul className={styles.demoLogList} aria-label={t('communities.demoRecent')}>
              {recentDemoLogs.map((log) => (
                <li key={log.id}>
                  <strong>{log.label}</strong>
                  {log.detail ? <span> · {log.detail}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Card.Body>
      </Card>

      {isLoading && <Skeleton variant="rectangular" height={80} lines={3} />}
      {data && data.length === 0 && <EmptyState icon="💬" title={t('communities.noResult')} />}

      <ul className={styles.list}>
        {data?.map((c) => (
          <li key={c.id}>
            <Card padding="md">
              <Card.Body>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{c.name}</h2>
                  <Badge variant="default">{t(`communities.kind${capitalize(c.kind)}`)}</Badge>
                </div>
                {c.memberHint && <p className={styles.itemDesc}>{c.memberHint}</p>}
                <p className={styles.itemMeta}>
                  {c.language.toUpperCase()} ·{' '}
                  {c.supportedCategories.map((s) => t(`categories.${s}`)).join(', ')}
                </p>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.linkAction}
                  onClick={() => recordDemoLog('open', t('communities.demoOpenAction'), c.name)}
                >
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          </li>
        ))}
      </ul>

      <Card padding="md" className={styles.suggestCard}>
        <Card.Body>
          <h2 className={styles.suggestTitle}>{t('communities.cafesPromoTitle')}</h2>
          <p className={styles.suggestDesc}>{t('communities.cafesPromoDesc')}</p>
          <Link to="/cafes" className={styles.suggestLink}>
            {t('communities.cafesPromoCta')} →
          </Link>
        </Card.Body>
      </Card>

      <Card padding="md" className={styles.suggestCard}>
        <Card.Body>
          <h2 className={styles.suggestTitle}>{t('communities.suggestTitle')}</h2>
          <p className={styles.suggestDesc}>{t('communities.suggestDesc')}</p>
          <Link
            to="/contact?category=question"
            className={styles.suggestLink}
            onClick={() => recordDemoLog('suggest', t('communities.demoSuggestAction'))}
          >
            {t('communities.suggestCta')} →
          </Link>
        </Card.Body>
      </Card>
    </section>
  )
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

export default Communities
