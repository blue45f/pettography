import Button from '@components/common/Button'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import styles from './Landing.module.css'

const LIFECYCLE_STEPS = ['pick', 'adopt', 'raise', 'vet', 'daily', 'senior', 'funeral'] as const

function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('common.appName'))

  const completed = isOnboardingComplete(profile)
  const primaryTarget = completed ? '/dashboard' : '/onboarding'

  return (
    <div className={styles.landing}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.orbField} aria-hidden="true">
          <span className={`${styles.orb} ${styles.orbA}`}>🦎</span>
          <span className={`${styles.orb} ${styles.orbB}`}>🐢</span>
          <span className={`${styles.orb} ${styles.orbC}`}>🐍</span>
          <span className={`${styles.orb} ${styles.orbD}`}>🦜</span>
          <span className={`${styles.orb} ${styles.orbE}`}>🦔</span>
          <span className={`${styles.orb} ${styles.orbF}`}>🕷️</span>
        </div>
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
            <Button variant="primary" size="lg" onClick={() => navigate(primaryTarget)}>
              {completed ? t('nav.dashboard') : t('landing.primaryCta')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/match')}>
              {t('nav.match')}
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.lifecycle} aria-labelledby="lifecycle-title">
        <h2 id="lifecycle-title" className={styles.sectionTitle}>
          {t('lifecycle.title')}
        </h2>
        <p className={styles.sectionLead}>{t('lifecycle.subtitle')}</p>
        <ol className={styles.steps}>
          {LIFECYCLE_STEPS.map((id, idx) => (
            <li key={id} className={styles.step}>
              <span aria-hidden="true" className={styles.stepNo}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{t(`lifecycle.stages.${id}`)}</h3>
                <p className={styles.stepDesc}>{t(`lifecycle.stageDesc.${id}`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default Landing
