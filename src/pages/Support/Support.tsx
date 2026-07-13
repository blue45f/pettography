import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Support.module.css'

const SELF_HELP_LINKS = [
  { key: 'faq', to: '/faq', step: '01' },
  { key: 'tools', to: '/tools', step: '02' },
  { key: 'backup', to: '/backup', step: '03' },
] as const

const CONTACT_LINKS = [
  { key: 'bug', to: '/contact?category=bug' },
  { key: 'question', to: '/contact?category=question' },
  { key: 'partnership', to: '/contact?category=partnership' },
] as const

function Support() {
  const { t } = useTranslation()
  useDocumentTitle(t('support.title'))

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{t('support.eyebrow')}</p>
        <h1>{t('support.title')}</h1>
        <p className={styles.subtitle}>{t('support.subtitle')}</p>
        <span className={styles.promise}>{t('support.promise')}</span>
      </header>

      <section className={styles.urgentPanel} aria-labelledby="support-urgent-heading">
        <div className={styles.urgentCopy}>
          <span className={styles.urgentKicker}>{t('support.urgentKicker')}</span>
          <h2 id="support-urgent-heading">{t('support.urgentTitle')}</h2>
          <p>{t('support.urgentDesc')}</p>
        </div>
        <div className={styles.urgentActions}>
          <Link to="/sos" className={styles.urgentPrimary}>
            {t('support.openSos')}
          </Link>
          <Link to="/hospitals" className={styles.urgentSecondary}>
            {t('support.findHospital')}
          </Link>
        </div>
      </section>

      <div className={styles.resolutionGrid}>
        <section className={styles.selfHelp} aria-labelledby="support-self-help-heading">
          <div className={styles.sectionHead}>
            <p className={styles.sectionKicker}>{t('support.selfHelpKicker')}</p>
            <h2 id="support-self-help-heading">{t('support.selfHelpTitle')}</h2>
            <p>{t('support.selfHelpDesc')}</p>
          </div>
          <ol className={styles.pathList}>
            {SELF_HELP_LINKS.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className={styles.pathLink}>
                  <span className={styles.pathStep} aria-hidden="true">
                    {item.step}
                  </span>
                  <span className={styles.pathCopy}>
                    <strong>{t(`support.paths.${item.key}.title`)}</strong>
                    <span>{t(`support.paths.${item.key}.desc`)}</span>
                  </span>
                  <span className={styles.pathArrow} aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside className={styles.trustPanel} aria-labelledby="support-trust-heading">
          <p className={styles.sectionKicker}>{t('support.trustKicker')}</p>
          <h2 id="support-trust-heading">{t('support.trustTitle')}</h2>
          <ul className={styles.assuranceList}>
            <li>
              <span aria-hidden="true">01</span>
              <div>
                <strong>{t('support.privateTitle')}</strong>
                <p>{t('support.privateDesc')}</p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <div>
                <strong>{t('support.receiptTitle')}</strong>
                <p>{t('support.receiptDesc')}</p>
              </div>
            </li>
          </ul>
        </aside>
      </div>

      <section className={styles.contactPanel} aria-labelledby="support-contact-heading">
        <div>
          <p className={styles.contactKicker}>{t('support.contactKicker')}</p>
          <h2 id="support-contact-heading">{t('support.contactTitle')}</h2>
          <p>{t('support.contactDesc')}</p>
        </div>
        <div className={styles.contactActions}>
          <Link to="/contact" className={styles.contactPrimary}>
            {t('support.contactButton')}
          </Link>
          <nav className={styles.contactTypes} aria-label={t('support.contactTypeLabel')}>
            {CONTACT_LINKS.map((item) => (
              <Link key={item.key} to={item.to}>
                {t(`support.contactTypes.${item.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </section>
  )
}

export default Support
