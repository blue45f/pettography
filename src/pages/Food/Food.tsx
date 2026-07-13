import Card from '@components/common/Card'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Food.module.css'

const MSD_NUTRITION_URL =
  'https://www.msdvetmanual.com/management-and-nutrition/nutrition-exotic-and-zoo-animals/nutrition-in-reptiles'

const PLAN_STEPS = ['staple', 'size', 'variety', 'hygiene', 'response'] as const

function Food() {
  const { t } = useTranslation()
  useDocumentTitle(t('food.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('food.eyebrow')}</p>
          <h1>{t('food.title')}</h1>
          <p className={styles.subtitle}>{t('food.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🍽️
            </span>
            <h2>{t('food.petRequiredTitle')}</h2>
            <p>{t('food.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('food.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  const petName = profile.petName?.trim() || species?.koreanName || t('food.aPet')

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('food.eyebrow')}</p>
        <h1>{t('food.title')}</h1>
        <p className={styles.subtitle}>{t('food.subtitle')}</p>
        <span className={styles.petPill}>
          <span aria-hidden="true">{species?.heroEmoji ?? '🐾'}</span>
          {t('food.activePet', { name: petName })}
        </span>
      </header>

      <Card padding="lg" className={styles.safetyCard}>
        <Card.Body>
          <p className={styles.sectionKicker}>{t('food.safetyKicker')}</p>
          <h2 className={styles.sectionTitle}>{t('food.safetyTitle')}</h2>
          <p className={styles.safetyText}>{t('food.safetyBody')}</p>
          <a
            className={styles.sourceLink}
            href={MSD_NUTRITION_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t('food.sourceLink')}
          </a>
        </Card.Body>
      </Card>

      <section aria-labelledby="food-plan-title">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionKicker}>{t('food.planKicker')}</p>
            <h2 id="food-plan-title" className={styles.sectionTitle}>
              {t('food.planTitle')}
            </h2>
          </div>
          {profile.speciesId && (
            <Link to={`/care/${profile.speciesId}`} className={styles.textLink}>
              {t('food.openSpeciesCare')}
            </Link>
          )}
        </div>
        <ol className={styles.planList}>
          {PLAN_STEPS.map((step, index) => (
            <li key={step} className={styles.planItem}>
              <span className={styles.stepNo} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{t(`food.plan.${step}.title`)}</h3>
                <p>{t(`food.plan.${step}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <nav className={styles.actionGrid} aria-label={t('food.actionsLabel')}>
        <Link to="/feeding" className={styles.actionLink}>
          <strong>{t('food.actions.feedingTitle')}</strong>
          <span>{t('food.actions.feedingBody')}</span>
        </Link>
        <Link to="/feeders" className={styles.actionLink}>
          <strong>{t('food.actions.feedersTitle')}</strong>
          <span>{t('food.actions.feedersBody')}</span>
        </Link>
        <Link to="/supplements" className={styles.actionLink}>
          <strong>{t('food.actions.supplementsTitle')}</strong>
          <span>{t('food.actions.supplementsBody')}</span>
        </Link>
        <Link to="/hospitals" className={styles.actionLink}>
          <strong>{t('food.actions.vetTitle')}</strong>
          <span>{t('food.actions.vetBody')}</span>
        </Link>
      </nav>

      <p className={styles.disclaimer}>{t('food.disclaimer')}</p>
    </section>
  )
}

export default Food
