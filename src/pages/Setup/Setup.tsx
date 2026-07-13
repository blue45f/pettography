import Card from '@components/common/Card'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Setup.module.css'

const MSD_HUSBANDRY_URL =
  'https://www.msdvetmanual.com/exotic-and-laboratory-animals/reptiles/management-and-husbandry-of-reptiles'

const SETUP_STEPS = [
  { id: 'research', href: 'care' },
  { id: 'space', href: '/enclosure' },
  { id: 'climate', href: '/lighting' },
  { id: 'monitor', href: '/habitat' },
  { id: 'safety', href: '/safety' },
  { id: 'supplies', href: '/supplies' },
  { id: 'dryRun', href: '/routine' },
] as const

function Setup() {
  const { t } = useTranslation()
  useDocumentTitle(t('setup.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('setup.eyebrow')}</p>
          <h1>{t('setup.title')}</h1>
          <p className={styles.subtitle}>{t('setup.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🧰
            </span>
            <h2>{t('setup.petRequiredTitle')}</h2>
            <p>{t('setup.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('setup.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  const careHref = profile.speciesId ? `/care/${profile.speciesId}` : '/care'
  const petName = profile.petName?.trim() || species?.koreanName || t('setup.aPet')

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('setup.eyebrow')}</p>
        <h1>{t('setup.title')}</h1>
        <p className={styles.subtitle}>{t('setup.subtitle')}</p>
        <span className={styles.petPill}>
          <span aria-hidden="true">{species?.heroEmoji ?? '🐾'}</span>
          {t('setup.activePet', { name: petName })}
        </span>
      </header>

      <Card padding="lg" className={styles.principleCard}>
        <Card.Body>
          <p className={styles.sectionKicker}>{t('setup.principleKicker')}</p>
          <h2 className={styles.sectionTitle}>{t('setup.principleTitle')}</h2>
          <p className={styles.principleText}>{t('setup.principleBody')}</p>
          <a
            className={styles.sourceLink}
            href={MSD_HUSBANDRY_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t('setup.sourceLink')}
          </a>
        </Card.Body>
      </Card>

      <section aria-labelledby="setup-order-title">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>{t('setup.orderKicker')}</p>
            <h2 id="setup-order-title" className={styles.sectionTitle}>
              {t('setup.orderTitle')}
            </h2>
          </div>
          <Link to="/shops" className={styles.textLink}>
            {t('setup.openShops')}
          </Link>
        </div>
        <ol className={styles.steps}>
          {SETUP_STEPS.map((step, index) => {
            const href = step.id === 'research' ? careHref : step.href
            return (
              <li key={step.id} className={styles.step}>
                <span className={styles.stepNo} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className={styles.stepBody}>
                  <h3>{t(`setup.steps.${step.id}.title`)}</h3>
                  <p>{t(`setup.steps.${step.id}.body`)}</p>
                </div>
                <Link to={href} className={styles.stepLink}>
                  {t('setup.openStep')}
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <p className={styles.disclaimer}>{t('setup.disclaimer')}</p>
    </section>
  )
}

export default Setup
