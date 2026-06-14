import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Progress from '@components/common/Progress'
import Switch from '@components/common/Switch'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import {
  ALL_SAFETY_ITEM_IDS,
  auditProgress,
  categoryRisks,
  groupProgress,
  safetyLevel,
  SAFETY_ITEMS,
  useActivePetAudit,
  useSafetyStore,
  type SafetyLevel,
} from '@domains/safety'
import { useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Safety.module.css'

/** Both Badge and Progress accept this error|warning|success subset. */
const LEVEL_VARIANT: Record<SafetyLevel, 'error' | 'warning' | 'success'> = {
  low: 'error',
  medium: 'warning',
  high: 'success',
}

function Safety() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('safety.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const { data: speciesList = [] } = useSpeciesList({})

  const checked = useActivePetAudit()
  const toggleItem = useSafetyStore((s) => s.toggleItem)
  const resetAudit = useSafetyStore((s) => s.resetAudit)

  const petKey = activePetId ?? 'default'

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId),
    [speciesList, profile.speciesId]
  )

  const petName = profile.petName?.trim() || activeSpecies?.koreanName || ''

  const overall = useMemo(() => auditProgress(checked, ALL_SAFETY_ITEM_IDS), [checked])
  const level = useMemo(() => safetyLevel(overall.pct), [overall.pct])
  const risks = useMemo(() => categoryRisks(profile.category), [profile.category])

  const handleToggle = (itemId: string) => {
    toggleItem(petKey, itemId)
  }

  const handleReset = () => {
    resetAudit(petKey)
    toast(t('safety.score.resetDone'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('safety.title')}</h1>
        <p className={styles.subtitle}>{t('safety.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span>{' '}
            {petName || activeSpecies.koreanName}
          </p>
        )}
      </header>

      <Card padding="lg" className={styles.scoreCard}>
        <Card.Body>
          <div className={styles.scoreTop}>
            <div className={styles.scoreHead}>
              <div className={styles.scoreTitleRow}>
                <h2 className={styles.scoreTitle}>{t('safety.score.title')}</h2>
                <Badge variant={LEVEL_VARIANT[level]}>{t(`safety.levels.${level}`)}</Badge>
              </div>
              <p className={styles.scoreDesc}>{t('safety.score.desc')}</p>
            </div>
            <div className={styles.scoreCount}>
              <span className={styles.scorePct}>{overall.pct}%</span>
              <span className={styles.scoreFraction}>
                {t('safety.score.count', { done: overall.done, total: overall.total })}
              </span>
            </div>
          </div>
          <Progress
            value={overall.pct}
            variant={LEVEL_VARIANT[level]}
            size="lg"
            label={t('safety.score.aria', { pct: overall.pct })}
          />
          <p className={styles.creed}>{t('safety.creed')}</p>
        </Card.Body>
      </Card>

      <section aria-labelledby="safety-risks" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="safety-risks" className={styles.sectionTitle}>
            {t('safety.risksTitle')}
          </h2>
          <p className={styles.sectionIntro}>{t('safety.risksIntro')}</p>
        </header>
        <Alert variant="warning" title={t('safety.risksAlertTitle')}>
          <ul className={styles.riskList}>
            {risks.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </Alert>
      </section>

      <section aria-labelledby="safety-checklist" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="safety-checklist" className={styles.sectionTitle}>
            {t('safety.checklist.title')}
          </h2>
          <p className={styles.sectionIntro}>{t('safety.checklist.intro')}</p>
        </header>

        <div className={styles.groups}>
          {SAFETY_ITEMS.map((group) => {
            const prog = groupProgress(checked, group.itemIds)
            return (
              <Card key={group.id} padding="lg" className={styles.groupCard}>
                <Card.Body>
                  <div className={styles.groupHeader}>
                    <h3 className={styles.groupTitle}>{t(`safety.groups.${group.id}`)}</h3>
                    <Badge variant={prog.pct === 100 ? 'success' : 'default'}>
                      {t('safety.score.count', { done: prog.done, total: prog.total })}
                    </Badge>
                  </div>
                  <Progress
                    value={prog.pct}
                    variant={prog.pct === 100 ? 'success' : 'primary'}
                    size="sm"
                    label={t('safety.score.aria', { pct: prog.pct })}
                  />
                  <ul className={styles.itemList}>
                    {group.itemIds.map((itemId) => {
                      const isChecked = Boolean(checked[itemId])
                      return (
                        <li
                          key={itemId}
                          className={`${styles.item} ${isChecked ? styles.itemChecked : ''}`}
                        >
                          <Switch
                            checked={isChecked}
                            onChange={() => handleToggle(itemId)}
                            label={t(`safety.items.${itemId}`)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </Card.Body>
              </Card>
            )
          })}
        </div>

        <div className={styles.resetRow}>
          <Button type="button" variant="ghost" onClick={handleReset} disabled={overall.done === 0}>
            {t('safety.score.reset')}
          </Button>
        </div>
      </section>

      <p className={styles.disclaimer}>{t('safety.disclaimer')}</p>
    </section>
  )
}

export default Safety
