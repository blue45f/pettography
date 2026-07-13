import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  isConsultRemote,
  useConsultStore,
  useConsultThread,
  useConsultVets,
  useSendVetMessage,
  vetsMock,
  type Vet,
} from '@domains/vet-consult'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Consult.module.css'

const STATUS_LABEL: Record<Vet['status'], string> = {
  online: 'online',
  busy: 'busy',
  offline: 'offline',
}

const MAX_MESSAGE_LENGTH = 2000

function Consult() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('consult.title'))

  const activeVetId = useConsultStore((s) => s.activeVetId)
  const localMessages = useConsultStore((s) => s.messages)
  const setActiveVet = useConsultStore((s) => s.setActiveVet)
  const addMessage = useConsultStore((s) => s.addMessage)

  const vetsQuery = useConsultVets()
  const threadQuery = useConsultThread(isConsultRemote ? activeVetId : null)
  const sendMutation = useSendVetMessage(activeVetId)

  const [draft, setDraft] = useState('')
  const vets = isConsultRemote ? (vetsQuery.data ?? []) : vetsMock
  const activeVet = vets.find((v) => v.id === activeVetId) ?? null
  const conversation = isConsultRemote
    ? (threadQuery.data ?? [])
    : activeVetId
      ? (localMessages[activeVetId] ?? [])
      : []
  const replyTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const transcriptRef = useRef<HTMLOListElement>(null)

  // vets 는 조건식 산출물이라 렌더마다 식별자가 바뀐다 — 원시값(첫 수의사 id)만 의존해 재실행 안정화
  const firstVetId = vets[0]?.id ?? null
  const activeVetExists = activeVetId ? vets.some((vet) => vet.id === activeVetId) : false
  useEffect(() => {
    if (firstVetId && !activeVetExists) setActiveVet(firstVetId)
  }, [activeVetExists, firstVetId, setActiveVet])

  useEffect(
    () => () => {
      replyTimersRef.current.forEach((timer) => globalThis.clearTimeout(timer))
      replyTimersRef.current.clear()
    },
    []
  )

  useEffect(() => {
    const transcript = transcriptRef.current
    if (transcript) transcript.scrollTop = transcript.scrollHeight
  }, [activeVetId, conversation.length])

  function selectVet(vetId: string) {
    if (vetId === activeVetId) return
    setDraft('')
    setActiveVet(vetId)
  }

  function send() {
    const trimmed = draft.trim()
    if (!trimmed || !activeVet) return
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast(t('consult.messageTooLong', { max: MAX_MESSAGE_LENGTH }), 'error')
      return
    }
    if (isConsultRemote) {
      sendMutation.mutate(trimmed, {
        onSuccess: () => setDraft(''),
        onError: () => toast(t('consult.sendFailed'), 'error'),
      })
      return
    }
    addMessage(activeVet.id, 'user', trimmed)
    setDraft('')
    const replyDelay = 700
    const timer = globalThis.setTimeout(() => {
      replyTimersRef.current.delete(timer)
      addMessage(activeVet.id, 'vet', t('consult.demoReply', { name: activeVet.name }))
      toast(t('consult.replyToast'), 'success')
    }, replyDelay)
    replyTimersRef.current.add(timer)
  }

  const formatKrw = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('consult.title')}</h1>
        <p className={styles.subtitle}>
          {isConsultRemote ? t('consult.subtitleLive') : t('consult.subtitleDemo')}
        </p>
        <p className={styles.modeLine}>
          <span
            className={[styles.modeDot, isConsultRemote ? styles.modeDotLive : ''].join(' ')}
            aria-hidden="true"
          />
          {isConsultRemote ? t('consult.modeLive') : t('consult.modeDemo')}
        </p>
      </header>

      <Alert
        variant={isConsultRemote ? 'info' : 'warning'}
        title={isConsultRemote ? t('consult.liveNoticeTitle') : t('consult.demoNoticeTitle')}
      >
        <p>
          {isConsultRemote ? t('consult.liveNoticeBody') : t('consult.demoNoticeBody')}{' '}
          <Link to="/sos" className={styles.noticeLink}>
            {t('consult.emergencyLink')}
          </Link>
        </p>
      </Alert>

      <div className={styles.layout}>
        <aside className={styles.vetList} aria-label={t('consult.vetListLabel')}>
          {isConsultRemote && vetsQuery.isLoading && (
            <p className={styles.vetListStatus}>{t('common.loadingShort')}</p>
          )}
          {isConsultRemote && vetsQuery.isError && (
            <div className={styles.vetListStatus} role="alert">
              <p>{t('consult.loadFailed')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void vetsQuery.refetch()}
              >
                {t('common.retry')}
              </Button>
            </div>
          )}
          {!vetsQuery.isLoading && !vetsQuery.isError && vets.length === 0 && (
            <p className={styles.vetListStatus}>{t('consult.noVets')}</p>
          )}
          {vets.map((vet) => {
            const isActive = activeVet?.id === vet.id
            return (
              <button
                key={vet.id}
                type="button"
                onClick={() => selectVet(vet.id)}
                aria-pressed={isActive}
                className={[styles.vetCard, isActive ? styles.vetCardActive : ''].join(' ')}
              >
                <span aria-hidden="true" className={styles.vetAvatar}>
                  {vet.avatarEmoji}
                </span>
                <div className={styles.vetMeta}>
                  <div className={styles.vetTitleRow}>
                    <strong>{vet.name}</strong>
                    <span
                      className={[styles.statusDot, styles[`status-${vet.status}`]].join(' ')}
                      aria-hidden="true"
                    />
                  </div>
                  <p className={styles.vetClinic}>{vet.clinic}</p>
                  <p className={styles.vetSpecs}>{vet.specialties.join(' · ')}</p>
                  <p className={styles.vetMetaLine}>
                    {t('consult.experience', { years: vet.yearsOfExperience })} ·{' '}
                    {isConsultRemote
                      ? t('consult.rate', { amount: formatKrw(vet.hourlyKrw) })
                      : t('consult.demoRate', { amount: formatKrw(vet.hourlyKrw) })}
                  </p>
                </div>
                <Badge variant={vet.status === 'online' ? 'success' : 'default'}>
                  {t(`consult.status.${STATUS_LABEL[vet.status]}`)}
                </Badge>
              </button>
            )
          })}
        </aside>

        <Card padding="lg" className={styles.chatCard}>
          <Card.Body>
            {!activeVet ? (
              <EmptyState variant="gated" icon="💬" title={t('consult.pickVet')} />
            ) : (
              <>
                <header className={styles.chatHeader}>
                  <span aria-hidden="true" className={styles.chatAvatar}>
                    {activeVet.avatarEmoji}
                  </span>
                  <div>
                    <strong>{activeVet.name}</strong>
                    <p className={styles.vetClinic}>{activeVet.clinic}</p>
                  </div>
                  <Badge variant={activeVet.status === 'online' ? 'success' : 'default'}>
                    {t(`consult.status.${STATUS_LABEL[activeVet.status]}`)}
                  </Badge>
                </header>

                <ol ref={transcriptRef} className={styles.transcript} aria-live="polite">
                  {conversation.length === 0 && !threadQuery.isLoading && (
                    <li className={styles.empty}>{t('consult.firstMessageHint')}</li>
                  )}
                  {isConsultRemote && threadQuery.isLoading && (
                    <li className={styles.empty}>{t('consult.syncing')}</li>
                  )}
                  {isConsultRemote && threadQuery.isError && (
                    <li className={styles.empty} role="alert">
                      <p>{t('consult.threadFailed')}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void threadQuery.refetch()}
                      >
                        {t('common.retry')}
                      </Button>
                    </li>
                  )}
                  {conversation.map((msg) => (
                    <li
                      key={msg.id}
                      className={[
                        styles.bubble,
                        msg.role === 'user' ? styles.bubbleUser : styles.bubbleVet,
                      ].join(' ')}
                    >
                      <span className={styles.bubbleBody}>{msg.body}</span>
                      <span className={styles.bubbleTime}>
                        {new Date(msg.createdAt).toLocaleTimeString(
                          i18n.resolvedLanguage ?? i18n.language,
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </li>
                  ))}
                </ol>

                <form
                  className={styles.composer}
                  onSubmit={(e) => {
                    e.preventDefault()
                    send()
                  }}
                >
                  <Textarea
                    rows={2}
                    placeholder={t('consult.placeholder')}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={MAX_MESSAGE_LENGTH}
                    aria-label={t('consult.placeholder')}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!draft.trim() || !activeVet}
                    isLoading={sendMutation.isPending}
                  >
                    {t('consult.send')}
                  </Button>
                  <div className={styles.composerMeta}>
                    <span>{t('consult.privacyNote')}</span>
                    <span>
                      {draft.length.toLocaleString(i18n.resolvedLanguage ?? i18n.language)} /{' '}
                      {MAX_MESSAGE_LENGTH.toLocaleString()}
                    </span>
                  </div>
                </form>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </section>
  )
}

export default Consult
