import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import { feedingRule, recommendFrequencyDays } from '@features/feeding'
import { recommendationFor } from '@features/habitat'
import { useActivePetMeds } from '@features/meds'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import { useSpecies } from '@features/species'
import { useAggregatedAlerts } from '@hooks/useAggregatedAlerts'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Caresheet.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * A print-/PDF-ready one-page care summary for the active pet, meant to hand to
 * a pet-sitter or take to the vet. Aggregates habitat targets, feeding cadence,
 * current medications and this week's attention items from the existing
 * features. Printing uses the visibility-isolation trick in the CSS so only the
 * sheet appears on paper.
 */
function Caresheet() {
  const { t } = useTranslation()
  useDocumentTitle(t('caresheet.docTitle'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const completed = isOnboardingComplete(profile)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const meds = useActivePetMeds()
  const alerts = useAggregatedAlerts()

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) ?? null,
    [pets, activePetId],
  )
  const petName = activePet?.petName?.trim() || species?.koreanName || t('caresheet.petFallback')

  const habitat = recommendationFor(profile.category)
  const rule = feedingRule(species?.slug, profile.category)
  const feedingFreq = rule ? recommendFrequencyDays(rule, 'adult') : null
  const attention = alerts.filter((a) => a.severity !== 'info')

  if (!completed) {
    return (
      <section className={styles.page}>
        <EmptyState
          icon="📋"
          title={t('caresheet.noPetTitle')}
          description={t('caresheet.noPetDesc')}
        />
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.controls}>
        <Button variant="primary" onClick={() => window.print()}>
          {t('caresheet.print')}
        </Button>
        <p className={styles.hint}>{t('caresheet.hint')}</p>
      </div>

      <article
        className={styles.sheet}
        data-print="care-sheet"
        aria-label={t('caresheet.docTitle')}
      >
        <header className={styles.sheetHeader}>
          <h1 className={styles.sheetTitle}>{t('caresheet.title', { name: petName })}</h1>
          {species && (
            <p className={styles.species}>
              {species.heroEmoji} {species.koreanName}
              {species.scientificName ? ` · ${species.scientificName}` : ''}
            </p>
          )}
          <p className={styles.generated}>{t('caresheet.generatedOn', { date: todayIso() })}</p>
        </header>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>{t('caresheet.sections.habitat')}</h2>
          {habitat ? (
            <ul className={styles.facts}>
              <li>{t('caresheet.habitat.temp', { min: habitat.tempMin, max: habitat.tempMax })}</li>
              <li>
                {t('caresheet.habitat.humidity', {
                  min: habitat.humidityMin,
                  max: habitat.humidityMax,
                })}
              </li>
              <li>
                {habitat.uvbRecommended
                  ? t('caresheet.habitat.uvbYes')
                  : t('caresheet.habitat.uvbNo')}
              </li>
            </ul>
          ) : (
            <p className={styles.muted}>{t('caresheet.noData')}</p>
          )}
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>{t('caresheet.sections.feeding')}</h2>
          {feedingFreq !== null ? (
            <p>{t('caresheet.feeding.freq', { days: feedingFreq })}</p>
          ) : (
            <p className={styles.muted}>{t('caresheet.noData')}</p>
          )}
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>{t('caresheet.sections.meds')}</h2>
          {meds.length === 0 ? (
            <p className={styles.muted}>{t('caresheet.meds.none')}</p>
          ) : (
            <ul className={styles.facts}>
              {meds.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong>{' '}
                  {t('caresheet.meds.detail', { dosage: m.dosage, days: m.frequencyDays })}
                  {m.reason ? ` (${m.reason})` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>{t('caresheet.sections.attention')}</h2>
          {attention.length === 0 ? (
            <p className={styles.muted}>{t('caresheet.attention.none')}</p>
          ) : (
            <ul className={styles.facts}>
              {attention.map((a) => (
                <li key={a.id}>
                  {t(a.titleKey, a.params)}
                  {a.dateISO ? ` (${a.dateISO})` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.block}>
          <h2 className={styles.blockTitle}>{t('caresheet.sections.emergency')}</h2>
          <p>{t('caresheet.emergency.note')}</p>
          <p className={styles.emergencyLink}>
            <Link to="/hospitals">{t('caresheet.emergency.findVet')}</Link>
          </p>
        </section>
      </article>
    </section>
  )
}

export default Caresheet
