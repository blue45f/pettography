import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import { useOnboardingStore } from '@features/onboarding'
import { SETUP_GUIDES, SETUP_SHOPS, totalRange } from '@features/setup'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Setup.module.css'

function Setup() {
  const { t } = useTranslation()
  useDocumentTitle(t('setup.title'))

  const profileCategory = useOnboardingStore((s) => s.profile.category)
  const [selected, setSelected] = useState<SpeciesCategory | null>(profileCategory ?? null)
  const [includeOptional, setIncludeOptional] = useState(true)

  const parts = useMemo(() => (selected ? SETUP_GUIDES[selected] : []), [selected])
  const totals = useMemo(() => totalRange(parts, includeOptional), [parts, includeOptional])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('setup.title')}</h1>
        <p className={styles.subtitle}>{t('setup.subtitle')}</p>
      </header>

      <div className={styles.categoryPicker} role="radiogroup" aria-label={t('setup.pickCategory')}>
        {SPECIES_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected === c}
            onClick={() => setSelected(c)}
            className={[styles.categoryChip, selected === c ? styles.categoryActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      {!selected ? (
        <EmptyState icon="🧰" title={t('setup.empty')} description={t('setup.emptyDesc')} />
      ) : (
        <>
          <div className={styles.summary}>
            <div>
              <p className={styles.summaryLabel}>{t('setup.totalLabel')}</p>
              <p className={styles.summaryValue}>
                ₩{totals.basic.toLocaleString('ko')} ~ ₩{totals.premium.toLocaleString('ko')}
              </p>
              <p className={styles.summaryHint}>{t('setup.totalHint')}</p>
            </div>
            <label className={styles.optionalToggle}>
              <input
                type="checkbox"
                checked={includeOptional}
                onChange={(e) => setIncludeOptional(e.target.checked)}
              />
              {t('setup.includeOptional')}
            </label>
          </div>

          <ol className={styles.partsList}>
            {parts.map((p, idx) => (
              <li key={p.id} className={styles.part}>
                <span aria-hidden="true" className={styles.partNo}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className={styles.partBody}>
                  <header className={styles.partHeader}>
                    <h3 className={styles.partTitle}>{p.label}</h3>
                    {p.optional && <Badge variant="default">{t('setup.optional')}</Badge>}
                  </header>
                  <p className={styles.partDesc}>{p.description}</p>
                </div>
                <div className={styles.partPrice}>
                  <span className={styles.priceRange}>
                    ₩{p.basicKrw.toLocaleString('ko')}
                    <span className={styles.priceSep}>~</span>₩{p.premiumKrw.toLocaleString('ko')}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <section className={styles.shopSection} aria-labelledby="shops-heading">
            <h2 id="shops-heading" className={styles.sectionTitle}>
              {t('setup.shopsTitle')}
            </h2>
            <ul className={styles.shopList}>
              {SETUP_SHOPS.map((s) => (
                <li key={s.id}>
                  <a className={styles.shopLink} href={s.url} target="_blank" rel="noreferrer">
                    <strong>{s.name}</strong>
                    <span className={styles.shopTag}>{s.tag}</span>
                    <span className={styles.shopArrow}>↗</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.disclaimer}>{t('setup.disclaimer')}</p>
          </section>
        </>
      )}
    </section>
  )
}

export default Setup
