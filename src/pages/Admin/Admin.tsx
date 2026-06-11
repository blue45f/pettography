import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import AdminGate from '@components/layout/AdminGate'
import { useAdminStore } from '@features/admin'
import { useCafesStore } from '@features/cafes'
import { useDiaryStore } from '@features/diary'
import { useForumStore } from '@features/forum'
import { useOnboardingStore } from '@features/onboarding'
import { usePartnersStore } from '@features/partners'
import { useConsultStore } from '@features/vet-consult'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Admin.module.css'

function Admin() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.title'))

  const disableAdmin = useAdminStore((s) => s.disableAdmin)

  const posts = useForumStore((s) => s.posts)
  const repliesMap = useForumStore((s) => s.replies)
  const diaryEntries = useDiaryStore((s) => s.entries)
  const consultMessages = useConsultStore((s) => s.messages)
  const applications = usePartnersStore((s) => s.applications)
  const cafes = useCafesStore((s) => s.cafes)
  const cafePostsMap = useCafesStore((s) => s.posts)
  const onboardingComplete = useOnboardingStore((s) => Boolean(s.profile.completedAt))

  const replyCount = Object.values(repliesMap).reduce((acc, list) => acc + (list?.length ?? 0), 0)
  const consultCount = Object.values(consultMessages).reduce(
    (acc, list) => acc + (list?.length ?? 0),
    0,
  )
  const cafePosts = Object.values(cafePostsMap).flat()
  const pendingApplications = applications.filter((a) => a.status === 'pending').length
  const flaggedPosts =
    posts.filter((p) => p.hiddenByAdmin || p.autoHidden || p.reportCount > 0).length +
    cafePosts.filter((p) => p.hiddenByAdmin).length

  const areas = [
    {
      path: '/admin/moderation',
      emoji: '🧹',
      title: t('admin.areaModeration'),
      desc: t('admin.areaModerationDesc'),
      count: flaggedPosts,
    },
    {
      path: '/admin/cafes',
      emoji: '☕',
      title: t('admin.areaCafes'),
      desc: t('admin.areaCafesDesc'),
      count: cafes.length,
    },
    {
      path: '/admin/partners',
      emoji: '🤝',
      title: t('admin.areaPartners'),
      desc: t('admin.areaPartnersDesc'),
      count: pendingApplications,
    },
  ]

  return (
    <AdminGate>
      <section className={styles.page}>
        <header className={styles.header}>
          <h1>{t('admin.title')}</h1>
          <p className={styles.subtitle}>{t('admin.subtitle')}</p>
          <p className={styles.localNotice}>{t('admin.localNotice')}</p>
          <Button variant="ghost" onClick={disableAdmin}>
            {t('admin.disable')}
          </Button>
        </header>

        <section aria-labelledby="areas-heading">
          <h2 id="areas-heading" className={styles.sectionTitle}>
            {t('admin.areasTitle')}
          </h2>
          <ul className={styles.areaList}>
            {areas.map((area) => (
              <li key={area.path}>
                <Link to={area.path} className={styles.areaLink}>
                  <span className={styles.areaEmoji} aria-hidden="true">
                    {area.emoji}
                  </span>
                  <span className={styles.areaMeta}>
                    <span className={styles.areaTitle}>{area.title}</span>
                    <span className={styles.areaDesc}>{area.desc}</span>
                  </span>
                  <Badge variant={area.count > 0 ? 'warning' : 'default'}>{area.count}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className={styles.sectionTitle}>
            {t('admin.statsTitle')}
          </h2>
          <div className={styles.statsGrid}>
            <StatTile label={t('admin.stats.onboarding')} value={onboardingComplete ? 1 : 0} />
            <StatTile label={t('admin.stats.forumPosts')} value={posts.length} />
            <StatTile label={t('admin.stats.forumReplies')} value={replyCount} />
            <StatTile label={t('admin.stats.cafes')} value={cafes.length} />
            <StatTile label={t('admin.stats.cafePosts')} value={cafePosts.length} />
            <StatTile label={t('admin.stats.diaryEntries')} value={diaryEntries.length} />
            <StatTile label={t('admin.stats.consultMessages')} value={consultCount} />
            <StatTile
              label={t('admin.stats.applicationsPending')}
              value={pendingApplications}
              tone="warning"
            />
          </div>
        </section>
      </section>
    </AdminGate>
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
