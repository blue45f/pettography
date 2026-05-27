import { useTranslation } from 'react-i18next'

import styles from './Footer.module.css'

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>{t('footer.copyright', { year: currentYear })}</p>
        <div className={styles.links}>
          <a href="/privacy" className={styles.link}>
            {t('footer.privacy')}
          </a>
          <a href="/terms" className={styles.link}>
            {t('footer.terms')}
          </a>
          <a href="/contact" className={styles.link}>
            {t('footer.contact')}
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
