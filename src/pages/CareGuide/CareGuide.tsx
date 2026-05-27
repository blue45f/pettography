import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useCareGuide } from '@features/care-guides'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

import styles from './CareGuide.module.css'

function CareGuide() {
  const { t } = useTranslation()
  const params = useParams<{ speciesId?: string }>()
  const profile = useOnboardingStore((s) => s.profile)
  const targetId = params.speciesId ?? profile.speciesId ?? undefined
  useDocumentTitle(t('care.title'))

  const { data: species } = useSpecies(targetId)
  const { data: guide, isLoading } = useCareGuide(targetId)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('care.title')}</h1>
        <p className={styles.subtitle}>{t('care.subtitle')}</p>
      </header>

      {species && (
        <Card padding="lg" className={styles.summaryCard}>
          <Card.Body>
            <div className={styles.summaryHeader}>
              <span aria-hidden="true" className={styles.emoji}>
                {species.heroEmoji}
              </span>
              <div>
                <h2 className={styles.speciesName}>{species.koreanName}</h2>
                <p className={styles.scientific}>{species.scientificName}</p>
                <div className={styles.badges}>
                  <Badge variant="primary">{t(`categories.${species.category}`)}</Badge>
                  <Badge variant="default">{t(`difficulty.${species.difficulty}`)}</Badge>
                  <Badge variant="success">
                    {t('care.lifespanYears', {
                      min: species.lifespanMinYears,
                      max: species.lifespanMaxYears,
                    })}
                  </Badge>
                </div>
              </div>
            </div>
            <p className={styles.summary}>{species.summary}</p>
            <dl className={styles.dl}>
              <div>
                <dt>{t('care.environment')}</dt>
                <dd>{species.environment}</dd>
              </div>
              <div>
                <dt>{t('care.diet')}</dt>
                <dd>{species.diet}</dd>
              </div>
              <div>
                <dt>{t('care.spaceNeed')}</dt>
                <dd>{t(`care.space${capitalize(species.spaceNeed)}`)}</dd>
              </div>
              <div>
                <dt>{t('care.handlingTolerance')}</dt>
                <dd>{t(`care.handling${capitalize(species.handlingTolerance)}`)}</dd>
              </div>
              <div>
                <dt>{t('care.activityPattern')}</dt>
                <dd>{t(`care.activity${capitalize(species.activityPattern)}`)}</dd>
              </div>
              <div>
                <dt>{t('care.monthlyBudget')}</dt>
                <dd>₩{species.monthlyBudgetKrw.toLocaleString('ko')}</dd>
              </div>
              <div>
                <dt>{t('care.tagsTitle')}</dt>
                <dd className={styles.tagRow}>
                  {species.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>
            <div className={styles.highlightRow}>
              <Card padding="md" className={styles.highlightCard}>
                <Card.Body>
                  <h3 className={styles.highlightTitle}>💡 {t('care.beginnerTip')}</h3>
                  <p>{species.beginnerTip}</p>
                </Card.Body>
              </Card>
              <Card padding="md" className={styles.highlightCard}>
                <Card.Body>
                  <h3 className={styles.highlightTitle}>⚠️ {t('care.commonProblem')}</h3>
                  <p>{species.commonProblem}</p>
                </Card.Body>
              </Card>
            </div>
          </Card.Body>
        </Card>
      )}

      <h2 className={styles.sectionTitle}>{t('care.sectionsTitle')}</h2>
      {isLoading && <Skeleton variant="text" lines={4} />}
      {!isLoading && !guide && <EmptyState icon="📝" title={t('care.notFound')} />}
      <ol className={styles.checklist}>
        {guide?.sections.map((section, idx) => (
          <li key={idx}>
            <Card padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{section.title}</h3>
                <p>{section.body}</p>
              </Card.Body>
            </Card>
          </li>
        ))}
      </ol>

      {guide && guide.references.length > 0 && (
        <section className={styles.references}>
          <h2 className={styles.sectionTitle}>{t('care.referencesTitle')}</h2>
          <ul>
            {guide.references.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noreferrer" className={styles.linkAction}>
                  {ref.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

export default CareGuide
