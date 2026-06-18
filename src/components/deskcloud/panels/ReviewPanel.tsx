/**
 * ReviewPanel — ReviewDesk 네이티브 후기 월 + 작성.
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 ReviewClient.getAggregate/getWall/submit 로 평점 요약과
 * 추천 후기를 읽고 새 후기를 제출한다. 앱의 카드/별점/Input/Textarea 로 렌더.
 */
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Skeleton from '@components/common/Skeleton'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getReviewClient } from '../clients'
import styles from '../DeskCloud.module.css'
import { formatRelativeTime, renderStars } from '../helpers'

const SUBJECT_ID = 'pettography'
const SUBJECT_LABEL = 'Pettography'

function Stars({ rating, label }: { rating: number; label: string }) {
  const { filled, empty } = renderStars(rating)
  return (
    <span className={styles.stars} role="img" aria-label={label}>
      <span aria-hidden="true">{filled}</span>
      <span aria-hidden="true" className={styles.starsMuted}>
        {empty}
      </span>
    </span>
  )
}

export default function ReviewPanel() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const client = getReviewClient()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deskcloud', 'review', SUBJECT_ID],
    enabled: client !== null,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      const [aggregate, wall] = await Promise.all([
        client.getAggregate({ subjectId: SUBJECT_ID }),
        client.getWall({ limit: 12 }),
      ])
      return { aggregate, wall }
    },
  })

  async function onSubmit() {
    if (!client) return
    setSubmitting(true)
    try {
      await client.submit({
        subjectId: SUBJECT_ID,
        subjectLabel: SUBJECT_LABEL,
        rating,
        body,
        authorName: authorName.trim() || t('review.anon', '익명'),
        meta: { pageUrl: location.href },
      })
      toast(t('review.submitted', '후기가 접수됐어요. 검토 후 게시됩니다.'), 'success')
      setShowForm(false)
      setBody('')
      setAuthorName('')
      await queryClient.invalidateQueries({ queryKey: ['deskcloud', 'review'] })
    } catch {
      toast(t('review.submitError', '제출에 실패했어요. 다시 시도해 주세요.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <Skeleton lines={5} />
  if (isError) {
    return (
      <EmptyState
        icon="📭"
        title={t('review.errorTitle', '후기를 불러오지 못했어요')}
        variant="discover"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {data && data.aggregate.count > 0 && data.aggregate.avgRating != null && (
        <div className={styles.aggregate}>
          <span className={styles.aggregateScore}>{data.aggregate.avgRating.toFixed(1)}</span>
          <Stars
            rating={data.aggregate.avgRating}
            label={t('review.avgLabel', {
              defaultValue: '평균 별점 {{n}}점',
              n: data.aggregate.avgRating.toFixed(1),
            })}
          />
          <span className={styles.rowMeta}>
            {t('review.count', { defaultValue: '후기 {{n}}개', n: data.aggregate.count })}
          </span>
        </div>
      )}

      {!showForm && (
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            {t('review.write', '후기 남기기')}
          </Button>
        </div>
      )}

      {showForm && (
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit()
          }}
        >
          <fieldset className={styles.field}>
            <legend className={styles.fieldLabel}>{t('review.ratingLabel', '별점')}</legend>
            <div className={styles.ratingGroup} role="radiogroup" aria-label={t('review.ratingLabel', '별점')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.ratingButton}
                  aria-pressed={rating === n}
                  aria-label={t('review.starN', { defaultValue: '{{n}}점', n })}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>
          <Input
            label={t('review.nameLabel', '닉네임')}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t('review.namePlaceholder', '표시할 이름 (선택)')}
          />
          <Textarea
            label={t('review.bodyLabel', '후기 내용')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={t('review.bodyPlaceholder', '경험을 들려주세요')}
          />
          <div className={styles.actions}>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              {t('common.cancel', '취소')}
            </Button>
            <Button type="submit" disabled={body.trim().length === 0 || submitting} isLoading={submitting}>
              {t('review.submit', '등록')}
            </Button>
          </div>
        </form>
      )}

      {data && data.wall.items.length === 0 ? (
        <EmptyState
          icon="⭐"
          title={t('review.emptyTitle', '아직 후기가 없어요')}
          description={t('review.emptyDesc', '첫 후기를 남겨 주세요.')}
          variant="default"
        />
      ) : (
        <ul className={styles.list}>
          {data?.wall.items.map((review) => (
            <li key={review.id} className={styles.row}>
              <div className={styles.rowHead}>
                <Stars
                  rating={review.rating}
                  label={t('review.starsLabel', { defaultValue: '{{n}}점', n: review.rating })}
                />
                <span className={styles.rowMeta}>
                  {formatRelativeTime(review.createdAt, i18n.language)}
                </span>
              </div>
              {review.title && <h3 className={styles.rowTitle}>{review.title}</h3>}
              <p className={styles.rowBody}>{review.body}</p>
              <span className={styles.rowMeta}>— {review.authorName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
