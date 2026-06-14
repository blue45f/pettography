import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Sparkline from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import {
  bpm,
  respGuidanceCategory,
  sortByDate,
  trend,
  useActivePetVitals,
  useVitalsStore,
  vitalsStats,
  VITAL_DURATIONS,
  VITAL_TYPES,
  type VitalType,
} from '@domains/vitals'
import useDocumentTitle from '@hooks/useDocumentTitle'
import useInterval from '@hooks/useInterval'
import { buildCsv } from '@utils/csv'
import { downloadTextFile } from '@utils/download'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Vitals.module.css'

type Phase = 'idle' | 'running' | 'done'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Vitals() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('vitals.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId]
  )

  const activeReadings = useActivePetVitals()
  const allReadings = useVitalsStore((s) => s.readings)
  const addReading = useVitalsStore((s) => s.addReading)
  const removeReading = useVitalsStore((s) => s.removeReading)

  // --- Counter flow state (all via useState; ticking via useInterval) ---
  const [type, setType] = useState<VitalType>('respiration')
  const [duration, setDuration] = useState<number>(30)
  const [phase, setPhase] = useState<Phase>('idle')
  const [remaining, setRemaining] = useState<number>(30)
  const [taps, setTaps] = useState<number>(0)
  const [note, setNote] = useState<string>('')

  // --- History view state ---
  const [historyType, setHistoryType] = useState<VitalType>('respiration')
  const [showAllPets, setShowAllPets] = useState(false)

  const readings = showAllPets ? allReadings : activeReadings
  const stats = useMemo(() => vitalsStats(readings), [readings])

  // Live bpm estimate while running uses elapsed time; the finished reading
  // uses the full window. Derived during render — never via an effect.
  const elapsed = duration - remaining
  const liveBpm = phase === 'running' ? bpm(taps, elapsed) : bpm(taps, duration)

  // Tick once per second only while running.
  useInterval(
    () => {
      setRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          setPhase('done')
          return 0
        }
        return next
      })
    },
    phase === 'running' ? 1000 : null
  )

  const selectType = (next: VitalType) => {
    if (phase === 'running') return
    setType(next)
    if (phase === 'done') resetCounter(next, duration)
  }

  const selectDuration = (next: number) => {
    if (phase === 'running') return
    setDuration(next)
    setRemaining(next)
    if (phase === 'done') {
      setPhase('idle')
      setTaps(0)
    }
  }

  const start = () => {
    setRemaining(duration)
    setTaps(0)
    setNote('')
    setPhase('running')
  }

  const tap = () => {
    if (phase !== 'running') return
    setTaps((prev) => prev + 1)
  }

  const stop = () => {
    if (phase !== 'running') return
    setPhase('done')
  }

  function resetCounter(nextType: VitalType = type, nextDuration: number = duration) {
    setType(nextType)
    setDuration(nextDuration)
    setRemaining(nextDuration)
    setTaps(0)
    setNote('')
    setPhase('idle')
  }

  const save = () => {
    const value = bpm(taps, duration)
    addReading({
      speciesId: profile.speciesId,
      type,
      bpm: value,
      measuredAt: todayIso(),
      durationSec: duration,
      taps,
      note,
    })
    setHistoryType(type)
    toast(t('vitals.saved', { bpm: value, unit: t(`vitals.unit.${type}`) }), 'success')
    resetCounter()
  }

  const guidanceKey = respGuidanceCategory(profile.category)

  const trendValues = useMemo(() => trend(readings, historyType), [readings, historyType])
  const sparkPoints = useMemo(() => trendValues.map((v, i) => ({ x: i, y: v })), [trendValues])

  const historyList = useMemo(
    () => sortByDate(readings.filter((r) => r.type === historyType)).reverse(),
    [readings, historyType]
  )

  const petLabel = (petId: string | null | undefined) => {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((s) => s.id === pet.speciesId)
    return { name: pet.petName?.trim() || sp?.koreanName || '', emoji: sp?.heroEmoji ?? '🐾' }
  }
  const showPetBadge = showAllPets && pets.length > 1

  function exportCsv() {
    const rows = [...readings]
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
      .map((r) => [r.measuredAt, r.type, r.bpm, r.durationSec, r.taps, r.note])
    downloadTextFile(
      'pettography-vitals.csv',
      buildCsv(['date', 'type', 'bpm', 'duration_sec', 'taps', 'note'], rows),
      'text/csv;charset=utf-8'
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('vitals.title')}</h1>
        <p className={styles.subtitle}>{t('vitals.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {activeSpecies.koreanName}
          </p>
        )}
        {readings.length > 0 && (
          <Button variant="secondary" onClick={exportCsv} className={styles.exportButton}>
            {t('common.exportCsv')}
          </Button>
        )}
      </header>

      {/* Counter tool */}
      <Card padding="lg" className={styles.counterCard}>
        <Card.Body>
          <div className={styles.counterHead}>
            <h2 className={styles.cardTitle}>{t('vitals.counter.title')}</h2>
            <p className={styles.counterHint}>{t('vitals.counter.hint')}</p>
          </div>

          <div className={styles.controls}>
            <div
              className={styles.segmented}
              role="group"
              aria-label={t('vitals.counter.typeLabel')}
            >
              {VITAL_TYPES.map((vt) => (
                <button
                  key={vt}
                  type="button"
                  className={`${styles.segment} ${type === vt ? styles.segmentActive : ''}`}
                  aria-pressed={type === vt}
                  disabled={phase === 'running'}
                  onClick={() => selectType(vt)}
                >
                  {t(`vitals.type.${vt}`)}
                </button>
              ))}
            </div>

            <div
              className={styles.segmented}
              role="group"
              aria-label={t('vitals.counter.durationLabel')}
            >
              {VITAL_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.segment} ${duration === d ? styles.segmentActive : ''}`}
                  aria-pressed={duration === d}
                  disabled={phase === 'running'}
                  onClick={() => selectDuration(d)}
                >
                  {t('vitals.counter.seconds', { count: d })}
                </button>
              ))}
            </div>
          </div>

          {/* Live display */}
          <div className={styles.display} aria-live="polite">
            <div className={styles.displayItem}>
              <span className={styles.displayLabel}>{t('vitals.counter.remaining')}</span>
              <span className={styles.displayValue}>
                {phase === 'done' ? 0 : remaining}
                <span className={styles.displayUnit}>{t('vitals.counter.secUnit')}</span>
              </span>
            </div>
            <div className={styles.displayItem}>
              <span className={styles.displayLabel}>{t('vitals.counter.taps')}</span>
              <span className={styles.displayValue}>{taps}</span>
            </div>
            <div className={styles.displayItem}>
              <span className={styles.displayLabel}>{t('vitals.counter.liveBpm')}</span>
              <span className={styles.displayValue}>
                {liveBpm}
                <span className={styles.displayUnit}>{t(`vitals.unit.${type}`)}</span>
              </span>
            </div>
          </div>

          {/* Big tap target — only active while running */}
          <button
            type="button"
            className={styles.tapButton}
            onClick={tap}
            disabled={phase !== 'running'}
            aria-label={t('vitals.counter.tapAria', { type: t(`vitals.type.${type}`) })}
          >
            <span className={styles.tapBig}>{t('vitals.counter.tap')}</span>
            <span className={styles.tapSub}>
              {phase === 'running'
                ? t('vitals.counter.tapEach', { type: t(`vitals.type.${type}`) })
                : t('vitals.counter.tapIdle')}
            </span>
          </button>

          {/* Result + save */}
          {phase === 'done' && (
            <div className={styles.result}>
              <div className={styles.resultHead}>
                <span className={styles.resultValue}>
                  {liveBpm}
                  <span className={styles.resultUnit}>{t(`vitals.unit.${type}`)}</span>
                </span>
                <Badge variant="primary">{t(`vitals.type.${type}`)}</Badge>
              </div>
              <p className={styles.resultMeta}>
                {t('vitals.counter.resultMeta', { taps, seconds: duration })}
              </p>
              <Textarea
                label={t('vitals.counter.note')}
                rows={2}
                value={note}
                maxLength={200}
                placeholder={t('vitals.counter.notePlaceholder')}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          <div className={styles.actions}>
            {phase === 'idle' && (
              <Button type="button" variant="primary" size="lg" onClick={start}>
                {t('vitals.counter.start')}
              </Button>
            )}
            {phase === 'running' && (
              <Button type="button" variant="outline" size="lg" onClick={stop}>
                {t('vitals.counter.stop')}
              </Button>
            )}
            {phase === 'done' && (
              <>
                <Button type="button" variant="primary" size="lg" onClick={save}>
                  {t('vitals.counter.save')}
                </Button>
                <Button type="button" variant="ghost" size="lg" onClick={() => resetCounter()}>
                  {t('vitals.counter.reset')}
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Species guidance + caveat */}
      <Alert variant="info" title={t('vitals.guidance.title')}>
        <p className={styles.guidanceLine}>{t(guidanceKey)}</p>
        <p className={styles.guidanceCaveat}>{t('vitals.guidance.caveat')}</p>
        <p className={styles.guidanceVet}>{t('vitals.guidance.vet')}</p>
      </Alert>

      {/* History */}
      <Card padding="lg">
        <Card.Body>
          <div className={styles.historyHead}>
            <h2 className={styles.cardTitle}>{t('vitals.history.title')}</h2>
            {pets.length > 1 && (
              <label className={styles.showAllToggle}>
                <input
                  type="checkbox"
                  checked={showAllPets}
                  onChange={(e) => setShowAllPets(e.target.checked)}
                />
                {t('vitals.history.showAllPets')}
              </label>
            )}
          </div>

          <div className={styles.segmented} role="group" aria-label={t('vitals.history.typeLabel')}>
            {VITAL_TYPES.map((vt) => (
              <button
                key={vt}
                type="button"
                className={`${styles.segment} ${historyType === vt ? styles.segmentActive : ''}`}
                aria-pressed={historyType === vt}
                onClick={() => setHistoryType(vt)}
              >
                {t(`vitals.type.${vt}`)}
                <span className={styles.segmentCount}>
                  {vt === 'respiration' ? stats.respirationCount : stats.heartrateCount}
                </span>
              </button>
            ))}
          </div>

          {sparkPoints.length >= 3 && (
            <div className={styles.trend}>
              <Sparkline
                points={sparkPoints}
                ariaLabel={t('vitals.history.trendAria', {
                  type: t(`vitals.type.${historyType}`),
                  count: sparkPoints.length,
                })}
                formatValue={(v) => `${v} ${t(`vitals.unit.${historyType}`)}`}
              />
            </div>
          )}

          {historyList.length === 0 ? (
            <EmptyState
              variant="log"
              icon="🫁"
              title={t('vitals.history.emptyTitle')}
              description={t('vitals.history.emptyDesc')}
              hint={t('vitals.history.hint')}
              headingLevel={3}
            />
          ) : (
            <ul className={styles.list}>
              {historyList.map((r) => {
                const label = petLabel(r.petId)
                return (
                  <li key={r.id}>
                    <div className={styles.entry}>
                      <div className={styles.entryLeft}>
                        <span className={styles.entryBpm}>
                          {r.bpm}
                          <span className={styles.entryUnit}>{t(`vitals.unit.${r.type}`)}</span>
                        </span>
                        <span className={styles.entryDate}>{r.measuredAt}</span>
                        <Badge variant="default">
                          {t('vitals.counter.resultMeta', { taps: r.taps, seconds: r.durationSec })}
                        </Badge>
                        {showPetBadge && label && (
                          <Badge variant="default">
                            <span aria-hidden="true">{label.emoji}</span> {label.name}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeReading(r.id)}
                      >
                        {t('vitals.history.remove')}
                      </button>
                    </div>
                    {r.note && <p className={styles.entryNote}>{r.note}</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </Card.Body>
      </Card>
    </section>
  )
}

export default Vitals
