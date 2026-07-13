import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useCommunitiesList } from '@domains/communities'
import { useOnboardingStore } from '@domains/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Communities.module.css'

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function Communities() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('communities.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const { data, isLoading, isError, refetch } = useCommunitiesList({
    category: category === 'all' ? undefined : category,
  })
  const communities = data?.filter((community) => isHttpUrl(community.url))

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

      {isLoading && <Skeleton variant="rectangular" height={80} lines={3} />}
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
      {!isError && communities && communities.length === 0 && (
        <EmptyState
          icon="💬"
          title={t('communities.noResult')}
          action={
            category !== 'all' ? (
              <Button variant="outline" size="sm" onClick={() => setCategory('all')}>
                {t('species.resetFilters')}
              </Button>
            ) : undefined
          }
        />
      )}

      <ul className={styles.list}>
        {communities?.map((c) => (
          <li key={c.id} className={styles.listItem}>
            <article>
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
                rel="noopener noreferrer"
                className={styles.linkAction}
              >
                {t('common.openLink')} ↗
              </a>
            </article>
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
          <Link to="/contact?category=question" className={styles.suggestLink}>
            {t('communities.suggestCta')} →
          </Link>
        </Card.Body>
      </Card>

      <Card padding="md" className={styles.suggestCard}>
        <Card.Body>
          <h2 className={styles.suggestTitle}>{t('forum.title')}</h2>
          <p className={styles.suggestDesc}>{t('forum.subtitle')}</p>
          <Link to="/forum" className={styles.suggestLink}>
            {t('common.openLink')} →
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
