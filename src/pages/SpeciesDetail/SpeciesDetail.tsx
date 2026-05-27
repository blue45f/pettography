import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import styles from './SpeciesDetail.module.css'

function SpeciesDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const params = useParams<{ idOrSlug: string }>()
  const setCategory = useOnboardingStore((s) => s.setCategory)
  const setSpecies = useOnboardingStore((s) => s.setSpecies)
  const complete = useOnboardingStore((s) => s.complete)

  const { data: species, isLoading } = useSpecies(params.idOrSlug)
  useDocumentTitle(species?.koreanName ?? t('common.appName'))

  if (isLoading) return <Skeleton variant="rectangular" height={200} lines={3} />
  if (!species) return <EmptyState icon="🐾" title={t('care.notFound')} />

  function handlePick() {
    if (!species) return
    setCategory(species.category)
    setSpecies(species.id)
    complete()
    toast(t('onboarding.finish'), 'success')
    navigate('/dashboard')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span aria-hidden="true" className={styles.emoji}>
          {species.heroEmoji}
        </span>
        <div>
          <h1 className={styles.title}>{species.koreanName}</h1>
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
      </header>

      <Card padding="lg">
        <Card.Body>
          <p>{species.summary}</p>
          <dl className={styles.dl}>
            <div>
              <dt>{t('care.environment')}</dt>
              <dd>{species.environment}</dd>
            </div>
            <div>
              <dt>{t('care.diet')}</dt>
              <dd>{species.diet}</dd>
            </div>
          </dl>
          <div className={styles.tagRow}>
            {species.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={handlePick}>
          {t('species.selectThis')}
        </Button>
        <Link to={`/care/${species.id}`} className={styles.secondaryLink}>
          {t('care.title')} →
        </Link>
      </div>
    </section>
  )
}

export default SpeciesDetail
