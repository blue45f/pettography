import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import { useToast } from '@components/common/Toast'
import {
  COMPARISON_LINKS,
  INSURANCE_PROVIDERS,
  monthsBetween,
  suggestedReserveKrw,
  useActivePetReserve,
  useReserveStore,
} from '@features/insurance'
import { useOnboardingStore } from '@features/onboarding'
import { isRegulated } from '@features/registry'
import { useSpecies } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Insurance.module.css'

function Insurance() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('insurance.title'))

  const category = useOnboardingStore((s) => s.profile.category)
  const speciesId = useOnboardingStore((s) => s.profile.speciesId)
  const { data: species } = useSpecies(speciesId ?? undefined)
  const { monthlyContributionKrw, startedAt } = useActivePetReserve()
  const setContribution = useReserveStore((s) => s.setContribution)

  const exotic = isRegulated(category) && category !== 'mammal'
  const suggestion = useMemo(
    () => suggestedReserveKrw(species?.monthlyBudgetKrw ?? 0),
    [species?.monthlyBudgetKrw]
  )
  const accumulated = useMemo(
    () => monthlyContributionKrw * monthsBetween(startedAt),
    [monthlyContributionKrw, startedAt]
  )

  const [draft, setDraft] = useState(String(monthlyContributionKrw || ''))

  function saveContribution() {
    const v = Number(draft)
    if (!Number.isFinite(v) || v < 0) {
      toast(t('insurance.errors.contribution'), 'error')
      return
    }
    setContribution(v)
    toast(t('insurance.savedToast'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('insurance.title')}</h1>
        <p className={styles.subtitle}>{t('insurance.subtitle')}</p>
      </header>

      {exotic && (
        <div className={styles.warningBanner} role="alert">
          <strong>{t('insurance.exoticWarningTitle')}</strong>
          <span>{t('insurance.exoticWarningBody')}</span>
        </div>
      )}

      <section aria-labelledby="reserve-heading" className={styles.section}>
        <h2 id="reserve-heading" className={styles.sectionTitle}>
          {t('insurance.reserveTitle')}
        </h2>
        <p className={styles.sectionDesc}>{t('insurance.reserveDesc')}</p>

        {species && (
          <p className={styles.suggestionLine}>
            {t('insurance.reserveSuggestion', {
              name: species.koreanName,
              amount: suggestion.toLocaleString('ko'),
            })}
          </p>
        )}

        <div className={styles.contributionRow}>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="5000"
            label={t('insurance.monthlyContribution')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t('insurance.monthlyContribution')}
          />
          <Button type="button" variant="primary" onClick={saveContribution}>
            {t('insurance.save')}
          </Button>
        </div>

        {monthlyContributionKrw > 0 && startedAt && (
          <dl className={styles.reserveStats}>
            <div>
              <dt>{t('insurance.startedAt')}</dt>
              <dd>{new Date(startedAt).toISOString().slice(0, 10)}</dd>
            </div>
            <div>
              <dt>{t('insurance.monthsRunning')}</dt>
              <dd>{monthsBetween(startedAt)}</dd>
            </div>
            <div>
              <dt>{t('insurance.accumulated')}</dt>
              <dd className={styles.bigNumber}>₩{accumulated.toLocaleString('ko')}</dd>
            </div>
          </dl>
        )}
      </section>

      <section aria-labelledby="providers-heading" className={styles.section}>
        <h2 id="providers-heading" className={styles.sectionTitle}>
          {t('insurance.providersTitle')}
        </h2>
        <p className={styles.sectionDesc}>{t('insurance.providersDesc')}</p>
        <div className={styles.providerGrid}>
          {INSURANCE_PROVIDERS.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className={styles.providerCard}
            >
              <header className={styles.providerHeader}>
                <h3 className={styles.providerName}>{p.name}</h3>
                <div className={styles.providerBadges}>
                  <Badge variant={p.coversDogCat ? 'success' : 'default'}>
                    {p.coversDogCat ? t('insurance.coversDogCat') : t('insurance.noDogCat')}
                  </Badge>
                  <Badge variant={p.coversExotic ? 'success' : 'warning'}>
                    {p.coversExotic ? t('insurance.coversExotic') : t('insurance.noExotic')}
                  </Badge>
                </div>
              </header>
              <p className={styles.providerPrice}>
                ₩{p.monthlyMin.toLocaleString('ko')}~₩{p.monthlyMax.toLocaleString('ko')}
                {t('insurance.perMonth')}
              </p>
              <p className={styles.providerNote}>{p.note}</p>
              <span className={styles.providerLink}>{t('insurance.openSite')} ↗</span>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="compare-heading" className={styles.section}>
        <h2 id="compare-heading" className={styles.sectionTitle}>
          {t('insurance.compareLinksTitle')}
        </h2>
        <ul className={styles.linkList}>
          {COMPARISON_LINKS.map((c) => (
            <li key={c.id}>
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.name} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.disclaimer}>{t('insurance.disclaimer')}</p>
      </section>
    </section>
  )
}

export default Insurance
