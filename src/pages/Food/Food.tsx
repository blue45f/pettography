import Badge from '@components/common/Badge'
import { filterByCategory, type FoodItem } from '@features/food'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Food.module.css'

function Food() {
  const { t } = useTranslation()
  useDocumentTitle(t('food.title'))

  const profileCategory = useOnboardingStore((s) => s.profile.category)
  const [filter, setFilter] = useState<SpeciesCategory | 'all'>(profileCategory ?? 'all')

  const items = useMemo(() => filterByCategory(filter === 'all' ? null : filter), [filter])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('food.title')}</h1>
        <p className={styles.subtitle}>{t('food.subtitle')}</p>
      </header>

      <div className={styles.filterRow} role="radiogroup" aria-label={t('food.filterLabel')}>
        <button
          type="button"
          role="radio"
          aria-checked={filter === 'all'}
          onClick={() => setFilter('all')}
          className={[styles.filterChip, filter === 'all' ? styles.filterActive : '']
            .filter(Boolean)
            .join(' ')}
        >
          {t('food.allCategories')}
        </button>
        {SPECIES_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={filter === c}
            onClick={() => setFilter(c)}
            className={[styles.filterChip, filter === c ? styles.filterActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      <ul className={styles.list}>
        {items.map((item) => (
          <FoodRow key={item.id} item={item} t={t} />
        ))}
      </ul>

      <p className={styles.disclaimer}>{t('food.disclaimer')}</p>
    </section>
  )
}

function FoodRow({ item, t }: { item: FoodItem; t: (k: string) => string }) {
  return (
    <li className={styles.row}>
      <div className={styles.rowMain}>
        <header className={styles.rowHeader}>
          <h3 className={styles.foodName}>{item.name}</h3>
          <div className={styles.foodBadges}>
            {item.bestFor.map((c) => (
              <Badge key={c} variant="primary">
                {t(`categories.${c}`)}
              </Badge>
            ))}
          </div>
        </header>
        <p className={styles.foodNutrition}>{item.nutrition}</p>
        <p className={styles.foodCaution}>
          <strong>{t('food.cautionLabel')}:</strong> {item.caution}
        </p>
      </div>
      <div className={styles.rowAside}>
        <p className={styles.foodPrice}>
          ₩{item.approxUnitPriceKrw.toLocaleString('ko')}
          <span className={styles.foodUnit}> / {item.unit}</span>
        </p>
        <a className={styles.shopLink} href={item.shopUrl} target="_blank" rel="noreferrer">
          {t('food.openShop')} ↗
        </a>
      </div>
    </li>
  )
}

export default Food
