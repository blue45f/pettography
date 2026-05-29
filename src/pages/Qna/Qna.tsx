import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@features/onboarding'
import {
  answersFor,
  parseTags,
  qnaAnswerFormSchema,
  qnaQuestionFormSchema,
  QNA_SORT_OPTIONS,
  SEED_ANSWERS,
  SEED_QUESTIONS,
  useQnaStore,
  voteCountA,
  voteCountQ,
  type QnaAnswer,
  type QnaAnswerFormValues,
  type QnaQuestion,
  type QnaQuestionFormInputValues,
  type QnaQuestionFormValues,
  type QnaSort,
} from '@features/qna'
import { useSpeciesList, type Species } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Qna.module.css'

function Qna() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('qna.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: species = [] } = useSpeciesList({})

  const questions = useQnaStore((s) => s.questions)
  const answers = useQnaStore((s) => s.answers)
  const votedQ = useQnaStore((s) => s.votedQ)
  const votedA = useQnaStore((s) => s.votedA)
  const ownQ = useQnaStore((s) => s.ownQ)
  const ownA = useQnaStore((s) => s.ownA)
  const lastAuthor = useQnaStore((s) => s.lastAuthor)
  const addQuestion = useQnaStore((s) => s.addQuestion)
  const addAnswer = useQnaStore((s) => s.addAnswer)
  const removeQuestion = useQnaStore((s) => s.removeQuestion)
  const removeAnswer = useQnaStore((s) => s.removeAnswer)
  const toggleVoteQuestion = useQnaStore((s) => s.toggleVoteQuestion)
  const toggleVoteAnswer = useQnaStore((s) => s.toggleVoteAnswer)
  const acceptAnswer = useQnaStore((s) => s.acceptAnswer)

  // Seed once via a lazy initializer (no setState-in-effect).
  useState(() => {
    useQnaStore.getState().hydrateSeed(SEED_QUESTIONS, SEED_ANSWERS)
    return true
  })

  const speciesById = useMemo(() => {
    const map = new Map<string, Species>()
    for (const s of species) map.set(s.id, s)
    return map
  }, [species])

  const [askOpen, setAskOpen] = useState(false)
  const [speciesFilter, setSpeciesFilter] = useState<string | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<QnaSort>('popular')
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const q of questions) {
      for (const tag of q.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
  }, [questions])

  const answerCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of answers) counts.set(a.questionId, (counts.get(a.questionId) ?? 0) + 1)
    return counts
  }, [answers])

  const acceptedByQuestion = useMemo(() => {
    const set = new Set<string>()
    for (const a of answers) if (a.accepted) set.add(a.questionId)
    return set
  }, [answers])

  const visibleQuestions = useMemo(
    () =>
      selectQuestions(
        questions,
        answerCounts,
        speciesFilter,
        tagFilter,
        sort,
        speciesById,
        profile.category ?? null,
      ),
    [questions, answerCounts, speciesFilter, tagFilter, sort, speciesById, profile.category],
  )

  function handleToggleOpen(id: string) {
    setOpenQuestionId((prev) => (prev === id ? null : id))
  }

  const speciesOptions = useMemo(
    () =>
      species.map((s) => ({
        value: s.id,
        label: `${s.heroEmoji} ${s.koreanName}`,
      })),
    [species],
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('qna.title')}</h1>
        <p className={styles.subtitle}>{t('qna.subtitle')}</p>
      </header>

      <div className={styles.askBar}>
        <Button
          type="button"
          variant={askOpen ? 'ghost' : 'primary'}
          onClick={() => setAskOpen((prev) => !prev)}
          aria-expanded={askOpen}
        >
          {askOpen ? t('qna.askCancel') : t('qna.askCta')}
        </Button>
      </div>

      {askOpen && (
        <AskForm
          lastAuthor={lastAuthor}
          defaultSpeciesId={profile.speciesId ?? ''}
          speciesOptions={speciesOptions}
          onSubmit={(values) => {
            const tags = parseTags(values.tags)
            const target = values.speciesId ? speciesById.get(values.speciesId) : undefined
            addQuestion({
              title: values.title,
              body: values.body,
              author: values.author,
              speciesId: values.speciesId || null,
              category: target?.category ?? null,
              tags,
            })
            toast(t('qna.askedToast'), 'success')
            setAskOpen(false)
          }}
        />
      )}

      <div className={styles.controls}>
        <div role="radiogroup" aria-label={t('qna.filterSpeciesLabel')} className={styles.filters}>
          <FilterChip
            active={speciesFilter === 'all'}
            label={t('qna.filterAll')}
            onClick={() => setSpeciesFilter('all')}
          />
          {species.map((s) => (
            <FilterChip
              key={s.id}
              active={speciesFilter === s.id}
              label={`${s.heroEmoji} ${s.koreanName}`}
              onClick={() => setSpeciesFilter((prev) => (prev === s.id ? 'all' : s.id))}
            />
          ))}
        </div>
        <Select
          aria-label={t('qna.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as QnaSort)}
          options={QNA_SORT_OPTIONS.map((s) => ({ value: s, label: t(`qna.sort.${s}`) }))}
        />
      </div>

      {allTags.length > 0 && (
        <div className={styles.tagFilters} aria-label={t('qna.filterTagLabel')}>
          {allTags.map((tag) => (
            <FilterChip
              key={tag}
              active={tagFilter === tag}
              label={`#${tag}`}
              onClick={() => setTagFilter((prev) => (prev === tag ? null : tag))}
            />
          ))}
        </div>
      )}

      {visibleQuestions.length === 0 ? (
        <EmptyState icon="❓" title={t('qna.empty')} description={t('qna.emptyHint')} />
      ) : (
        <ul className={styles.list}>
          {visibleQuestions.map((question) => {
            const sp = question.speciesId ? speciesById.get(question.speciesId) : undefined
            const isOpen = openQuestionId === question.id
            const voted = Boolean(votedQ[question.id])
            const count = answerCounts.get(question.id) ?? 0
            const hasAccepted = acceptedByQuestion.has(question.id)
            const owned = Boolean(ownQ[question.id])
            return (
              <li key={question.id}>
                <Card padding="lg" className={styles.questionCard}>
                  <Card.Body>
                    <div className={styles.questionRow}>
                      <VoteControl
                        count={voteCountQ(question)}
                        active={voted}
                        label={t('qna.voteQuestion')}
                        onToggle={() => toggleVoteQuestion(question.id)}
                      />
                      <div className={styles.questionMain}>
                        <button
                          type="button"
                          className={styles.questionTitleButton}
                          onClick={() => handleToggleOpen(question.id)}
                          aria-expanded={isOpen}
                        >
                          <h3 className={styles.questionTitle}>{question.title}</h3>
                        </button>
                        <div className={styles.metaRow}>
                          {sp && (
                            <Badge variant="primary">
                              <span aria-hidden="true">{sp.heroEmoji}</span> {sp.koreanName}
                            </Badge>
                          )}
                          {hasAccepted && <Badge variant="success">{t('qna.acceptedBadge')}</Badge>}
                          <span className={styles.metaText}>{t('qna.answerCount', { count })}</span>
                        </div>
                        {question.tags.length > 0 && (
                          <ul className={styles.tagList}>
                            {question.tags.map((tag) => (
                              <li key={tag} className={styles.tag}>
                                #{tag}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className={styles.askMeta}>
                          {question.author} ·{' '}
                          {new Date(question.createdAt).toLocaleDateString('ko')}
                        </p>
                      </div>
                    </div>

                    {isOpen && (
                      <div className={styles.detail}>
                        <p className={styles.questionBody}>{question.body}</p>
                        {owned && (
                          <div className={styles.questionActions}>
                            <button
                              type="button"
                              className={styles.dangerLink}
                              onClick={() => {
                                removeQuestion(question.id)
                                toast(t('qna.deletedToast'), 'success')
                              }}
                            >
                              {t('qna.deleteQuestion')}
                            </button>
                          </div>
                        )}

                        <AnswerList
                          answers={answersFor(answers, question.id)}
                          votedA={votedA}
                          ownA={ownA}
                          canAccept={owned}
                          onVote={(id) => toggleVoteAnswer(id)}
                          onAccept={(id) => acceptAnswer(question.id, id)}
                          onRemove={(id) => {
                            removeAnswer(id)
                            toast(t('qna.deletedToast'), 'success')
                          }}
                        />

                        <AnswerForm
                          lastAuthor={lastAuthor}
                          onSubmit={(values) => {
                            addAnswer({ questionId: question.id, ...values })
                            toast(t('qna.answeredToast'), 'success')
                          }}
                        />
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function selectQuestions(
  questions: QnaQuestion[],
  answerCounts: Map<string, number>,
  speciesFilter: string | 'all',
  tagFilter: string | null,
  sort: QnaSort,
  speciesById: Map<string, Species>,
  activeCategory: string | null,
): QnaQuestion[] {
  const filtered = questions.filter((q) => {
    if (speciesFilter !== 'all' && q.speciesId !== speciesFilter) return false
    if (tagFilter && !q.tags.includes(tagFilter)) return false
    return true
  })
  return filtered.sort((a, b) => {
    if (sort === 'recent') return b.createdAt.localeCompare(a.createdAt)
    if (sort === 'unanswered') {
      const aCount = answerCounts.get(a.id) ?? 0
      const bCount = answerCounts.get(b.id) ?? 0
      if (aCount !== bCount) return aCount - bCount
      return b.createdAt.localeCompare(a.createdAt)
    }
    // popular: surface the visitor's active species, then by votes
    if (activeCategory) {
      const aMine = speciesById.get(a.speciesId ?? '')?.category === activeCategory
      const bMine = speciesById.get(b.speciesId ?? '')?.category === activeCategory
      if (aMine !== bMine) return aMine ? -1 : 1
    }
    if (b.baseVotes !== a.baseVotes) return b.baseVotes - a.baseVotes
    return b.createdAt.localeCompare(a.createdAt)
  })
}

interface FilterChipProps {
  active: boolean
  label: string
  onClick: () => void
}

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={[styles.filterChip, active ? styles.filterActive : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

interface VoteControlProps {
  count: number
  active: boolean
  label: string
  onToggle: () => void
}

function VoteControl({ count, active, label, onToggle }: VoteControlProps) {
  return (
    <div className={styles.vote}>
      <button
        type="button"
        className={[styles.voteButton, active ? styles.voteActive : ''].filter(Boolean).join(' ')}
        aria-pressed={active}
        aria-label={label}
        onClick={onToggle}
      >
        <span aria-hidden="true">▲</span>
      </button>
      <span className={styles.voteCount}>{count}</span>
    </div>
  )
}

interface AnswerListProps {
  answers: QnaAnswer[]
  votedA: Record<string, true>
  ownA: Record<string, true>
  canAccept: boolean
  onVote: (id: string) => void
  onAccept: (id: string) => void
  onRemove: (id: string) => void
}

function AnswerList({
  answers,
  votedA,
  ownA,
  canAccept,
  onVote,
  onAccept,
  onRemove,
}: AnswerListProps) {
  const { t } = useTranslation()
  if (answers.length === 0) {
    return <p className={styles.noAnswers}>{t('qna.noAnswers')}</p>
  }
  return (
    <ul className={styles.answerList}>
      {answers.map((answer) => {
        const voted = Boolean(votedA[answer.id])
        const owned = Boolean(ownA[answer.id])
        return (
          <li
            key={answer.id}
            className={[styles.answerItem, answer.accepted ? styles.answerAccepted : '']
              .filter(Boolean)
              .join(' ')}
          >
            <VoteControl
              count={voteCountA(answer)}
              active={voted}
              label={t('qna.voteAnswer')}
              onToggle={() => onVote(answer.id)}
            />
            <div className={styles.answerMain}>
              {answer.accepted && <Badge variant="success">{t('qna.acceptedBadge')}</Badge>}
              <p className={styles.answerBody}>{answer.body}</p>
              <div className={styles.answerFooter}>
                <span className={styles.answerMeta}>
                  {answer.author} · {new Date(answer.createdAt).toLocaleDateString('ko')}
                </span>
                <div className={styles.answerActions}>
                  {canAccept && (
                    <button
                      type="button"
                      className={styles.acceptButton}
                      aria-pressed={answer.accepted}
                      onClick={() => onAccept(answer.id)}
                    >
                      {answer.accepted ? t('qna.unaccept') : t('qna.accept')}
                    </button>
                  )}
                  {owned && (
                    <button
                      type="button"
                      className={styles.dangerLink}
                      onClick={() => onRemove(answer.id)}
                    >
                      {t('qna.deleteAnswer')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

interface AskFormProps {
  lastAuthor: string
  defaultSpeciesId: string
  speciesOptions: { value: string; label: string }[]
  onSubmit: (values: QnaQuestionFormValues) => void
}

function AskForm({ lastAuthor, defaultSpeciesId, speciesOptions, onSubmit }: AskFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<QnaQuestionFormInputValues, unknown, QnaQuestionFormValues>({
    resolver: zodResolver(qnaQuestionFormSchema),
    defaultValues: {
      title: '',
      body: '',
      author: lastAuthor,
      speciesId: defaultSpeciesId || null,
      tags: '',
    },
  })

  useEffect(() => {
    if (!dirtyFields.author) setValue('author', lastAuthor)
  }, [lastAuthor, dirtyFields.author, setValue])

  const submit = handleSubmit((values) => {
    onSubmit(values)
    reset({ title: '', body: '', author: values.author, speciesId: values.speciesId, tags: '' })
  })

  return (
    <Card padding="lg" className={styles.askCard}>
      <Card.Body>
        <h2 className={styles.askTitle}>{t('qna.askTitle')}</h2>
        <form onSubmit={submit} className={styles.askForm} noValidate>
          <Input
            label={t('qna.fieldTitle')}
            placeholder={t('qna.fieldTitlePlaceholder')}
            error={errors.title?.message ? t(errors.title.message) : undefined}
            {...register('title')}
          />
          <Textarea
            label={t('qna.fieldBody')}
            rows={4}
            placeholder={t('qna.fieldBodyPlaceholder')}
            error={errors.body?.message ? t(errors.body.message) : undefined}
            {...register('body')}
          />
          <div className={styles.askRow}>
            <Select
              label={t('qna.fieldSpecies')}
              placeholder={t('qna.fieldSpeciesPlaceholder')}
              options={speciesOptions}
              error={errors.speciesId?.message ? t(errors.speciesId.message) : undefined}
              {...register('speciesId')}
            />
            <Input
              label={t('qna.fieldTags')}
              placeholder={t('qna.fieldTagsPlaceholder')}
              helperText={t('qna.fieldTagsHelp')}
              error={errors.tags?.message ? t(errors.tags.message) : undefined}
              {...register('tags')}
            />
          </div>
          <Input
            label={t('qna.fieldAuthor')}
            placeholder={t('qna.fieldAuthorPlaceholder')}
            error={errors.author?.message ? t(errors.author.message) : undefined}
            {...register('author')}
          />
          <div className={styles.askActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('qna.submitQuestion')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

interface AnswerFormProps {
  lastAuthor: string
  onSubmit: (values: QnaAnswerFormValues) => void
}

function AnswerForm({ lastAuthor, onSubmit }: AnswerFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QnaAnswerFormValues>({
    resolver: zodResolver(qnaAnswerFormSchema),
    defaultValues: { body: '', author: lastAuthor },
  })

  const submit = handleSubmit((values) => {
    onSubmit(values)
    reset({ body: '', author: values.author })
  })

  return (
    <form onSubmit={submit} className={styles.answerForm} noValidate>
      <h4 className={styles.answerFormTitle}>{t('qna.answerTitle')}</h4>
      <Textarea
        label={t('qna.fieldAnswer')}
        rows={3}
        placeholder={t('qna.fieldAnswerPlaceholder')}
        error={errors.body?.message ? t(errors.body.message) : undefined}
        {...register('body')}
      />
      <Input
        label={t('qna.fieldAuthor')}
        placeholder={t('qna.fieldAuthorPlaceholder')}
        error={errors.author?.message ? t(errors.author.message) : undefined}
        {...register('author')}
      />
      <div className={styles.answerFormActions}>
        <Button type="submit" variant="outline" size="sm" isLoading={isSubmitting}>
          {t('qna.submitAnswer')}
        </Button>
      </div>
    </form>
  )
}

export default Qna
