import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { useToast } from '@components/common/Toast'
import AdminGate from '@components/layout/AdminGate'
import { cafeMemberCount, useCafesStore } from '@features/cafes'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './AdminCafes.module.css'

function AdminCafes() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('admin.areaCafes'))

  const cafes = useCafesStore((s) => s.cafes)
  const postsMap = useCafesStore((s) => s.posts)
  const joinedCafeIds = useCafesStore((s) => s.joinedCafeIds)
  const setCafeArchived = useCafesStore((s) => s.setCafeArchived)
  const removeCafe = useCafesStore((s) => s.removeCafe)

  return (
    <AdminGate>
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.backRow}>
            <Link to="/admin" className={styles.backLink}>
              ← {t('admin.title')}
            </Link>
          </p>
          <h1>{t('admin.areaCafes')}</h1>
          <p className={styles.subtitle}>{t('admin.cafesSubtitle')}</p>
        </header>

        {cafes.length === 0 && <EmptyState icon="☕" title={t('admin.cafesEmpty')} />}

        <ul className={styles.list}>
          {cafes.map((cafe) => {
            const postCount = (postsMap[cafe.id] ?? []).length
            return (
              <li key={cafe.id}>
                <Card padding="md" className={styles.rowCard}>
                  <Card.Body>
                    <div className={styles.row}>
                      <span className={styles.emoji} aria-hidden="true">
                        {cafe.emoji}
                      </span>
                      <div className={styles.meta}>
                        <div className={styles.titleRow}>
                          <Link to={`/cafes/${cafe.id}`} className={styles.name}>
                            {cafe.name}
                          </Link>
                          {cafe.archivedByAdmin && (
                            <Badge variant="error">{t('admin.archivedBadge')}</Badge>
                          )}
                        </div>
                        <p className={styles.sub}>
                          {t(`categories.${cafe.category}`)} · {cafe.speciesName} ·{' '}
                          {t('admin.cafeStats', {
                            members: cafeMemberCount(cafe, Boolean(joinedCafeIds[cafe.id])),
                            posts: postCount,
                          })}
                        </p>
                      </div>
                      <div className={styles.actions}>
                        {cafe.archivedByAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCafeArchived(cafe.id, false)
                              toast(t('admin.cafeRestoredToast'), 'success')
                            }}
                          >
                            {t('admin.unarchive')}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCafeArchived(cafe.id, true)
                              toast(t('admin.cafeArchivedToast'), 'success')
                            }}
                          >
                            {t('admin.archive')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeCafe(cafe.id)
                            toast(t('admin.deletedToast'), 'success')
                          }}
                        >
                          {t('admin.delete')}
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ul>
      </section>
    </AdminGate>
  )
}

export default AdminCafes
