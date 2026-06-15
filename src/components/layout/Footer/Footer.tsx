import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Footer.module.css'

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
          <Link to="/terms" className={styles.link}>
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className={styles.link}>
            {t('footer.privacy')}
          </Link>
          <Link to="/contact?category=bug" className={styles.link}>
            {t('footer.reportBug')}
          </Link>
          <Link to="/faq" className={styles.link}>
            {t('footer.faq')}
          </Link>
          <Link to="/backup" className={styles.link}>
            {t('nav.backup')}
          </Link>
          <Link to="/registry" className={styles.link}>
            {t('nav.registry')}
          </Link>
          <Link to="/design" className={styles.link}>
            {t('footer.design')}
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
