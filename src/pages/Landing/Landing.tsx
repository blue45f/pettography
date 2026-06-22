import Button from '@components/common/Button'
import LazyImage from '@components/common/LazyImage'
import Reveal from '@components/common/Reveal'
import { isOnboardingComplete, useOnboardingStore } from '@domains/onboarding'
import usePageMeta from '@hooks/usePageMeta'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import styles from './Landing.module.css'

import type { CSSProperties } from 'react'

const LIFECYCLE_STEPS = ['pick', 'adopt', 'raise', 'vet', 'daily', 'senior', 'funeral'] as const

/**
 * Hero proof chips. Three balanced label/value pairs that say what the portal
 * actually does, not vanity hero-metrics. They stagger in beneath the CTA so
 * the first fold carries a beat of "here's why this is for you".
 */
const PROOF_CHIPS = [
  { id: 'species', icon: '🦎' },
  { id: 'location', icon: '📍' },
  { id: 'lifecycle', icon: '🌿' },
] as const

/**
 * Hero collage shots. Real keeper photography drops in here later; picsum
 * seeds keep the layout honest and working today. `emoji` is the species cue
 * shown as a soft caption tag so the collage still reads as our domain.
 */
const HERO_SHOTS = [
  { seed: 'petto-hero-gecko', emoji: '🦎' },
  { seed: 'petto-hero-vivarium', emoji: '🌿' },
  { seed: 'petto-hero-tarantula', emoji: '🕷️' },
] as const

/**
 * The four pillars of the portal, mapped to the existing `landing.feature*`
 * copy. Each glyph is the domain cue; the brand carries the colour. Keeps the
 * grid to four and each tile earns a distinct affordance via the glyph.
 */
const FEATURES = [
  { key: 'Species', glyph: '🧬' },
  { key: 'Location', glyph: '📍' },
  { key: 'Care', glyph: '🩺' },
  { key: 'Lifecycle', glyph: '🔄' },
] as const

function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useOnboardingStore((s) => s.profile)
  usePageMeta({
    title: `${t('common.appName')} · ${t('common.appTagline')}`,
    description: t('pageMeta.homeDescription'),
    path: '/',
  })

  const completed = isOnboardingComplete(profile)
  const primaryTarget = completed ? '/dashboard' : '/onboarding'

  return (
    <div className={styles.landing}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <span className={styles.heroAura} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            {profile.location?.label
              ? t('common.appTaglineRegion', { region: profile.location.label })
              : t('common.appTagline')}
          </p>
          <h1 id="hero-title" className={styles.title}>
            {t('landing.title')}
          </h1>
          <p className={styles.description}>{t('landing.description')}</p>
          <div className={styles.ctaRow}>
            <Button
              variant="primary"
              size="lg"
              className={styles.ctaPrimary}
              onClick={() => navigate(primaryTarget)}
            >
              {completed ? t('nav.dashboard') : t('landing.primaryCta')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/match')}>
              {t('nav.match')}
            </Button>
          </div>
          <ul className={styles.proof}>
            {PROOF_CHIPS.map((chip, idx) => (
              <li
                key={chip.id}
                className={styles.proofChip}
                style={{ '--i': idx } as CSSProperties}
              >
                <span className={styles.proofIcon} aria-hidden="true">
                  {chip.icon}
                </span>
                <span className={styles.proofText}>
                  <span className={styles.proofValue}>
                    {t(`landing.proof${cap(chip.id)}Value`)}
                  </span>
                  <span className={styles.proofLabel}>
                    {t(`landing.proof${cap(chip.id)}Label`)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.heroCollage} aria-hidden="true">
          {HERO_SHOTS.map((shot, idx) => (
            <figure key={shot.seed} className={`${styles.shot} ${styles[`shot${idx + 1}`]}`}>
              <LazyImage
                src={`https://picsum.photos/seed/${shot.seed}/640/800`}
                alt=""
                className={styles.shotImage}
                hoverZoom
              />
              <figcaption className={styles.shotTag}>{shot.emoji}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.features} aria-labelledby="features-title">
        <Reveal>
          <h2 id="features-title" className={styles.sectionTitle}>
            {t('landing.featuresTitle')}
          </h2>
        </Reveal>
        <Reveal delay={60}>
          <p className={styles.sectionLead}>{t('landing.featuresSubtitle')}</p>
        </Reveal>
        <ul className={styles.featureGrid}>
          {FEATURES.map((feature, idx) => (
            <Reveal as="li" key={feature.key} delay={idx * 90} className={styles.feature}>
              <span aria-hidden="true" className={styles.featureGlyph}>
                {feature.glyph}
              </span>
              <h3 className={styles.featureTitle}>{t(`landing.feature${feature.key}Title`)}</h3>
              <p className={styles.featureDesc}>{t(`landing.feature${feature.key}Desc`)}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className={styles.lifecycle} aria-labelledby="lifecycle-title">
        <Reveal>
          <h2 id="lifecycle-title" className={styles.sectionTitle}>
            {t('lifecycle.title')}
          </h2>
        </Reveal>
        <Reveal delay={60}>
          <p className={styles.sectionLead}>{t('lifecycle.subtitle')}</p>
        </Reveal>
        <ol className={styles.steps}>
          {LIFECYCLE_STEPS.map((id, idx) => (
            <Reveal as="li" key={id} delay={Math.min(idx, 4) * 70} className={styles.step}>
              <span aria-hidden="true" className={styles.stepNo}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{t(`lifecycle.stages.${id}`)}</h3>
                <p className={styles.stepDesc}>{t(`lifecycle.stageDesc.${id}`)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  )
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default Landing
