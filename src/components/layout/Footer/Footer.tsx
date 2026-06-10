import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Footer.module.css'

const TERMSDESK_BASE = 'https://termsdesk.vercel.app'
const TERMS_URL = `${TERMSDESK_BASE}/p/pettography/terms-of-service`
const PRIVACY_URL = `${TERMSDESK_BASE}/p/pettography/privacy-policy`
const SUPPORT_URL = `${TERMSDESK_BASE}/support/pettography`

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>{t('footer.copyright', { year: currentYear })}</p>
        <div className={styles.links}>
          <Link to="/about" className={styles.link}>
            {t('footer.about')}
          </Link>
          <Link to="/contact" className={styles.link}>
            {t('footer.contact')}
          </Link>
          <a href={TERMS_URL} target="_blank" rel="noreferrer" className={styles.link}>
            {t('footer.terms')}
          </a>
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className={styles.link}>
            {t('footer.privacy')}
          </a>
          <a
            href={`${SUPPORT_URL}?category=bug`}
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            TermsDesk {t('contact.categories.bug')}
          </a>
          <Link to="/faq" className={styles.link}>
            {t('footer.faq')}
          </Link>
          <Link to="/backup" className={styles.link}>
            {t('nav.backup')}
          </Link>
          <Link to="/registry" className={styles.link}>
            {t('nav.registry')}
          </Link>
          <a
            href="https://github.com/blue45f/pettography"
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
