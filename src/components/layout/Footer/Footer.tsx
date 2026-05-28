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
