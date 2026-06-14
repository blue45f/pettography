import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import { useToast } from '@components/common/Toast'
import AdminGate from '@components/layout/AdminGate'
import {
  createForbiddenWord,
  listAccounts,
  listForbiddenWords,
  logout,
  removeAccount,
  removeForbiddenWord,
  updateAccount,
  updateForbiddenWord,
  useAuthStore,
  type AdminUpdateAccountInput,
  type ForbiddenWordInput,
} from '@domains/auth'
import { useCafesStore } from '@domains/cafes'
import { useDiaryStore } from '@domains/diary'
import { useForumStore } from '@domains/forum'
import { useOnboardingStore } from '@domains/onboarding'
import { usePartnersStore } from '@domains/partners'
import { useConsultStore } from '@domains/vet-consult'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Admin.module.css'

function Admin() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  useDocumentTitle(t('admin.title'))

  const account = useAuthStore((s) => s.account)
  const [ruleDraft, setRuleDraft] = useState<ForbiddenWordInput>({
    phrase: '',
    action: 'block',
    matchType: 'contains',
    enabled: true,
    note: '',
  })

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
    0
  )
  const cafePosts = Object.values(cafePostsMap).flat()
  const pendingApplications = applications.filter((a) => a.status === 'pending').length
  const flaggedPosts =
    posts.filter((p) => p.hiddenByAdmin || p.autoHidden || p.reportCount > 0).length +
    cafePosts.filter((p) => p.hiddenByAdmin).length
  const canManageAccounts = account?.role === 'admin'

  const accountsQuery = useQuery({
    queryKey: ['admin', 'accounts'],
    queryFn: listAccounts,
    enabled: canManageAccounts,
  })
  const forbiddenWordsQuery = useQuery({
    queryKey: ['admin', 'forbidden-words'],
    queryFn: listForbiddenWords,
    enabled: Boolean(account),
  })

  const accountMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateAccountInput }) =>
      updateAccount(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
      toast(t('admin.savedToast'), 'success')
    },
    onError: () => toast(t('admin.saveFailedToast'), 'error'),
  })
  const removeAccountMutation = useMutation({
    mutationFn: removeAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] })
      toast(t('admin.deletedToast'), 'success')
    },
    onError: () => toast(t('admin.saveFailedToast'), 'error'),
  })
  const createRuleMutation = useMutation({
    mutationFn: createForbiddenWord,
    onSuccess: () => {
      setRuleDraft({ phrase: '', action: 'block', matchType: 'contains', enabled: true, note: '' })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'forbidden-words'] })
      toast(t('admin.savedToast'), 'success')
    },
    onError: () => toast(t('admin.saveFailedToast'), 'error'),
  })
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ForbiddenWordInput> }) =>
      updateForbiddenWord(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'forbidden-words'] })
      toast(t('admin.savedToast'), 'success')
    },
    onError: () => toast(t('admin.saveFailedToast'), 'error'),
  })
  const removeRuleMutation = useMutation({
    mutationFn: removeForbiddenWord,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'forbidden-words'] })
      toast(t('admin.deletedToast'), 'success')
    },
    onError: () => toast(t('admin.saveFailedToast'), 'error'),
  })

  function onRuleDraftChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.currentTarget
    setRuleDraft((draft) => ({ ...draft, [name]: value }))
  }

  function onSubmitRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const phrase = ruleDraft.phrase.trim()
    if (!phrase) return
    createRuleMutation.mutate({
      ...ruleDraft,
      phrase,
      note: ruleDraft.note?.trim() || null,
    })
  }

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
          <p className={styles.localNotice}>
            {account ? t('admin.sessionNotice', { name: account.name, role: account.role }) : null}
          </p>
          <Button variant="ghost" onClick={() => void logout()}>
            {t('admin.logout')}
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

        {canManageAccounts && (
          <section aria-labelledby="members-heading">
            <h2 id="members-heading" className={styles.sectionTitle}>
              {t('admin.membersTitle')}
            </h2>
            <div className={styles.managementList}>
              {accountsQuery.isLoading && (
                <p className={styles.localNotice}>{t('common.loading')}</p>
              )}
              {accountsQuery.data?.map((member) => (
                <Card key={member.id} padding="md" className={styles.managementCard}>
                  <Card.Body>
                    <div className={styles.managementHeader}>
                      <div>
                        <strong>{member.name}</strong>
                        <p className={styles.managementMeta}>{member.email}</p>
                      </div>
                      <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                        {member.status}
                      </Badge>
                    </div>
                    <div className={styles.controlGrid}>
                      <label>
                        <span>{t('admin.role')}</span>
                        <select
                          value={member.role}
                          onChange={(event) =>
                            accountMutation.mutate({
                              id: member.id,
                              input: {
                                role: event.currentTarget.value as AdminUpdateAccountInput['role'],
                              },
                            })
                          }
                        >
                          <option value="member">member</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>
                      <label>
                        <span>{t('admin.statusLabel')}</span>
                        <select
                          value={member.status}
                          onChange={(event) =>
                            accountMutation.mutate({
                              id: member.id,
                              input: {
                                status: event.currentTarget
                                  .value as AdminUpdateAccountInput['status'],
                              },
                            })
                          }
                        >
                          <option value="active">active</option>
                          <option value="suspended">suspended</option>
                          <option value="withdrawn">withdrawn</option>
                        </select>
                      </label>
                      <Button
                        variant="outline"
                        onClick={() => removeAccountMutation.mutate(member.id)}
                        disabled={member.id === account?.id}
                      >
                        {t('admin.withdraw')}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="forbidden-heading">
          <h2 id="forbidden-heading" className={styles.sectionTitle}>
            {t('admin.forbiddenWordsTitle')}
          </h2>
          <form className={styles.ruleForm} onSubmit={onSubmitRule}>
            <Input
              label={t('admin.forbiddenPhrase')}
              name="phrase"
              value={ruleDraft.phrase}
              onChange={onRuleDraftChange}
              required
            />
            <label className={styles.selectField}>
              <span>{t('admin.forbiddenAction')}</span>
              <select name="action" value={ruleDraft.action} onChange={onRuleDraftChange}>
                <option value="block">{t('admin.actionBlock')}</option>
                <option value="review">{t('admin.actionReview')}</option>
              </select>
            </label>
            <label className={styles.selectField}>
              <span>{t('admin.matchType')}</span>
              <select name="matchType" value={ruleDraft.matchType} onChange={onRuleDraftChange}>
                <option value="contains">{t('admin.matchContains')}</option>
                <option value="whole_word">{t('admin.matchWholeWord')}</option>
              </select>
            </label>
            <Input
              label={t('admin.note')}
              name="note"
              value={ruleDraft.note ?? ''}
              onChange={onRuleDraftChange}
            />
            <Button type="submit" isLoading={createRuleMutation.isPending}>
              {t('admin.addForbiddenWord')}
            </Button>
          </form>
          <div className={styles.managementList}>
            {forbiddenWordsQuery.isLoading && (
              <p className={styles.localNotice}>{t('common.loading')}</p>
            )}
            {forbiddenWordsQuery.data?.map((rule) => (
              <Card key={rule.id} padding="md" className={styles.managementCard}>
                <Card.Body>
                  <div className={styles.managementHeader}>
                    <div>
                      <strong>{rule.phrase}</strong>
                      <p className={styles.managementMeta}>
                        {rule.action} · {rule.matchType}
                        {rule.note ? ` · ${rule.note}` : ''}
                      </p>
                    </div>
                    <Badge variant={rule.enabled ? 'success' : 'default'}>
                      {rule.enabled ? t('admin.enabled') : t('admin.disabled')}
                    </Badge>
                  </div>
                  <div className={styles.inlineActions}>
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateRuleMutation.mutate({
                          id: rule.id,
                          input: { enabled: !rule.enabled },
                        })
                      }
                    >
                      {rule.enabled ? t('admin.disableRule') : t('admin.enableRule')}
                    </Button>
                    <Button variant="ghost" onClick={() => removeRuleMutation.mutate(rule.id)}>
                      {t('admin.delete')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
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
