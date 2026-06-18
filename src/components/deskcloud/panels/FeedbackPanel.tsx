/**
 * FeedbackPanel — SurveyDesk 네이티브 피드백 폼.
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 타입드 SurveyClient(getActive/submit)로 활성 설문을 받아와
 * 앱의 자체 컴포넌트(별점/Textarea/Button)와 디자인 토큰으로 렌더한다.
 * 벤더 위젯 번들·스크립트 주입 없음. SurveyDesk 비활성(VITE_SURVEYDESK_URL 미설정)
 * 이면 이 패널은 마운트되지 않는다(호출부에서 게이팅).
 */
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getSurveyClient } from '../clients'
import styles from '../DeskCloud.module.css'

import type { Survey, SurveyAnswerValue } from '@heejun/deskcloud'

const APP_ID = 'pettography'

/** 단일 질문 입력기 — 타입별로 앱 컴포넌트에 매핑. */
function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Survey['questions'][number]
  value: SurveyAnswerValue | undefined
  onChange: (next: SurveyAnswerValue) => void
}) {
  const fieldId = useId()
  const { t } = useTranslation()

  if (question.type === 'rating' || question.type === 'nps') {
    const max = question.type === 'rating' ? 5 : 10
    const scale = Array.from({ length: max }, (_, i) => i + 1)
    return (
      <fieldset className={styles.field}>
        <legend className={styles.fieldLabel}>
          {question.label}
          {question.required && <span aria-hidden="true"> *</span>}
        </legend>
        <div className={styles.ratingGroup} role="radiogroup" aria-label={question.label}>
          {scale.map((n) => (
            <button
              key={n}
              type="button"
              className={styles.ratingButton}
              aria-pressed={value === n}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
    )
  }

  if (question.type === 'single_choice' || question.type === 'multi_choice') {
    const options = question.options ?? []
    const selected = Array.isArray(value) ? value : value != null ? [String(value)] : []
    return (
      <fieldset className={styles.field}>
        <legend className={styles.fieldLabel}>
          {question.label}
          {question.required && <span aria-hidden="true"> *</span>}
        </legend>
        {options.map((opt) => {
          const checked = selected.includes(opt.value)
          return (
            <label key={opt.value} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                name={fieldId}
                checked={checked}
                onChange={() => {
                  if (question.type === 'single_choice') {
                    onChange(opt.value)
                  } else {
                    const next = checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value]
                    onChange(next)
                  }
                }}
              />
              {opt.label}
            </label>
          )
        })}
      </fieldset>
    )
  }

  // text
  return (
    <div className={styles.field}>
      <Textarea
        id={fieldId}
        label={question.required ? `${question.label} *` : question.label}
        rows={question.variant === 'long' ? 5 : 3}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('feedback.placeholder', '의견을 들려주세요')}
      />
    </div>
  )
}

export default function FeedbackPanel() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const client = getSurveyClient()
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deskcloud', 'survey', APP_ID],
    enabled: client !== null,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      try {
        return await client.getActive(APP_ID)
      } catch {
        // 활성 설문 없음(404) 등은 "설문 없음"으로 부드럽게 처리.
        return null
      }
    },
  })

  if (isLoading) return <Skeleton lines={4} />
  if (isError) {
    return (
      <EmptyState
        icon="📭"
        title={t('feedback.errorTitle', '피드백을 불러오지 못했어요')}
        description={t('feedback.errorDesc', '잠시 후 다시 시도해 주세요.')}
        variant="discover"
      />
    )
  }
  if (done) {
    return (
      <EmptyState
        icon="🙏"
        title={t('feedback.thanksTitle', '의견 감사합니다')}
        description={t('feedback.thanksDesc', '더 나은 서비스를 만드는 데 큰 도움이 됩니다.')}
        variant="default"
      />
    )
  }
  if (!data) {
    return (
      <EmptyState
        icon="💬"
        title={t('feedback.emptyTitle', '지금은 진행 중인 설문이 없어요')}
        description={t('feedback.emptyDesc', '문의는 문의하기 페이지에서 보내실 수 있습니다.')}
        variant="default"
      />
    )
  }

  const missingRequired = data.questions.some((q) => {
    if (!q.required) return false
    const v = answers[q.id]
    if (v == null) return true
    if (typeof v === 'string') return v.trim() === ''
    if (Array.isArray(v)) return v.length === 0
    return false
  })

  async function onSubmit() {
    if (!client || !data) return
    setSubmitting(true)
    try {
      await client.submit(APP_ID, {
        answers,
        meta: { pageUrl: location.href, userAgent: navigator.userAgent },
      })
      setDone(true)
      toast(t('feedback.submitted', '피드백을 보냈어요'), 'success')
    } catch {
      toast(t('feedback.submitError', '제출에 실패했어요. 다시 시도해 주세요.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit()
      }}
    >
      {data.intro && <p className={styles.rowBody}>{data.intro}</p>}
      {data.questions.map((q) => (
        <QuestionField
          key={q.id}
          question={q}
          value={answers[q.id]}
          onChange={(next) => setAnswers((prev) => ({ ...prev, [q.id]: next }))}
        />
      ))}
      <div className={styles.actions}>
        <Button type="submit" disabled={missingRequired || submitting} isLoading={submitting}>
          {t('feedback.submit', '보내기')}
        </Button>
      </div>
    </form>
  )
}
