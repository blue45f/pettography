import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Progress from '@components/common/Progress'
import { useBreedingStore } from '@features/breeding'
import { useDiaryStore } from '@features/diary'
import { useFeedingStore } from '@features/feeding'
import { useMoltStore } from '@features/molt'
import { useOnboardingStore } from '@features/onboarding'
import {
  computeMetrics,
  evaluateAchievements,
  passportNumber,
  unlockedCount,
  type AchievementTier,
} from '@features/passport'
import { useSpeciesList } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Passport.module.css'

const TIER_VARIANT: Record<AchievementTier, 'default' | 'primary' | 'success' | 'warning'> = {
  bronze: 'warning',
  silver: 'default',
  gold: 'success',
}

/** Keep the same fall-through scoping the per-feature hooks use. */
function scopeToActivePet<T extends { petId?: string | null }>(
  items: T[],
  activePetId: string | null,
): T[] {
  if (!activePetId) return items
  return items.filter((item) => !item.petId || item.petId === activePetId)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Passport() {
  const { t } = useTranslation()
  useDocumentTitle(t('passport.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)

  const diaryEntries = useDiaryStore((s) => s.entries)
  const moltEvents = useMoltStore((s) => s.events)
  const feedingLogs = useFeedingStore((s) => s.logs)
  const clutches = useBreedingStore((s) => s.clutches)
  const { data: speciesList = [] } = useSpeciesList({})

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) ?? null,
    [pets, activePetId],
  )

  const species = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId],
  )

  // Scope each activity list to the active pet (legacy unscoped entries fall through).
  const diary = useMemo(
    () => scopeToActivePet(diaryEntries, activePetId),
    [diaryEntries, activePetId],
  )
  const molts = useMemo(() => scopeToActivePet(moltEvents, activePetId), [moltEvents, activePetId])
  const feedings = useMemo(
    () => scopeToActivePet(feedingLogs, activePetId),
    [feedingLogs, activePetId],
  )
  const petClutches = useMemo(
    () => scopeToActivePet(clutches, activePetId),
    [clutches, activePetId],
  )

  const today = todayIso()

  const metrics = useMemo(
    () =>
      computeMetrics(
        {
          petCreatedAt: activePet?.createdAt ?? null,
          diary,
          molts,
          feedings,
          clutches: petClutches,
        },
        today,
      ),
    [activePet?.createdAt, diary, molts, feedings, petClutches, today],
  )

  const achievements = useMemo(() => evaluateAchievements(metrics), [metrics])
  const unlocked = useMemo(() => unlockedCount(achievements), [achievements])

  const totalActivity =
    metrics.diaryCount + metrics.moltCount + metrics.feedingCount + metrics.clutchCount

  const petName = profile.petName?.trim() || species?.koreanName || t('passport.card.unnamed')
  const heroEmoji = species?.heroEmoji ?? '🐾'
  const passportNo = passportNumber(activePet?.id)

  // Stat strip: the headline counts aggregated across features.
  const stats: { key: string; value: number }[] = [
    { key: 'days', value: metrics.daysTogether },
    { key: 'diary', value: metrics.diaryCount },
    { key: 'molt', value: metrics.moltCount },
    { key: 'feeding', value: metrics.feedingCount },
    { key: 'clutch', value: metrics.clutchCount },
  ]

  const hasPet = activePet !== null
  const isEmpty = !hasPet || totalActivity === 0

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('passport.title')}</h1>
        <p className={styles.subtitle}>{t('passport.subtitle')}</p>
      </header>

      {/* ---------- Passport identity card (hero) ---------- */}
      <article className={styles.passport} aria-label={t('passport.card.aria', { name: petName })}>
        <div className={styles.passportTop}>
          <span className={styles.wordmark}>Pettography</span>
          <span className={styles.docType}>{t('passport.card.docType')}</span>
        </div>

        <div className={styles.passportMain}>
          <span className={styles.hero} aria-hidden="true">
            {heroEmoji}
          </span>
          <div className={styles.identity}>
            <span className={styles.petName}>{petName}</span>
            {species ? (
              <>
                <span className={styles.species}>{species.koreanName}</span>
                <span className={styles.scientific}>{species.scientificName}</span>
              </>
            ) : (
              <span className={styles.species}>{t('passport.card.speciesUnknown')}</span>
            )}
          </div>
        </div>

        <dl className={styles.passportStats}>
          <div className={styles.passportStat}>
            <dt>{t('passport.card.daysTogether')}</dt>
            <dd>{t('passport.card.daysValue', { count: metrics.daysTogether })}</dd>
          </div>
          <div className={styles.passportStat}>
            <dt>{t('passport.stats.diary')}</dt>
            <dd>{metrics.diaryCount}</dd>
          </div>
          <div className={styles.passportStat}>
            <dt>{t('passport.stats.molt')}</dt>
            <dd>{metrics.moltCount}</dd>
          </div>
          <div className={styles.passportStat}>
            <dt>{t('passport.card.badges')}</dt>
            <dd>{unlocked}</dd>
          </div>
        </dl>

        <div className={styles.passportFoot}>
          <span className={styles.passportNo}>{passportNo}</span>
          <span className={styles.holder}>{t('passport.card.holder', { name: petName })}</span>
        </div>
      </article>

      <p className={styles.shareNote}>{t('passport.card.shareNote')}</p>

      {/* ---------- Stat strip ---------- */}
      <ul className={styles.statStrip} aria-label={t('passport.stats.aria')}>
        {stats.map((stat) => (
          <li key={stat.key} className={styles.statChip}>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{t(`passport.stats.${stat.key}`)}</span>
          </li>
        ))}
      </ul>

      {/* ---------- Achievements ---------- */}
      <section className={styles.achSection} aria-labelledby="passport-ach-heading">
        <div className={styles.achHead}>
          <h2 id="passport-ach-heading" className={styles.achTitle}>
            {t('passport.achievements.title')}
          </h2>
          <span className={styles.achCount}>
            {t('passport.achievements.progress', {
              unlocked,
              total: achievements.length,
            })}
          </span>
        </div>

        {isEmpty ? (
          <EmptyState
            icon="🏅"
            title={t(hasPet ? 'passport.empty.title' : 'passport.empty.noPetTitle')}
            description={t(hasPet ? 'passport.empty.desc' : 'passport.empty.noPetDesc')}
          />
        ) : (
          <ul className={styles.achGrid}>
            {achievements.map((row) => {
              const { def } = row
              const cardClass = `${styles.achCard} ${row.unlocked ? styles.achUnlocked : styles.achLocked}`
              return (
                <li key={def.id}>
                  <Card padding="md" className={cardClass}>
                    <Card.Body>
                      <div className={styles.achCardTop}>
                        <span className={styles.achIcon} aria-hidden="true">
                          {def.icon}
                        </span>
                        {row.unlocked ? (
                          <Badge variant={TIER_VARIANT[def.tier]}>
                            <span aria-hidden="true">✓ </span>
                            {t(`passport.tier.${def.tier}`)}
                          </Badge>
                        ) : (
                          <Badge variant="default">{t(`passport.tier.${def.tier}`)}</Badge>
                        )}
                      </div>
                      <h3 className={styles.achName}>{t(`passport.ach.${def.id}.title`)}</h3>
                      <p className={styles.achDesc}>{t(`passport.ach.${def.id}.desc`)}</p>
                      {row.unlocked ? (
                        <span className={styles.achDone}>
                          {t('passport.achievements.unlocked')}
                        </span>
                      ) : (
                        <div className={styles.achProgress}>
                          <Progress
                            value={row.current}
                            max={def.goal}
                            variant="primary"
                            size="sm"
                          />
                          <span className={styles.achProgressLabel}>
                            {t('passport.achievements.progressCount', {
                              current: Math.min(row.current, def.goal),
                              goal: def.goal,
                            })}
                          </span>
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
    </section>
  )
}

export default Passport
