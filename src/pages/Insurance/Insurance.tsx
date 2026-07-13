import Button from '@components/common/Button'
import Input from '@components/common/Input'
import { useToast } from '@components/common/Toast'
import {
  INSURANCE_PROVIDERS,
  monthsBetween,
  useActivePetReserve,
  useReserveStore,
} from '@domains/insurance'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Insurance.module.css'

const MAX_MONTHLY_CONTRIBUTION_KRW = 100_000_000

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function Insurance() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('insurance.title'))

  const category = useOnboardingStore((s) => s.profile.category)
  const speciesId = useOnboardingStore((s) => s.profile.speciesId)
  const { data: species } = useSpecies(speciesId ?? undefined)
  const { monthlyContributionKrw, startedAt } = useActivePetReserve()
  const setContribution = useReserveStore((s) => s.setContribution)
  const resetReserve = useReserveStore((s) => s.reset)

  const monthsRunning = useMemo(() => monthsBetween(startedAt), [startedAt])
  const plannedAccumulated = monthlyContributionKrw * monthsRunning
  const [draft, setDraft] = useState(String(monthlyContributionKrw || ''))
  const [seededContribution, setSeededContribution] = useState(monthlyContributionKrw)
  if (seededContribution !== monthlyContributionKrw) {
    setSeededContribution(monthlyContributionKrw)
    setDraft(String(monthlyContributionKrw || ''))
  }

  const formatKrw = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value)

  function saveContribution() {
    const value = Number(draft)
    if (!Number.isFinite(value) || value < 0) {
      toast(t('insurance.errors.contribution'), 'error')
      return
    }
    if (value > MAX_MONTHLY_CONTRIBUTION_KRW) {
      toast(
        t('insurance.errors.contributionMax', { amount: formatKrw(MAX_MONTHLY_CONTRIBUTION_KRW) }),
        'error'
      )
      return
    }
    setContribution(value)
    toast(t('insurance.savedToast'), 'success')
  }

  function resetContribution() {
    if (!globalThis.confirm(t('insurance.resetConfirm'))) return
    resetReserve()
    setDraft('')
    toast(t('insurance.resetToast'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('insurance.title')}</h1>
        <p className={styles.subtitle}>{t('insurance.subtitle')}</p>
      </header>

      {category && (
        <div className={styles.warningBanner} role="note">
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
            {t('insurance.budgetContext', {
              name: species.koreanName,
              amount: formatKrw(species.monthlyBudgetKrw),
            })}
          </p>
        )}

        <div className={styles.contributionRow}>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            max={MAX_MONTHLY_CONTRIBUTION_KRW}
            step="5000"
            label={t('insurance.monthlyContribution')}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className={styles.contributionActions}>
            <Button type="button" variant="primary" onClick={saveContribution}>
              {t('insurance.save')}
            </Button>
            {monthlyContributionKrw > 0 && (
              <Button type="button" variant="outline" onClick={resetContribution}>
                {t('insurance.reset')}
              </Button>
            )}
          </div>
        </div>

        {monthlyContributionKrw > 0 && startedAt && (
          <>
            <dl className={styles.reserveStats}>
              <div>
                <dt>{t('insurance.startedAt')}</dt>
                <dd>
                  {new Date(startedAt).toLocaleDateString(i18n.resolvedLanguage ?? i18n.language)}
                </dd>
              </div>
              <div>
                <dt>{t('insurance.monthsRunning')}</dt>
                <dd>{monthsRunning}</dd>
              </div>
              <div>
                <dt>{t('insurance.accumulated')}</dt>
                <dd className={styles.bigNumber}>{formatKrw(plannedAccumulated)}</dd>
              </div>
            </dl>
            <p className={styles.calculationNote}>{t('insurance.calculationNote')}</p>
          </>
        )}
      </section>

      <section aria-labelledby="providers-heading" className={styles.section}>
        <h2 id="providers-heading" className={styles.sectionTitle}>
          {t('insurance.providersTitle')}
        </h2>
        <p className={styles.sectionDesc}>{t('insurance.providersDesc')}</p>
        <div className={styles.providerGrid}>
          {INSURANCE_PROVIDERS.map((provider) => {
            const url = safeExternalUrl(provider.url)
            if (!url) return null
            return (
              <a
                key={provider.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={styles.providerCard}
              >
                <h3 className={styles.providerName}>{provider.name}</h3>
                <p className={styles.providerVerify}>{t('insurance.providerVerify')}</p>
                <span className={styles.providerLink}>{t('insurance.openSite')} ↗</span>
              </a>
            )
          })}
        </div>
        <p className={styles.disclaimer}>{t('insurance.disclaimer')}</p>
      </section>
    </section>
  )
}

export default Insurance
