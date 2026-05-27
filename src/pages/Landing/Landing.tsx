import Button from '@components/common/Button'
import Card from '@components/common/Card'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import styles from './Landing.module.css'

function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('common.appName'))

  const completed = isOnboardingComplete(profile)
  const primaryTarget = completed ? '/dashboard' : '/onboarding'

  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t('common.appTagline')}</p>
        <h1 className={styles.title}>{t('landing.title')}</h1>
        <p className={styles.description}>{t('landing.description')}</p>
        <div className={styles.ctaRow}>
          <Button variant="primary" size="lg" onClick={() => navigate(primaryTarget)}>
            {completed ? t('nav.dashboard') : t('landing.primaryCta')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/hospitals')}>
            {t('landing.secondaryCta')}
          </Button>
        </div>
      </section>

      <section className={styles.features}>
        <Card padding="lg" hoverable>
          <Card.Body>
            <h3 className={styles.featureTitle}>{t('landing.featureSpeciesTitle')}</h3>
            <p className={styles.featureDesc}>{t('landing.featureSpeciesDesc')}</p>
          </Card.Body>
        </Card>
        <Card padding="lg" hoverable>
          <Card.Body>
            <h3 className={styles.featureTitle}>{t('landing.featureLocationTitle')}</h3>
            <p className={styles.featureDesc}>{t('landing.featureLocationDesc')}</p>
          </Card.Body>
        </Card>
        <Card padding="lg" hoverable>
          <Card.Body>
            <h3 className={styles.featureTitle}>{t('landing.featureCareTitle')}</h3>
            <p className={styles.featureDesc}>{t('landing.featureCareDesc')}</p>
          </Card.Body>
        </Card>
        <Card padding="lg" hoverable>
          <Card.Body>
            <h3 className={styles.featureTitle}>{t('landing.featureLifecycleTitle')}</h3>
            <p className={styles.featureDesc}>{t('landing.featureLifecycleDesc')}</p>
          </Card.Body>
        </Card>
      </section>
    </div>
  )
}

export default Landing
