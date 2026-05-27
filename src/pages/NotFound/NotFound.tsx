import Button from '@components/common/Button'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import styles from './NotFound.module.css'

function NotFound() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('notFound.title'))

  return (
    <section className={styles.notFound}>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.description}>{t('notFound.description')}</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        {t('notFound.goHome')}
      </Button>
    </section>
  )
}

export default NotFound
