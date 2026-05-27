import Badge from '@components/common/Badge'
import { useOnboardingStore } from '@features/onboarding'
import { isRegulated, REGISTRY_FILINGS, REGISTRY_LINKS, useRegistryStore } from '@features/registry'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'

import styles from './Registry.module.css'

function Registry() {
  const { t } = useTranslation()
  useDocumentTitle(t('registry.title'))

  const category = useOnboardingStore((s) => s.profile.category)
  const done = useRegistryStore((s) => s.done)
  const toggle = useRegistryStore((s) => s.toggle)
  const clear = useRegistryStore((s) => s.clear)

  const regulated = isRegulated(category)
  const completedCount = Object.keys(done).length

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('registry.title')}</h1>
        <p className={styles.subtitle}>{t('registry.subtitle')}</p>
        <p className={styles.effectiveNote}>{t('registry.effectiveNote')}</p>
      </header>

      <div className={styles.statusBar} role="status">
        <div>
          <p className={styles.statusLabel}>{t('registry.categoryStatusLabel')}</p>
          {category ? (
            <p className={styles.statusValue}>
              {t(`categories.${category}`)} ·{' '}
              {regulated ? (
                <Badge variant="warning">{t('registry.regulatedBadge')}</Badge>
              ) : (
                <Badge variant="success">{t('registry.unregulatedBadge')}</Badge>
              )}
            </p>
          ) : (
            <p className={styles.statusValue}>{t('registry.noCategory')}</p>
          )}
        </div>
        <div>
          <p className={styles.statusLabel}>{t('registry.checklistProgress')}</p>
          <p className={styles.statusValue}>
            {completedCount} / {REGISTRY_FILINGS.length}
          </p>
        </div>
      </div>

      <section aria-labelledby="filings-heading" className={styles.section}>
        <h2 id="filings-heading" className={styles.sectionTitle}>
          {t('registry.filingsTitle')}
        </h2>
        <ol className={styles.filings}>
          {REGISTRY_FILINGS.map((filing, idx) => {
            const isDone = !!done[filing]
            const checkboxId = `filing-${filing}`
            return (
              <li key={filing} className={styles.filing}>
                <span aria-hidden="true" className={styles.filingNo}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className={styles.filingBody}>
                  <h3 className={styles.filingTitle}>{t(`registry.filings.${filing}.title`)}</h3>
                  <p className={styles.filingDesc}>{t(`registry.filings.${filing}.desc`)}</p>
                  <p className={styles.filingWhen}>{t(`registry.filings.${filing}.when`)}</p>
                </div>
                <label className={styles.filingCheck} htmlFor={checkboxId}>
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggle(filing)}
                  />
                  <span>{isDone ? t('registry.markedDone') : t('registry.markDone')}</span>
                </label>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="links-heading" className={styles.section}>
        <h2 id="links-heading" className={styles.sectionTitle}>
          {t('registry.linksTitle')}
        </h2>
        <ul className={styles.linkList}>
          <li>
            <a href={REGISTRY_LINKS.wildlifeRegistry} target="_blank" rel="noreferrer">
              {t('registry.links.wildlifeRegistry')} ↗
            </a>
          </li>
          <li>
            <a href={REGISTRY_LINKS.animalRegistry} target="_blank" rel="noreferrer">
              {t('registry.links.animalRegistry')} ↗
            </a>
          </li>
          <li>
            <a href={REGISTRY_LINKS.envMinistry} target="_blank" rel="noreferrer">
              {t('registry.links.envMinistry')} ↗
            </a>
          </li>
        </ul>
        <p className={styles.disclaimer}>{t('registry.disclaimer')}</p>
      </section>

      {completedCount > 0 && (
        <button type="button" className={styles.resetButton} onClick={clear}>
          {t('registry.reset')}
        </button>
      )}
    </section>
  )
}

export default Registry
