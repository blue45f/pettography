import Button from '@components/common/Button'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { Compass, Home, LifeBuoy, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import styles from './NotFound.module.css'

const QUICK_LINKS = [
  { to: '/species', icon: Search, key: 'species' },
  { to: '/dashboard', icon: Compass, key: 'dashboard' },
  { to: '/sos', icon: LifeBuoy, key: 'sos' },
] as const

function NotFound() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('notFound.title'))

  return (
    <section className={styles.notFound}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.description}>{t('notFound.description')}</p>

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => navigate('/')}>
          <Home aria-hidden="true" />
          {t('notFound.goHome')}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t('notFound.goBack')}
        </Button>
      </div>

      <nav className={styles.suggestions} aria-label={t('notFound.suggestionsLabel')}>
        <p className={styles.suggestionsTitle}>{t('notFound.suggestionsTitle')}</p>
        <ul className={styles.links}>
          {QUICK_LINKS.map(({ to, icon: Icon, key }) => (
            <li key={key}>
              <Link to={to} className={styles.link}>
                <Icon aria-hidden="true" className={styles.linkIcon} />
                {t(`notFound.links.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}

export default NotFound
