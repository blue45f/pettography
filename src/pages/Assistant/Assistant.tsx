import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import {
  ASSISTANT_DATA,
  categoryNote,
  decisionForTopic,
  resolveTriage,
  topicsForCategory,
  type Severity,
} from '@domains/assistant'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Assistant.module.css'

const SEVERITY_BADGE: Record<Severity, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  info: 'primary',
  caution: 'warning',
  urgent: 'error',
}

function Assistant() {
  const { t } = useTranslation()
  useDocumentTitle(t('assistant.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})
  const species = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId],
  )
  const category = profile.category

  const [topicId, setTopicId] = useState<string | null>(null)
  const [optionId, setOptionId] = useState<string | null>(null)

  // Derive everything from state during render — no setState in effects.
  const topics = useMemo(() => topicsForCategory(category, ASSISTANT_DATA), [category])
  const decision = topicId ? decisionForTopic(topicId, ASSISTANT_DATA) : null
  const question = decision?.questions[0] ?? null
  const result = topicId && optionId ? resolveTriage(topicId, optionId, ASSISTANT_DATA) : null
  const note = topicId ? categoryNote(topicId, category, ASSISTANT_DATA) : null

  function selectTopic(id: string) {
    setTopicId(id)
    setOptionId(null)
  }

  function reset() {
    setTopicId(null)
    setOptionId(null)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('assistant.title')}</h1>
        <p className={styles.subtitle}>{t('assistant.subtitle')}</p>
      </header>

      <Alert variant="info" title={t('assistant.disclaimerTitle')}>
        {t('assistant.disclaimer')}
      </Alert>

      {species ? (
        <p className={styles.context}>
          {t('assistant.context', {
            name: species.koreanName,
            category: t(`categories.${species.category}`),
          })}
        </p>
      ) : (
        <p className={styles.context}>{t('assistant.contextGeneric')}</p>
      )}

      {/* Step 1 — choose a symptom topic */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.stepTitle}>{t('assistant.step1Title')}</h2>
          <p className={styles.stepHint}>{t('assistant.step1Hint')}</p>
          <div className={styles.topicGrid}>
            {topics.map((topic) => {
              const active = topic.id === topicId
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectTopic(topic.id)}
                  className={[styles.chip, active ? styles.chipActive : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={styles.chipIcon} aria-hidden="true">
                    {topic.icon}
                  </span>
                  <span>{t(`assistant.topics.${topic.id}.label`)}</span>
                </button>
              )
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Step 2 — the topic's follow-up question */}
      {topicId && question && (
        <Card padding="lg">
          <Card.Body>
            <h2 className={styles.stepTitle}>{t('assistant.step2Title')}</h2>
            <p className={styles.question}>{t(`assistant.topics.${topicId}.question`)}</p>
            <div
              role="radiogroup"
              aria-label={t(`assistant.topics.${topicId}.question`)}
              className={styles.options}
            >
              {question.options.map((option) => {
                const active = option.id === optionId
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setOptionId(option.id)}
                    className={[styles.option, active ? styles.optionActive : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {t(`assistant.topics.${topicId}.options.${option.id}`)}
                  </button>
                )
              })}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card padding="lg">
          <Card.Body>
            <div className={styles.resultHead}>
              <Badge variant={SEVERITY_BADGE[result.severity]}>
                {t(`assistant.severity.${result.severity}`)}
              </Badge>
              <h2 className={styles.resultTitle}>{t('assistant.resultTitle')}</h2>
            </div>

            <p className={styles.advice}>{t(`assistant.advice.${result.adviceKey}`)}</p>

            {note && (
              <p className={styles.note}>
                <span className={styles.noteLabel}>{t('assistant.categoryNoteLabel')}</span>{' '}
                {t(`assistant.categoryNotes.${note}`)}
              </p>
            )}

            {species?.commonProblem && (
              <p className={styles.note}>
                <span className={styles.noteLabel}>
                  {t('assistant.speciesTipLabel', { name: species.koreanName })}
                </span>{' '}
                {species.commonProblem}
              </p>
            )}

            <p className={styles.reminder}>{t('assistant.reminder')}</p>

            {result.emergency && (
              <Alert variant="error" title={t('assistant.emergencyTitle')}>
                <p className={styles.emergencyText}>{t('assistant.emergencyBody')}</p>
                <div className={styles.emergencyLinks}>
                  <Link to="/sos" className={styles.emergencyLink}>
                    {t('assistant.emergencySos')}
                  </Link>
                  <Link to="/hospitals" className={styles.emergencyLinkOutline}>
                    {t('assistant.emergencyHospitals')}
                  </Link>
                </div>
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      {!topicId && (
        <EmptyState
          icon="🩺"
          title={t('assistant.emptyTitle')}
          description={t('assistant.emptyDescription')}
        />
      )}

      {topicId && (
        <div className={styles.footer}>
          <Button variant="ghost" type="button" onClick={reset}>
            {t('assistant.restart')}
          </Button>
        </div>
      )}
    </section>
  )
}

export default Assistant
