import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { FUNERAL_REGISTRY_URL, useFuneralList } from '@domains/funeral'
import { useOnboardingStore } from '@domains/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@domains/species'
import usePageMeta from '@hooks/usePageMeta'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Funeral.module.css'

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function Funeral() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  usePageMeta({
    title: `${t('funeral.title')} · ${t('common.appName')}`,
    description: t('pageMeta.funeralDescription'),
    path: '/funeral',
  })

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const funeralQuery = useFuneralList({ category: category === 'all' ? undefined : category })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('funeral.title')}</h1>
        <p className={styles.subtitle}>{t('funeral.subtitle')}</p>
      </header>

      <section className={styles.officialPanel} aria-labelledby="funeral-official-title">
        <div>
          <p className={styles.officialKicker}>{t('funeral.officialKicker')}</p>
          <h2 id="funeral-official-title">{t('funeral.officialTitle')}</h2>
          <p>{t('funeral.officialDesc')}</p>
        </div>
        <a href={FUNERAL_REGISTRY_URL} target="_blank" rel="noreferrer">
          {t('funeral.officialLink')} ↗
        </a>
      </section>

      <p className={styles.dataNotice}>{t('funeral.dataNotice')}</p>

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
        {SPECIES_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={category === item}
            className={[styles.filterChip, category === item ? styles.filterActive : ''].join(' ')}
            onClick={() => setCategory(item)}
          >
            {t(`categories.${item}`)}
          </button>
        ))}
      </div>

      {funeralQuery.isLoading && (
        <div aria-busy="true">
          <Skeleton variant="rectangular" height={100} lines={3} />
        </div>
      )}
      {funeralQuery.isError && (
        <div className={styles.errorPanel} role="alert">
          <p>{t('funeral.loadFailed')}</p>
          <Button type="button" variant="outline" onClick={() => void funeralQuery.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}
      {funeralQuery.data?.length === 0 && <EmptyState icon="🌈" title={t('funeral.noResult')} />}

      <ul className={styles.list}>
        {funeralQuery.data?.map((service) => {
          const url = safeExternalUrl(service.url)
          const telephone = service.phone?.replace(/[^+\d]/g, '')
          return (
            <li key={service.id}>
              <Card padding="md">
                <Card.Body>
                  <div className={styles.itemHeader}>
                    <h2 className={styles.itemTitle}>{service.name}</h2>
                    <Badge variant="primary">{t(`funeral.kind${capitalize(service.kind)}`)}</Badge>
                  </div>
                  <p className={styles.itemMeta}>{service.region}</p>
                  <p className={styles.itemDesc}>
                    {t('funeral.supportedCategories', {
                      categories: service.supportedCategories
                        .map((item) => t(`categories.${item}`))
                        .join(', '),
                    })}
                  </p>
                  <div className={styles.itemActions}>
                    <Badge variant="warning">{t('funeral.verifyRequired')}</Badge>
                    {service.phone && telephone && (
                      <a href={`tel:${telephone}`} className={styles.linkAction}>
                        {t('common.phone')}: {service.phone}
                      </a>
                    )}
                    {url && (
                      <a href={url} target="_blank" rel="noreferrer" className={styles.linkAction}>
                        {t('common.openLink')} ↗
                      </a>
                    )}
                    <Link to="/contact?category=contact" className={styles.linkAction}>
                      {t('funeral.inquireCta')}
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

export default Funeral
