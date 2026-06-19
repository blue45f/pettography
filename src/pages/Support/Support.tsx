import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Textarea from '@components/common/Textarea'
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
  INQUIRY_STATUS_LABELS,
  listInquiries,
  submitInquiry,
  type Inquiry,
  type InquiryCategory,
  type InquiryStatus,
} from '@domains/support'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import styles from './Support.module.css'

import type { FormEvent } from 'react'

const TITLE_MAX = 120
const BODY_MAX = 4000
const NAME_MAX = 80
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CATEGORY_HINTS: Record<InquiryCategory, string> = {
  partnership: '협업·제휴 제안',
  bug: '사이트 오류 신고',
  feedback: '개선 의견·제안',
  usage: '사용법·일반 문의',
}

/** `?category=`(예: 버그 제보 딥링크)를 유효한 카테고리로만 해석한다. 기본값은 이용 문의. */
function resolveInitialCategory(raw: string | null): InquiryCategory {
  if (raw && (INQUIRY_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as InquiryCategory
  }
  return 'usage'
}

/** desk-platform 상태 → 디자인 시스템 Badge variant. */
const STATUS_VARIANT: Record<InquiryStatus, 'warning' | 'primary' | 'success' | 'default'> = {
  new: 'warning',
  in_progress: 'primary',
  resolved: 'success',
  closed: 'default',
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
      {INQUIRY_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

/** ISO 날짜를 간단한 상대 표기로. 1주 이상은 YYYY.MM.DD 절대 표기로 폴백. */
function shortRelativeDate(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  const diffMs = Date.now() - then.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return then.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  return (
    <Card padding="md" className={styles.boardCard}>
      <Card.Body>
        <div className={styles.boardCardHead}>
          <Badge variant="default">
            {INQUIRY_CATEGORY_LABELS[inquiry.category] ?? inquiry.category}
          </Badge>
          <StatusBadge status={inquiry.status} />
          <span className={styles.boardDate}>{shortRelativeDate(inquiry.createdAt)}</span>
        </div>
        <h3 className={styles.boardCardTitle}>{inquiry.title}</h3>
        <p className={styles.boardCardBody}>{inquiry.body}</p>
        <p className={styles.boardCardAuthor}>{inquiry.authorName?.trim() || '익명'}</p>
      </Card.Body>
    </Card>
  )
}

type BoardState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; items: Inquiry[] }

function InquiryBoard() {
  const [state, setState] = useState<BoardState>({ phase: 'loading' })
  const [localKey, setLocalKey] = useState(0)

  // 목록 조회. set-state-in-effect 를 피하기 위해 상태 변경(로딩 포함)은 모두
  // 비동기 콜백 또는 이벤트 핸들러(reload)에서만 한다. 부모는 boardKey 로 이
  // 컴포넌트를 리마운트해 새 문의 등록 후 처음부터 다시 불러온다.
  useEffect(() => {
    const controller = new AbortController()
    listInquiries(20, 0, { signal: controller.signal })
      .then((list) => {
        if (controller.signal.aborted) return
        setState({ phase: 'ready', items: list.items })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : '문의 목록을 불러오지 못했습니다.',
        })
      })
    return () => controller.abort()
  }, [localKey])

  const loading = state.phase === 'loading'
  // 로딩 표시는 이펙트가 아니라 핸들러에서 켠다(set-state-in-effect 회피).
  const reload = () => {
    setState({ phase: 'loading' })
    setLocalKey((value) => value + 1)
  }

  return (
    <section className={styles.board} aria-labelledby="support-board-heading">
      <div className={styles.boardHead}>
        <h2 id="support-board-heading" className={styles.boardHeading}>
          최근 문의
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
          새로고침
        </Button>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {state.phase === 'loading' ? (
          <ul className={styles.boardGrid}>
            {[0, 1, 2, 3].map((key) => (
              <li key={key} className={styles.boardSkeleton} aria-hidden="true" />
            ))}
          </ul>
        ) : state.phase === 'error' ? (
          <Card padding="lg" className={styles.boardError}>
            <Card.Body>
              <p className={styles.boardErrorText}>{state.message}</p>
              <Button type="button" variant="outline" size="sm" onClick={reload}>
                다시 시도
              </Button>
            </Card.Body>
          </Card>
        ) : state.items.length === 0 ? (
          <EmptyState
            icon="📭"
            title="아직 등록된 문의가 없습니다"
            description="첫 문의를 남겨 주세요. 등록된 문의는 이 게시판에 공개로 표시됩니다."
          />
        ) : (
          <ul className={styles.boardGrid}>
            {state.items.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryCard inquiry={inquiry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Support() {
  useDocumentTitle('문의 · Pettography')
  const fieldId = useId()
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState<InquiryCategory>(() =>
    resolveInitialCategory(searchParams.get('category'))
  )
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('') // 허니팟 — 사람은 채우지 않는다.
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // 새 문의를 등록하면 게시판을 다시 불러오기 위한 키.
  const [boardKey, setBoardKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // 라우트 진입 시 페이지 제목으로 포커스를 옮긴다(스크린리더 컨텍스트 + 키보드 시작점).
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const validate = (): string | null => {
    if (!title.trim()) return '제목을 입력해 주세요.'
    if (title.trim().length > TITLE_MAX) return `제목은 ${TITLE_MAX}자 이하로 입력해 주세요.`
    if (!body.trim()) return '내용을 입력해 주세요.'
    if (body.trim().length > BODY_MAX) return `내용은 ${BODY_MAX}자 이하로 입력해 주세요.`
    if (authorName.trim().length > NAME_MAX) return `이름은 ${NAME_MAX}자 이하로 입력해 주세요.`
    if (contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())) {
      return '올바른 이메일 형식을 입력해 주세요.'
    }
    return null
  }

  const resetForm = () => {
    setTitle('')
    setBody('')
    setAuthorName('')
    setContactEmail('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitted(false)

    // 허니팟이 채워졌으면 봇으로 간주하고 조용히 성공 처리한다(서버 호출 생략).
    if (website.trim()) {
      setSubmitted(true)
      resetForm()
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await submitInquiry({
        category,
        title: title.trim(),
        body: body.trim(),
        authorName: authorName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      })
      setSubmitted(true)
      resetForm()
      setBoardKey((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '문의 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>문의 · /support</p>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          무엇을 도와드릴까요?
        </h1>
        <p className={styles.subtitle}>
          제휴·버그·의견·이용 문의를 남겨 주세요. 접수된 문의는 아래 게시판에 공개로 표시되며,
          운영자가 확인 후 상태를 업데이트합니다. 전화·이메일 대신 이 게시판으로 문의를
          통합했습니다.
        </p>
      </header>

      {submitted ? (
        <Card padding="lg" className={styles.successCard}>
          <Card.Body>
            <div className={styles.successHead}>
              <span className={styles.successIcon} aria-hidden="true">
                ✅
              </span>
              <div>
                <h2 className={styles.successTitle}>문의가 접수되었습니다.</h2>
                <p className={styles.successDesc}>
                  아래 게시판에서 등록된 문의를 확인할 수 있습니다. 운영자가 확인 후 상태를
                  업데이트합니다.
                </p>
              </div>
            </div>
            <div className={styles.successActions}>
              <Button type="button" variant="outline" onClick={() => setSubmitted(false)}>
                문의 더 남기기
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card padding="lg" className={styles.formCard}>
          <Card.Body>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>카테고리</legend>
                <div className={styles.categoryRow}>
                  {INQUIRY_CATEGORIES.map((value) => {
                    const selected = value === category
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        title={CATEGORY_HINTS[value]}
                        onClick={() => setCategory(value)}
                        className={`${styles.categoryChip} ${selected ? styles.categoryChipActive : ''}`}
                      >
                        {INQUIRY_CATEGORY_LABELS[value]}
                      </button>
                    )
                  })}
                </div>
                <p className={styles.categoryHint}>{CATEGORY_HINTS[category]}</p>
              </fieldset>

              <Input
                id={`${fieldId}-title`}
                label="제목"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={TITLE_MAX}
                required
                placeholder="문의 제목을 한 줄로 적어 주세요"
                helperText={`${title.length}/${TITLE_MAX}`}
              />

              <Textarea
                id={`${fieldId}-body`}
                label="내용"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={BODY_MAX}
                required
                rows={6}
                placeholder="문의 내용을 자세히 적어 주세요. 버그 신고라면 재현 방법과 환경을 함께 알려 주시면 빠르게 확인할 수 있습니다."
                helperText={`${body.length}/${BODY_MAX}`}
              />

              <div className={styles.formRow}>
                <Input
                  id={`${fieldId}-name`}
                  label="이름 (선택)"
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  maxLength={NAME_MAX}
                  autoComplete="name"
                  placeholder="게시판에 표시될 이름"
                />
                <Input
                  id={`${fieldId}-email`}
                  type="email"
                  label="이메일 (선택)"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="답변 받을 이메일 (비공개)"
                />
              </div>

              {/* 허니팟: 스크린리더·일반 사용자에게 숨김. 봇이 채우면 무음 처리. */}
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor={`${fieldId}-website`}>웹사이트(입력하지 마세요)</label>
                <input
                  id={`${fieldId}-website`}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {/* 검증/제출 에러는 aria-live 로 announce. */}
              <p role="alert" aria-live="assertive" className={styles.errorSlot}>
                {error ? <span className={styles.errorText}>{error}</span> : null}
              </p>

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  disabled={submitting}
                >
                  {submitting ? '접수 중…' : '문의 접수'}
                </Button>
                <span className={styles.privacyNote}>이메일은 비공개로 운영자만 확인합니다.</span>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      <nav className={styles.channels} aria-label="다른 채널">
        <span className={styles.channelsLabel}>다른 채널</span>
        <Link to="/forum" className={styles.channelLink}>
          커뮤니티 포럼 →
        </Link>
        <Link to="/consult" className={styles.channelLink}>
          수의사 상담 →
        </Link>
        <Link to="/sos" className={styles.channelLink}>
          응급 SOS →
        </Link>
      </nav>

      <InquiryBoard key={boardKey} />
    </section>
  )
}

export default Support
