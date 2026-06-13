import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Select from '@components/common/Select'
import { SOCIAL_SLUGS, cohabVerdict, type CohabSpecies, type Verdict } from '@features/cohab'
import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList, type Species } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Cohab.module.css'

/** Badge colour per verdict. `no` is an error; the two warnings share warning. */
const VERDICT_VARIANT: Record<Verdict, 'error' | 'warning' | 'success'> = {
  no: 'error',
  caution: 'warning',
  sameSpeciesOnly: 'warning',
  ok: 'success',
}

/** Big leading glyph per verdict, purely decorative. */
const VERDICT_ICON: Record<Verdict, string> = {
  no: '⛔',
  caution: '⚠️',
  sameSpeciesOnly: '👥',
  ok: '✅',
}

function toCohabSpecies(s: Species): CohabSpecies {
  return { slug: s.slug, category: s.category, koreanName: s.koreanName }
}

function Cohab() {
  const { t } = useTranslation()
  useDocumentTitle(t('cohab.title'))

  const { data: speciesList = [], isLoading } = useSpeciesList({})
  const activeSpeciesId = useOnboardingStore((s) => s.profile.speciesId)

  // Selections live in state, seeded lazily (no setState-in-effect). The seed is
  // a best-effort default; the resolution against the loaded list happens during
  // render so the dropdowns and verdict stay in sync.
  const [pickA, setPickA] = useState<string | null>(null)
  const [pickB, setPickB] = useState<string | null>(null)

  const options = useMemo(
    () =>
      speciesList.map((s) => ({
        value: s.id,
        label: `${s.heroEmoji} ${s.koreanName}`,
      })),
    [speciesList]
  )

  // Resolve the effective A/B ids: an explicit pick wins, otherwise default A to
  // the active pet's species (or the first listed) and B to A.
  const fallbackA = activeSpeciesId ?? speciesList[0]?.id ?? null
  const resolvedAId = pickA ?? fallbackA
  const resolvedBId = pickB ?? resolvedAId

  const speciesA = useMemo(
    () => speciesList.find((s) => s.id === resolvedAId) ?? null,
    [speciesList, resolvedAId]
  )
  const speciesB = useMemo(
    () => speciesList.find((s) => s.id === resolvedBId) ?? null,
    [speciesList, resolvedBId]
  )

  const result = useMemo(() => {
    if (!speciesA || !speciesB) return null
    return cohabVerdict(toCohabSpecies(speciesA), toCohabSpecies(speciesB))
  }, [speciesA, speciesB])

  const socialSpecies = useMemo(
    () => speciesList.filter((s) => SOCIAL_SLUGS.includes(s.slug)),
    [speciesList]
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('cohab.title')}</h1>
        <p className={styles.subtitle}>{t('cohab.subtitle')}</p>
      </header>

      <Alert variant="warning" title={t('cohab.principle.title')}>
        {t('cohab.principle.body')}
      </Alert>

      {/* ── Pair picker ───────────────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('cohab.picker.title')}</h2>
        <p className={styles.sectionIntro}>{t('cohab.picker.intro')}</p>
        <Card padding="lg">
          <Card.Body>
            <div className={styles.pickerRow}>
              <Select
                label={t('cohab.picker.speciesA')}
                options={options}
                value={resolvedAId ?? ''}
                disabled={isLoading || options.length === 0}
                onChange={(e) => setPickA(e.target.value)}
              />
              <span className={styles.plus} aria-hidden="true">
                +
              </span>
              <Select
                label={t('cohab.picker.speciesB')}
                options={options}
                value={resolvedBId ?? ''}
                disabled={isLoading || options.length === 0}
                onChange={(e) => setPickB(e.target.value)}
              />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* ── Verdict ───────────────────────────────────────────── */}
      {result && speciesA && speciesB ? (
        <VerdictCard result={result} speciesA={speciesA} speciesB={speciesB} />
      ) : (
        <EmptyState variant="gated" icon="🔎" title={t('cohab.empty')} headingLevel={2} />
      )}

      {/* ── General solitary-keeping guidance ─────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('cohab.guide.title')}</h2>
        <Card padding="lg">
          <Card.Body>
            <ul className={styles.guideList}>
              {(
                [
                  'solitaryDefault',
                  'noIntroduce',
                  'stressHidden',
                  'quarantine',
                  'oneEnclosure',
                ] as const
              ).map((id) => (
                <li key={id}>{t(`cohab.guide.${id}`)}</li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </div>

      {/* ── Social-species exceptions ─────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('cohab.social.title')}</h2>
        <p className={styles.sectionIntro}>{t('cohab.social.intro')}</p>
        {socialSpecies.length === 0 ? (
          <EmptyState icon="👥" title={t('cohab.social.empty')} headingLevel={3} />
        ) : (
          <ul className={styles.socialGrid}>
            {socialSpecies.map((s) => (
              <li key={s.id}>
                <Card padding="md">
                  <Card.Body>
                    <div className={styles.socialItem}>
                      <span className={styles.socialEmoji} aria-hidden="true">
                        {s.heroEmoji}
                      </span>
                      <div className={styles.socialText}>
                        <span className={styles.socialName}>{s.koreanName}</span>
                        <span className={styles.socialNote}>
                          {t(`cohab.social.notes.${s.slug}`)}
                        </span>
                      </div>
                      <Badge variant="success">{t('cohab.social.tag')}</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className={styles.disclaimer}>{t('cohab.disclaimer')}</p>
    </section>
  )
}

interface VerdictCardProps {
  result: { verdict: Verdict; reasonCodes: string[] }
  speciesA: Species
  speciesB: Species
}

function VerdictCard({ result, speciesA, speciesB }: VerdictCardProps) {
  const { t } = useTranslation()
  const { verdict, reasonCodes } = result
  const sameSpecies = speciesA.slug === speciesB.slug
  const cardClass = [styles.verdictCard, styles[`verdict-${verdict}`]].join(' ')

  return (
    <div className={cardClass}>
      <Card padding="lg">
        <Card.Body>
          <div className={styles.verdictHead}>
            <div className={styles.pair}>
              <span className={styles.pairEmoji} aria-hidden="true">
                {speciesA.heroEmoji}
              </span>
              <span className={styles.pairPlus} aria-hidden="true">
                +
              </span>
              <span className={styles.pairEmoji} aria-hidden="true">
                {speciesB.heroEmoji}
              </span>
            </div>
            <div className={styles.pairNames}>
              {sameSpecies
                ? t('cohab.verdict.samePair', { name: speciesA.koreanName })
                : t('cohab.verdict.pair', { a: speciesA.koreanName, b: speciesB.koreanName })}
            </div>
          </div>

          <div className={styles.verdictBanner}>
            <span className={styles.verdictIcon} aria-hidden="true">
              {VERDICT_ICON[verdict]}
            </span>
            <Badge variant={VERDICT_VARIANT[verdict]}>{t(`cohab.verdict.label.${verdict}`)}</Badge>
            <p className={styles.verdictHeadline}>{t(`cohab.verdict.headline.${verdict}`)}</p>
          </div>

          <p className={styles.verdictSummary}>{t(`cohab.verdict.summary.${verdict}`)}</p>

          <h3 className={styles.reasonsTitle}>{t('cohab.verdict.reasonsTitle')}</h3>
          <ul className={styles.reasonsList}>
            {reasonCodes.map((code) => (
              <li key={code} className={styles.reasonItem}>
                <span className={styles.reasonDot} aria-hidden="true" />
                <span>{t(`cohab.reasons.${code}`)}</span>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Cohab
