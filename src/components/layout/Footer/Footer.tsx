import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import BgmDock from './BgmDock'
import styles from './Footer.module.css'

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <p className={styles.copyright}>{t('footer.copyright', { year: currentYear })}</p>
          <nav className={styles.links} aria-label={t('footer.navigation')}>
            <Link to="/about" className={styles.link}>
              {t('footer.about')}
            </Link>
            <Link to="/support" className={styles.link}>
              {t('footer.support')}
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
            <Link to="/support?category=bug" className={styles.link}>
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
            <Link to="/sitemap" className={styles.link}>
              {t('footer.sitemap')}
            </Link>
            <a
              href="https://github.com/blue45f/pettography"
              target="_blank"
              rel="noreferrer"
              className={styles.link}
              aria-label={t('footer.githubLabel')}
            >
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>

        <BgmDock />

        <address className={styles.businessInfo}>
          <div className={styles.businessGrid}>
            <div className={styles.businessBlock}>
              <strong>{t('footer.business.name')}</strong>
              <span>{t('footer.business.operator')}</span>
            </div>
            <div className={styles.businessBlock}>
              <span>{t('footer.business.registration')}</span>
              <span>{t('footer.business.address')}</span>
            </div>
            <div className={styles.businessBlock}>
              <a href="mailto:blue45f@gmail.com">{t('footer.business.email')}</a>
              <a href="tel:+821038734197">{t('footer.business.phone')}</a>
            </div>
            <div className={styles.businessBlock}>
              <span>{t('footer.business.hosting')}</span>
              <span>{t('footer.business.platform')}</span>
            </div>
          </div>
          <div className={styles.businessBottom}>
            <span>{t('footer.business.rights', { year: currentYear })}</span>
            <span>{t('footer.business.beta')}</span>
          </div>
        </address>
      </div>
    </footer>
  )
}

export default Footer
