import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useAdoptionList } from '@features/adoption'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Adoption.module.css'

function Adoption() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('adoption.title'))

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const { data, isLoading } = useAdoptionList({
    category: category === 'all' ? undefined : category,
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('adoption.title')}</h1>
        <p className={styles.subtitle}>{t('adoption.subtitle')}</p>
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

      {isLoading && <Skeleton variant="rectangular" height={100} lines={3} />}
      {data && data.length === 0 && <EmptyState icon="🤝" title={t('adoption.noResult')} />}

      <ul className={styles.list}>
        {data?.map((a) => (
          <li key={a.id}>
            <Card padding="md">
              <Card.Body>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{a.name}</h2>
                  <Badge variant="primary">{t(`adoption.kind${capitalize(a.kind)}`)}</Badge>
                </div>
                <p className={styles.itemMeta}>{a.region}</p>
                <p className={styles.itemDesc}>{a.description}</p>
                {a.badge && <Badge variant="success">{a.badge}</Badge>}{' '}
                <a href={a.url} target="_blank" rel="noreferrer" className={styles.linkAction}>
                  {t('common.openLink')} ↗
                </a>
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

export default Adoption
