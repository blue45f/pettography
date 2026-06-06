import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useFuneralList } from '@features/funeral'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import usePageMeta from '@hooks/usePageMeta'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import styles from './Funeral.module.css'

function Funeral() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  usePageMeta({
    title: `${t('funeral.title')} · ${t('common.appName')}`,
    description: t('pageMeta.funeralDescription'),
    path: '/funeral',
  })

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const { data, isLoading } = useFuneralList({
    category: category === 'all' ? undefined : category,
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('funeral.title')}</h1>
        <p className={styles.subtitle}>{t('funeral.subtitle')}</p>
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
      {data && data.length === 0 && <EmptyState icon="🌈" title={t('funeral.noResult')} />}

      <ul className={styles.list}>
        {data?.map((f) => (
          <li key={f.id}>
            <Card padding="md">
              <Card.Body>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{f.name}</h2>
                  <Badge variant="primary">{t(`funeral.kind${capitalize(f.kind)}`)}</Badge>
                </div>
                <p className={styles.itemMeta}>{f.region}</p>
                <p className={styles.itemDesc}>{f.description}</p>
                <div className={styles.itemActions}>
                  {f.certified ? (
                    <Badge variant="success">{t('funeral.certified')}</Badge>
                  ) : (
                    <Badge variant="warning">{t('funeral.uncertified')}</Badge>
                  )}
                  {f.phone && (
                    <a href={`tel:${f.phone}`} className={styles.linkAction}>
                      {t('common.phone')}: {f.phone}
                    </a>
                  )}
                  <a href={f.url} target="_blank" rel="noreferrer" className={styles.linkAction}>
                    {t('common.openLink')} ↗
                  </a>{' '}
                  <Link to="/contact?category=general" className={styles.linkAction}>
                    {t('funeral.inquireCta')}
                  </Link>
                </div>
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

export default Funeral
