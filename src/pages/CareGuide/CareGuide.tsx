import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useCareGuide } from '@domains/care-guides'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import usePageMeta from '@hooks/usePageMeta'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import styles from './CareGuide.module.css'

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function CareGuide() {
  const { t, i18n } = useTranslation()
  const params = useParams<{ speciesId?: string }>()
  const profile = useOnboardingStore((s) => s.profile)
  const targetId = params.speciesId ?? profile.speciesId ?? undefined
  usePageMeta({
    title: `${t('care.title')} · ${t('common.appName')}`,
    description: t('pageMeta.careDescription'),
    path: '/care',
  })

  const speciesQuery = useSpecies(targetId)
  const guideQuery = useCareGuide(targetId)
  const species = speciesQuery.data
  const guide = guideQuery.data
  const references = guide?.references.filter((reference) => isHttpUrl(reference.url)) ?? []

  if (!targetId) {
    return (
      <section className={styles.page}>
        <EmptyState
          icon="📝"
          title={t('care.notFound')}
          action={
            <Link to="/species" className={styles.emptyAction}>
              {t('species.catalogTitle')}
            </Link>
          }
        />
      </section>
    )
  }

  if (speciesQuery.isError || guideQuery.isError) {
    return (
      <section className={styles.page}>
        <EmptyState
          icon="⚠️"
          title={t('common.error')}
          description={t('common.loadErrorHint')}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void speciesQuery.refetch()
                void guideQuery.refetch()
              }}
            >
              {t('common.retry')}
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('care.title')}</h1>
        <p className={styles.subtitle}>{t('care.subtitle')}</p>
      </header>

      {(speciesQuery.isLoading || guideQuery.isLoading) && (
        <Skeleton variant="rectangular" height={160} lines={3} />
      )}

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
                <dd>
                  ₩{species.monthlyBudgetKrw.toLocaleString(i18n.resolvedLanguage ?? i18n.language)}
                </dd>
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
              <div className={styles.highlightCard}>
                <h3 className={styles.highlightTitle}>
                  <span aria-hidden="true">💡</span> {t('care.beginnerTip')}
                </h3>
                <p>{species.beginnerTip}</p>
              </div>
              <div className={styles.highlightCard}>
                <h3 className={styles.highlightTitle}>
                  <span aria-hidden="true">⚠️</span> {t('care.commonProblem')}
                </h3>
                <p>{species.commonProblem}</p>
              </div>
            </div>
            <div className={styles.summaryActions}>
              <Link to={`/species/${species.slug}`} className={styles.summaryLink}>
                {t('species.openDetail')}
              </Link>
              {profile.speciesId === species.id && (
                <Link to="/caresheet" className={styles.summaryLink}>
                  {t('caresheet.docTitle')}
                </Link>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      <h2 className={styles.sectionTitle}>{t('care.sectionsTitle')}</h2>
      {!guideQuery.isLoading && !guide && (
        <EmptyState
          icon="📝"
          title={t('care.notFound')}
          action={
            <Link to={`/species/${targetId}`} className={styles.emptyAction}>
              {t('species.openDetail')}
            </Link>
          }
        />
      )}
      <ol className={styles.checklist}>
        {guide?.sections.map((section, idx) => (
          <li key={`${section.title}-${idx}`}>
            <article className={styles.guideItem}>
              <h3 className={styles.itemTitle}>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          </li>
        ))}
      </ol>

      {references.length > 0 && (
        <section className={styles.references}>
          <h2 className={styles.sectionTitle}>{t('care.referencesTitle')}</h2>
          <ul>
            {references.map((ref) => (
              <li key={ref.url}>
                <a
                  href={ref.url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkAction}
                >
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
