import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './About.module.css'

function About() {
  const { t } = useTranslation()
  useDocumentTitle(t('about.title'))

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('about.eyebrow')}</p>
        <h1 className={styles.title}>{t('about.title')}</h1>
        <p className={styles.lead}>{t('about.lead')}</p>
      </header>

      <section aria-labelledby="why-heading" className={styles.section}>
        <h2 id="why-heading" className={styles.sectionTitle}>
          {t('about.whyTitle')}
        </h2>
        <p className={styles.prose}>{t('about.whyBody')}</p>
      </section>

      <section aria-labelledby="principles-heading" className={styles.section}>
        <h2 id="principles-heading" className={styles.sectionTitle}>
          {t('about.principlesTitle')}
        </h2>
        <ol className={styles.principles}>
          <li>
            <strong>{t('about.principles.location.title')}</strong>
            <p>{t('about.principles.location.body')}</p>
          </li>
          <li>
            <strong>{t('about.principles.emergency.title')}</strong>
            <p>{t('about.principles.emergency.body')}</p>
          </li>
          <li>
            <strong>{t('about.principles.sources.title')}</strong>
            <p>{t('about.principles.sources.body')}</p>
          </li>
          <li>
            <strong>{t('about.principles.diaryVsMedical.title')}</strong>
            <p>{t('about.principles.diaryVsMedical.body')}</p>
          </li>
          <li>
            <strong>{t('about.principles.beyondCards.title')}</strong>
            <p>{t('about.principles.beyondCards.body')}</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="data-heading" className={styles.section}>
        <h2 id="data-heading" className={styles.sectionTitle}>
          {t('about.dataTitle')}
        </h2>
        <ul className={styles.dataList}>
          <li>{t('about.data.storage')}</li>
          <li>{t('about.data.backup')}</li>
          <li>{t('about.data.species')}</li>
          <li>{t('about.data.registry')}</li>
          <li>{t('about.data.external')}</li>
        </ul>
      </section>

      <section aria-labelledby="limits-heading" className={styles.section}>
        <h2 id="limits-heading" className={styles.sectionTitle}>
          {t('about.limitsTitle')}
        </h2>
        <ul className={styles.limitsList}>
          <li>{t('about.limits.map')}</li>
          <li>{t('about.limits.whiteList')}</li>
          <li>{t('about.limits.multiPet')}</li>
          <li>{t('about.limits.insurance')}</li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <Link to="/" className={styles.footerLink}>
          ← {t('about.backHome')}
        </Link>
        <Link to="/contact" className={styles.footerLink}>
          {t('about.contactCta')} →
        </Link>
        <a
          href="https://github.com/blue45f/pettography"
          target="_blank"
          rel="noreferrer"
          className={styles.footerLink}
        >
          GitHub ↗
        </a>
      </footer>
    </article>
  )
}

export default About
