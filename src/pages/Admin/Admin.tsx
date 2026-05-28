import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import { useToast } from '@components/common/Toast'
import { useAdminStore } from '@features/admin'
import { useDiaryStore } from '@features/diary'
import { useForumStore } from '@features/forum'
import { useOnboardingStore } from '@features/onboarding'
import { usePartnersStore, type PartnerStatus } from '@features/partners'
import { useConsultStore } from '@features/vet-consult'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Admin.module.css'

function Admin() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('admin.title'))

  const isAdmin = useAdminStore((s) => s.isAdmin)
  const toggleAdmin = useAdminStore((s) => s.toggleAdmin)

  const posts = useForumStore((s) => s.posts)
  const repliesMap = useForumStore((s) => s.replies)
  const removePost = useForumStore((s) => s.removePost)
  const diaryEntries = useDiaryStore((s) => s.entries)
  const consultMessages = useConsultStore((s) => s.messages)
  const applications = usePartnersStore((s) => s.applications)
  const setAppStatus = usePartnersStore((s) => s.setStatus)
  const removeApp = usePartnersStore((s) => s.remove)
  const onboardingComplete = useOnboardingStore((s) => Boolean(s.profile.completedAt))

  const stats = useMemo(() => {
    const replyCount = Object.values(repliesMap).reduce((acc, list) => acc + (list?.length ?? 0), 0)
    const consultCount = Object.values(consultMessages).reduce(
      (acc, list) => acc + (list?.length ?? 0),
      0,
    )
    const pending = applications.filter((a) => a.status === 'pending').length
    return {
      onboardingComplete: onboardingComplete ? 1 : 0,
      forumPosts: posts.length,
      forumReplies: replyCount,
      diaryEntries: diaryEntries.length,
      consultMessages: consultCount,
      applicationsPending: pending,
      applicationsTotal: applications.length,
    }
  }, [posts, repliesMap, diaryEntries, consultMessages, applications, onboardingComplete])

  if (!isAdmin) {
    return (
      <section className={styles.page}>
        <Card padding="lg" className={styles.gate}>
          <Card.Body>
            <h1>{t('admin.gateTitle')}</h1>
            <p className={styles.subtitle}>{t('admin.gateDesc')}</p>
            <Button variant="primary" onClick={toggleAdmin}>
              {t('admin.enable')}
            </Button>
          </Card.Body>
        </Card>
      </section>
    )
  }

  function handleStatus(id: string, status: PartnerStatus) {
    setAppStatus(id, status)
    toast(t(`partners.status.${status}`), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('admin.title')}</h1>
        <p className={styles.subtitle}>{t('admin.subtitle')}</p>
        <Button variant="ghost" onClick={toggleAdmin}>
          {t('admin.disable')}
        </Button>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className={styles.sectionTitle}>
          {t('admin.statsTitle')}
        </h2>
        <div className={styles.statsGrid}>
          <StatTile label={t('admin.stats.onboarding')} value={stats.onboardingComplete} />
          <StatTile label={t('admin.stats.forumPosts')} value={stats.forumPosts} />
          <StatTile label={t('admin.stats.forumReplies')} value={stats.forumReplies} />
          <StatTile label={t('admin.stats.diaryEntries')} value={stats.diaryEntries} />
          <StatTile label={t('admin.stats.consultMessages')} value={stats.consultMessages} />
          <StatTile
            label={t('admin.stats.applicationsPending')}
            value={stats.applicationsPending}
            tone="warning"
          />
        </div>
      </section>

      <section aria-labelledby="applications-heading">
        <h2 id="applications-heading" className={styles.sectionTitle}>
          {t('admin.applicationsTitle')}
        </h2>
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

      <section aria-labelledby="moderation-heading">
        <h2 id="moderation-heading" className={styles.sectionTitle}>
          {t('admin.moderationTitle')}
        </h2>
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.id}>
              <Card padding="md">
                <Card.Body>
                  <div className={styles.appHeader}>
                    <div>
                      <strong>{post.title}</strong>
                      <p className={styles.appMeta}>
                        {t(`categories.${post.category}`)} · {post.author} ·{' '}
                        {new Date(post.createdAt).toLocaleString('ko')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removePost(post.id)}>
                      {t('admin.delete')}
                    </Button>
                  </div>
                  <p className={styles.appBody}>{post.body}</p>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

interface StatTileProps {
  label: string
  value: number
  tone?: 'default' | 'warning'
}

function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  return (
    <Card
      padding="md"
      className={[styles.tile, tone === 'warning' ? styles.tileWarning : ''].join(' ')}
    >
      <Card.Body>
        <p className={styles.tileLabel}>{label}</p>
        <p className={styles.tileValue}>{value}</p>
      </Card.Body>
    </Card>
  )
}

export default Admin
