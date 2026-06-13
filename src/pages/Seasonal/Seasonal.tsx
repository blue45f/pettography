import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import { useOnboardingStore } from '@domains/onboarding'
import {
  SEASONAL_GUIDE,
  brumationRelevant,
  categoryTipKey,
  currentSeason,
  generalTipKey,
  guideForSeason,
  orderedSeasonsFrom,
  type Season,
} from '@domains/seasonal'
import { SPECIES_CATEGORIES, useSpeciesList, type SpeciesCategory } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Seasonal.module.css'

/** Fallback category used when no pet has been onboarded yet. */
const DEFAULT_CATEGORY: SpeciesCategory = 'reptile'

function Seasonal() {
  const { t } = useTranslation()
  useDocumentTitle(t('seasonal.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId],
  )

  // The category whose tips we surface. Prefer the active pet's category; when
  // there is no pet, let the visitor pick one (seeded to the active category or
  // the reptile default). This is the only piece of local UI state.
  const [pickedCategory, setPickedCategory] = useState<SpeciesCategory>(
    () => profile.category ?? DEFAULT_CATEGORY,
  )

  const hasActivePet = Boolean(profile.category)
  const category: SpeciesCategory = profile.category ?? pickedCategory

  // Season is read from the clock at render. The mapping itself is the pure,
  // unit-tested `currentSeason`; only the month read happens here.
  const season = useMemo<Season>(() => currentSeason(new Date().getMonth()), [])
  const orderedSeasons = useMemo(() => orderedSeasonsFrom(season), [season])
  const heroGuide = useMemo(() => guideForSeason(season), [season])

  const showBrumationLink = season === 'winter' && brumationRelevant(category)

  const petLabel = profile.petName?.trim() || activeSpecies?.koreanName || null

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('seasonal.title')}</h1>
        <p className={styles.subtitle}>{t('seasonal.subtitle')}</p>
        {activeSpecies && petLabel && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {petLabel}
            <span className={styles.categoryNote}>
              {' · '}
              {t(`seasonal.categories.${category}`)}
            </span>
          </p>
        )}
      </header>

      {/* Category picker — only when there is no onboarded pet to scope to. */}
      {!hasActivePet && (
        <div className={styles.pickerBlock}>
          <span className={styles.pickerLabel}>{t('seasonal.picker.label')}</span>
          <div className={styles.chips} role="group" aria-label={t('seasonal.picker.label')}>
            {SPECIES_CATEGORIES.map((c) => {
              const active = c === pickedCategory
              return (
                <button
                  key={c}
                  type="button"
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  aria-pressed={active}
                  onClick={() => setPickedCategory(c)}
                >
                  {t(`seasonal.categories.${c}`)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Current-season hero card. */}
      <Card padding="lg" className={styles.heroCard}>
        <Card.Body>
          <div className={styles.heroHead}>
            <span className={styles.heroEmoji} aria-hidden="true">
              {heroGuide.emoji}
            </span>
            <div className={styles.heroHeadText}>
              <span className={styles.heroEyebrow}>{t('seasonal.hero.eyebrow')}</span>
              <div className={styles.heroTitleRow}>
                <h2 className={styles.heroTitle}>{t(`seasonal.seasons.${season}.name`)}</h2>
                <Badge variant="primary">{t('seasonal.hero.now')}</Badge>
              </div>
              <span className={styles.heroMonths}>{t(`seasonal.seasons.${season}.months`)}</span>
            </div>
          </div>

          <p className={styles.heroBlurb}>{t(`seasonal.seasons.${season}.blurb`)}</p>

          <div className={styles.heroTips}>
            <div className={styles.heroTip}>
              <span className={styles.heroTipLabel}>{t(`seasonal.categories.${category}`)}</span>
              <p className={styles.heroTipText}>{t(categoryTipKey(season, category))}</p>
            </div>
            <div className={styles.heroTip}>
              <span className={styles.heroTipLabel}>{t('seasonal.generalLabel')}</span>
              <p className={styles.heroTipText}>{t(generalTipKey(season))}</p>
            </div>
          </div>

          {showBrumationLink && (
            <p className={styles.brumationNote}>
              <span aria-hidden="true">❄️</span> {t('seasonal.brumationNote.text')}{' '}
              <Link to="/brumation" className={styles.brumationLink}>
                {t('seasonal.brumationNote.link')}
              </Link>
            </p>
          )}
        </Card.Body>
      </Card>

      {/* Four-season overview. */}
      <div className={styles.overview}>
        <div className={styles.overviewHead}>
          <h2 className={styles.overviewTitle}>{t('seasonal.overview.title')}</h2>
          <p className={styles.overviewLead}>
            {t('seasonal.overview.lead', { category: t(`seasonal.categories.${category}`) })}
          </p>
        </div>

        <ul className={styles.grid}>
          {orderedSeasons.map((s) => {
            const guide = guideForSeason(s)
            const isCurrent = s === season
            return (
              <li key={s}>
                <Card
                  padding="md"
                  hoverable
                  className={`${styles.seasonCard} ${isCurrent ? styles.seasonCardCurrent : ''}`}
                >
                  <Card.Body>
                    <div className={styles.seasonCardHead}>
                      <span className={styles.seasonCardEmoji} aria-hidden="true">
                        {guide.emoji}
                      </span>
                      <h3 className={styles.seasonCardName}>{t(`seasonal.seasons.${s}.name`)}</h3>
                      {isCurrent && <Badge variant="primary">{t('seasonal.hero.now')}</Badge>}
                    </div>
                    <span className={styles.seasonCardMonths}>
                      {t(`seasonal.seasons.${s}.months`)}
                    </span>
                    <p className={styles.seasonCardTip}>{t(categoryTipKey(s, category))}</p>
                    <p className={styles.seasonCardGeneral}>{t(generalTipKey(s))}</p>
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ul>
      </div>

      <p className={styles.disclaimer}>
        {t('seasonal.disclaimer', { count: SEASONAL_GUIDE.length })}
      </p>
    </section>
  )
}

export default Seasonal
