import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Sparkline, { type SparklinePoint } from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  detectBreaches,
  habitatFormSchema,
  habitatStats,
  recommendationFor,
  useHabitatStore,
  type HabitatFormValues,
} from '@features/habitat'
import { useOnboardingStore } from '@features/onboarding'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Habitat.module.css'

function nowLocalInputValue(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function Habitat() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('habitat.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const entries = useHabitatStore((s) => s.entries)
  const addEntry = useHabitatStore((s) => s.addEntry)
  const removeEntry = useHabitatStore((s) => s.removeEntry)

  const stats = useMemo(() => habitatStats(entries), [entries])
  const recommendation = useMemo(() => recommendationFor(profile.category), [profile.category])
  const breaches = useMemo(
    () => detectBreaches(stats.latest, recommendation),
    [stats.latest, recommendation]
  )

  const tempPoints: SparklinePoint[] = useMemo(
    () =>
      entries
        .filter((e) => e.temperatureC !== null)
        .map((e) => ({ x: new Date(e.measuredAt).getTime(), y: e.temperatureC as number })),
    [entries]
  )
  const humidityPoints: SparklinePoint[] = useMemo(
    () =>
      entries
        .filter((e) => e.humidityPct !== null)
        .map((e) => ({ x: new Date(e.measuredAt).getTime(), y: e.humidityPct as number })),
    [entries]
  )

  const form = useForm<HabitatFormValues>({
    resolver: zodResolver(habitatFormSchema),
    defaultValues: {
      measuredAt: nowLocalInputValue(),
      temperatureC: null,
      humidityPct: null,
      uvbHoursToday: null,
      note: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    addEntry({
      measuredAt: new Date(values.measuredAt).toISOString(),
      temperatureC: values.temperatureC ?? null,
      humidityPct: values.humidityPct ?? null,
      uvbHoursToday: values.uvbHoursToday ?? null,
      note: values.note,
    })
    toast(t('habitat.save'), 'success')
    form.reset({
      measuredAt: nowLocalInputValue(),
      temperatureC: null,
      humidityPct: null,
      uvbHoursToday: null,
      note: '',
    })
  })

  function numberSetter(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  return (
    <section className={styles.page}>
      <header className={styles.heroHeader}>
        <h1>{t('habitat.title')}</h1>
        <p className={styles.subtitle}>{t('habitat.subtitle')}</p>
      </header>

      {!profile.category && (
        <Card padding="lg" className={styles.gateCard}>
          <Card.Body>
            <h2 className={styles.gateTitle}>{t('habitat.noCategoryTitle')}</h2>
            <p className={styles.gateDesc}>{t('habitat.noCategoryDesc')}</p>
            <Link to="/onboarding" className={styles.gateCta}>
              {t('sos.startOnboarding')} →
            </Link>
          </Card.Body>
        </Card>
      )}

      {breaches.length > 0 && (
        <Card padding="md" className={styles.breachCard}>
          <Card.Body>
            <ul className={styles.breachList}>
              {breaches.map((b) => {
                const diff = Math.round(Math.abs(b.value - b.threshold) * 10) / 10
                const key = `habitat.breach.${b.kind === 'temperature' ? 'temp' : 'humidity'}${
                  b.direction === 'low' ? 'Low' : 'High'
                }`
                return (
                  <li key={`${b.kind}-${b.direction}`}>
                    <Badge variant="error">⚠</Badge>
                    <span>{t(key, { threshold: b.threshold, diff })}</span>
                  </li>
                )
              })}
            </ul>
          </Card.Body>
        </Card>
      )}

      <Card padding="lg" className={styles.formCard}>
        <Card.Body>
          <h2 className={styles.formTitle}>{t('habitat.quickAddTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.formGrid} noValidate>
            <Input
              type="datetime-local"
              label={t('habitat.measuredAt')}
              error={
                form.formState.errors.measuredAt?.message
                  ? t(form.formState.errors.measuredAt.message)
                  : undefined
              }
              {...form.register('measuredAt')}
            />
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              label={t('habitat.temperatureC')}
              error={
                form.formState.errors.temperatureC?.message
                  ? t(form.formState.errors.temperatureC.message)
                  : undefined
              }
              {...form.register('temperatureC', { setValueAs: numberSetter })}
            />
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              max="100"
              label={t('habitat.humidityPct')}
              error={
                form.formState.errors.humidityPct?.message
                  ? t(form.formState.errors.humidityPct.message)
                  : undefined
              }
              {...form.register('humidityPct', { setValueAs: numberSetter })}
            />
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="24"
              label={t('habitat.uvbHours')}
              helperText={
                recommendation && !recommendation.uvbRecommended
                  ? t('habitat.uvbNotRecommended')
                  : undefined
              }
              error={
                form.formState.errors.uvbHoursToday?.message
                  ? t(form.formState.errors.uvbHoursToday.message)
                  : undefined
              }
              {...form.register('uvbHoursToday', { setValueAs: numberSetter })}
            />
            <Textarea rows={2} label={t('habitat.note')} {...form.register('note')} />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {t('habitat.save')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <div className={styles.trendGrid}>
        <Card padding="lg" className={styles.trendCard}>
          <Card.Body>
            <header className={styles.trendHeader}>
              <h2 className={styles.trendTitle}>{t('habitat.tempTrendTitle')}</h2>
              {recommendation && (
                <p className={styles.recommendedRange}>
                  {t('habitat.recommendedRange')}: {recommendation.tempMin}–{recommendation.tempMax}
                  ℃
                </p>
              )}
            </header>
            {tempPoints.length === 0 ? (
              <EmptyState icon="🌡️" title={t('habitat.noTempData')} />
            ) : (
              <>
                <Sparkline
                  points={tempPoints}
                  ariaLabel={t('habitat.tempChartLabel')}
                  formatValue={(v) => `${v}℃`}
                />
                <dl className={styles.statsRow}>
                  <div>
                    <dt>{t('habitat.currentValue')}</dt>
                    <dd>{stats.latest?.temperatureC ?? '—'}℃</dd>
                  </div>
                  <div>
                    <dt>{t('habitat.avgValue')}</dt>
                    <dd>{stats.tempAvg ?? '—'}℃</dd>
                  </div>
                  <div>
                    <dt>{t('habitat.rangeValue')}</dt>
                    <dd>
                      {stats.tempMin}℃ / {stats.tempMax}℃
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </Card.Body>
        </Card>

        <Card padding="lg" className={styles.trendCard}>
          <Card.Body>
            <header className={styles.trendHeader}>
              <h2 className={styles.trendTitle}>{t('habitat.humidityTrendTitle')}</h2>
              {recommendation && (
                <p className={styles.recommendedRange}>
                  {t('habitat.recommendedRange')}: {recommendation.humidityMin}–
                  {recommendation.humidityMax}%
                </p>
              )}
            </header>
            {humidityPoints.length === 0 ? (
              <EmptyState icon="💧" title={t('habitat.noHumidityData')} />
            ) : (
              <>
                <Sparkline
                  points={humidityPoints}
                  ariaLabel={t('habitat.humidityChartLabel')}
                  formatValue={(v) => `${v}%`}
                />
                <dl className={styles.statsRow}>
                  <div>
                    <dt>{t('habitat.currentValue')}</dt>
                    <dd>{stats.latest?.humidityPct ?? '—'}%</dd>
                  </div>
                  <div>
                    <dt>{t('habitat.avgValue')}</dt>
                    <dd>{stats.humidityAvg ?? '—'}%</dd>
                  </div>
                  <div>
                    <dt>{t('habitat.rangeValue')}</dt>
                    <dd>
                      {stats.humidityMin}% / {stats.humidityMax}%
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </Card.Body>
        </Card>
      </div>

      <section aria-labelledby="recent-heading" className={styles.recentSection}>
        <h2 id="recent-heading" className={styles.trendTitle}>
          {t('habitat.recentTitle')}
        </h2>
        {entries.length === 0 ? (
          <EmptyState icon="📊" title={t('habitat.empty')} />
        ) : (
          <ul className={styles.recentList}>
            {[...entries]
              .reverse()
              .slice(0, 10)
              .map((e) => (
                <li key={e.id} className={styles.recentItem}>
                  <span className={styles.recentDate}>
                    {new Date(e.measuredAt).toLocaleString('ko', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className={styles.recentVal}>
                    {e.temperatureC !== null ? `${e.temperatureC}℃` : '—'}
                  </span>
                  <span className={styles.recentVal}>
                    {e.humidityPct !== null ? `${e.humidityPct}%` : '—'}
                  </span>
                  {e.uvbHoursToday !== null && (
                    <span className={styles.recentMeta}>UVB {e.uvbHoursToday}h</span>
                  )}
                  <span className={styles.recentNote}>{e.note ?? ''}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeEntry(e.id)}
                  >
                    {t('habitat.remove')}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Habitat
