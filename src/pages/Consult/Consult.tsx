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

import styles from './Consult.module.css'

const STATUS_LABEL: Record<Vet['status'], string> = {
  online: 'online',
  busy: 'busy',
  offline: 'offline',
}

function Consult() {
  const { t } = useTranslation()
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
  const replyTimerRef = useRef<number | null>(null)

  // vets 는 조건식 산출물이라 렌더마다 식별자가 바뀐다 — 원시값(첫 수의사 id)만 의존해 재실행 안정화
  const firstVetId = vets[0]?.id ?? null
  useEffect(() => {
    if (!activeVetId && firstVetId) setActiveVet(firstVetId)
  }, [activeVetId, firstVetId, setActiveVet])

  useEffect(
    () => () => {
      if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current)
    },
    []
  )

  function send() {
    const trimmed = draft.trim()
    if (!trimmed || !activeVet) return
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
    replyTimerRef.current = window.setTimeout(() => {
      addMessage(
        activeVet.id,
        'vet',
        `[${activeVet.name}] 메시지 잘 받았습니다. 사진 한 장 보내주시고, 사육 환경(온도·습도) 알려주시면 1차 답변 드리겠습니다.`
      )
      toast(t('consult.replyToast'), 'success')
    }, replyDelay)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('consult.title')}</h1>
        <p className={styles.subtitle}>{t('consult.subtitle')}</p>
        <p className={styles.modeLine}>
          <span
            className={[styles.modeDot, isConsultRemote ? styles.modeDotLive : ''].join(' ')}
            aria-hidden="true"
          />
          {isConsultRemote ? t('consult.modeLive') : t('consult.modeDemo')}
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.vetList} aria-label={t('consult.vetListLabel')}>
          {isConsultRemote && vetsQuery.isLoading && (
            <p className={styles.vetListStatus}>{t('common.loadingShort')}</p>
          )}
          {isConsultRemote && vetsQuery.isError && (
            <p className={styles.vetListStatus}>{t('consult.loadFailed')}</p>
          )}
          {vets.map((vet) => {
            const isActive = activeVet?.id === vet.id
            return (
              <button
                key={vet.id}
                type="button"
                onClick={() => setActiveVet(vet.id)}
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
                    />
                  </div>
                  <p className={styles.vetClinic}>{vet.clinic}</p>
                  <p className={styles.vetSpecs}>{vet.specialties.join(' · ')}</p>
                  <p className={styles.vetMetaLine}>
                    {t('consult.experience', { years: vet.yearsOfExperience })} · ₩
                    {vet.hourlyKrw.toLocaleString('ko')}/시
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

                <ol className={styles.transcript}>
                  {conversation.length === 0 && !threadQuery.isLoading && (
                    <li className={styles.empty}>{t('consult.firstMessageHint')}</li>
                  )}
                  {isConsultRemote && threadQuery.isLoading && (
                    <li className={styles.empty}>{t('consult.syncing')}</li>
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
                        {new Date(msg.createdAt).toLocaleTimeString('ko', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
                    aria-label={t('consult.placeholder')}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!draft.trim()}
                    isLoading={sendMutation.isPending}
                  >
                    {t('consult.send')}
                  </Button>
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
