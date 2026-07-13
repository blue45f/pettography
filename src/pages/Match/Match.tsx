import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Progress from '@components/common/Progress'
import { MATCH_MAX_SCORE, rankSpecies, type QuizAnswers } from '@domains/match-quiz'
import { useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Match.module.css'

type StepId =
  | 'experience'
  | 'difficultyAppetite'
  | 'space'
  | 'handling'
  | 'activity'
  | 'noiseSensitivity'
  | 'lifespanCommitment'
  | 'budget'

const STEPS: readonly StepId[] = [
  'experience',
  'difficultyAppetite',
  'space',
  'handling',
  'activity',
  'noiseSensitivity',
  'lifespanCommitment',
  'budget',
] as const

type Draft = Partial<QuizAnswers>

const QUESTION_OPTIONS: Record<StepId, readonly string[]> = {
  experience: ['novice', 'beginner', 'intermediate', 'advanced'],
  difficultyAppetite: ['easy-only', 'moderate', 'any-challenge'],
  space: ['small', 'medium', 'large'],
  handling: ['low', 'medium', 'high'],
  activity: ['nocturnal', 'diurnal', 'no-preference'],
  noiseSensitivity: ['quiet-required', 'tolerant', 'no-preference'],
  lifespanCommitment: ['short', 'medium', 'long'],
  budget: ['low', 'medium', 'high'],
}

function isComplete(draft: Draft): draft is QuizAnswers {
  return STEPS.every((s) => Boolean(draft[s]))
}

function Match() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('match.title'))

  const [draft, setDraft] = useState<Draft>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const speciesQuery = useSpeciesList({})
  const speciesList = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data])
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const ranked = useMemo(
    () => (submitted && isComplete(draft) ? rankSpecies(speciesList, draft).slice(0, 3) : []),
    [submitted, draft, speciesList]
  )

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const progress = ((stepIndex + 1) / STEPS.length) * 100
  const selected = draft[step]

  useEffect(() => {
    if (submitted && !speciesQuery.isLoading) resultHeadingRef.current?.focus()
  }, [speciesQuery.isLoading, submitted])

  function pick(value: string) {
    setDraft((d) => ({ ...d, [step]: value }))
  }

  function restart() {
    setDraft({})
    setStepIndex(0)
    setSubmitted(false)
  }

  const formatKrw = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value)

  if (submitted && speciesQuery.isLoading) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <h1 ref={resultHeadingRef} tabIndex={-1}>
            {t('match.loadingTitle')}
          </h1>
          <p className={styles.subtitle}>{t('match.loadingDesc')}</p>
        </header>
        <div className={styles.statusPanel} role="status" aria-busy="true">
          {t('common.loadingText')}
        </div>
      </section>
    )
  }

  if (submitted && speciesQuery.isError) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <h1 ref={resultHeadingRef} tabIndex={-1}>
            {t('match.loadFailedTitle')}
          </h1>
          <p className={styles.subtitle}>{t('match.loadFailedDesc')}</p>
        </header>
        <div className={styles.statusPanel} role="alert">
          <Button type="button" variant="primary" onClick={() => void speciesQuery.refetch()}>
            {t('common.retry')}
          </Button>
          <Button type="button" variant="outline" onClick={restart}>
            {t('match.restart')}
          </Button>
        </div>
      </section>
    )
  }

  if (submitted && ranked.length === 0) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <h1 ref={resultHeadingRef} tabIndex={-1}>
            {t('match.emptyTitle')}
          </h1>
          <p className={styles.subtitle}>{t('match.emptyDesc')}</p>
        </header>
        <div className={styles.statusPanel}>
          <Button type="button" variant="primary" onClick={restart}>
            {t('match.restart')}
          </Button>
        </div>
      </section>
    )
  }

  if (submitted && ranked.length > 0) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <h1 ref={resultHeadingRef} tabIndex={-1}>
            {t('match.resultTitle')}
          </h1>
          <p className={styles.subtitle}>{t('match.subtitle', { count: STEPS.length })}</p>
          <p className={styles.resultDisclaimer}>{t('match.resultDisclaimer')}</p>
        </header>
        <ol className={styles.results}>
          {ranked.map((m, idx) => (
            <li key={m.species.id}>
              <Card padding="lg" hoverable>
                <Card.Body>
                  <div className={styles.resultHeader}>
                    <span className={styles.resultRank} aria-hidden="true">
                      #{idx + 1}
                    </span>
                    <span aria-hidden="true" className={styles.emoji}>
                      {m.species.heroEmoji}
                    </span>
                    <div>
                      <h2 className={styles.resultTitle}>{m.species.koreanName}</h2>
                      <p className={styles.scientific}>{m.species.scientificName}</p>
                    </div>
                    <Badge variant="success">
                      {t('match.matchScore', { score: m.score, max: MATCH_MAX_SCORE })}
                    </Badge>
                  </div>
                  <p className={styles.resultSummary}>{m.species.summary}</p>
                  <div className={styles.badges}>
                    <Badge variant="primary">{t(`categories.${m.species.category}`)}</Badge>
                    <Badge variant="default">{t(`difficulty.${m.species.difficulty}`)}</Badge>
                    <Badge variant="default">
                      {t('match.monthlyBudget', { amount: formatKrw(m.species.monthlyBudgetKrw) })}
                    </Badge>
                    {m.species.filingStatus === 'regulated' && (
                      <Badge variant="warning">{t('registry.filingStatus.regulated')}</Badge>
                    )}
                  </div>
                  <Link to={`/species/${m.species.slug}`} className={styles.openLink}>
                    {t('match.openSpecies')} →
                  </Link>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ol>
        <div className={styles.footer}>
          <Link
            to={`/compare?species=${ranked.map((r) => r.species.id).join(',')}`}
            className={styles.compareLink}
          >
            {t('match.compareTop')} →
          </Link>
          <Button type="button" variant="ghost" onClick={restart}>
            {t('match.restart')}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('match.title')}</h1>
        <p className={styles.subtitle}>{t('match.subtitle', { count: STEPS.length })}</p>
        <Progress value={progress} max={100} className={styles.progress} />
        <p className={styles.progressLabel}>
          {t('match.progress', { current: stepIndex + 1, total: STEPS.length })}
        </p>
      </header>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.questionTitle}>{t(`match.questions.${step}.title`)}</h2>
          <p className={styles.questionHint}>{t(`match.questions.${step}.hint`)}</p>
          <div
            role="radiogroup"
            aria-label={t(`match.questions.${step}.title`)}
            className={styles.options}
          >
            {QUESTION_OPTIONS[step].map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected === option}
                onClick={() => pick(option)}
                className={[styles.option, selected === option ? styles.optionSelected : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {t(`match.questions.${step}.options.${option}`)}
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className={styles.footer}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          {t('match.back')}
        </Button>
        {isLast ? (
          <Button
            type="button"
            variant="primary"
            disabled={!isComplete(draft)}
            onClick={() => setSubmitted(true)}
          >
            {t('match.submit')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            disabled={!selected}
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          >
            {t('match.next')}
          </Button>
        )}
      </div>
    </section>
  )
}

export default Match
