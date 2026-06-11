import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { useToast } from '@components/common/Toast'
import AdminGate from '@components/layout/AdminGate'
import { usePartnersStore, type PartnerStatus } from '@features/partners'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './AdminPartners.module.css'

function AdminPartners() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('admin.areaPartners'))

  const applications = usePartnersStore((s) => s.applications)
  const setAppStatus = usePartnersStore((s) => s.setStatus)
  const removeApp = usePartnersStore((s) => s.remove)

  function handleStatus(id: string, status: PartnerStatus) {
    setAppStatus(id, status)
    toast(t(`partners.status.${status}`), 'success')
  }

  return (
    <AdminGate>
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.backRow}>
            <Link to="/admin" className={styles.backLink}>
              ← {t('admin.title')}
            </Link>
          </p>
          <h1>{t('admin.areaPartners')}</h1>
          <p className={styles.subtitle}>{t('admin.partnersSubtitle')}</p>
        </header>

        {applications.length === 0 && <EmptyState icon="🤝" title={t('admin.partnersEmpty')} />}

        <ul className={styles.list}>
          {applications.map((app) => (
            <li key={app.id}>
              <Card padding="md">
                <Card.Body>
                  <div className={styles.appHeader}>
                    <div>
                      <strong>{app.name}</strong>
                      <p className={styles.appMeta}>
                        {t(`partners.kinds.${app.kind}`)} · {app.region} · {app.contact}
                      </p>
                    </div>
                    <Badge
                      variant={
                        app.status === 'approved'
                          ? 'success'
                          : app.status === 'rejected'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {t(`partners.status.${app.status}`)}
                    </Badge>
                  </div>
                  <p className={styles.appBody}>{app.description}</p>
                  <div className={styles.appActions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatus(app.id, 'approved')}
                      disabled={app.status === 'approved'}
                    >
                      {t('admin.approve')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatus(app.id, 'rejected')}
                      disabled={app.status === 'rejected'}
                    >
                      {t('admin.reject')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeApp(app.id)}>
                      {t('admin.delete')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </AdminGate>
  )
}

export default AdminPartners
