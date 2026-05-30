import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  GEAR_TYPE_IDS,
  daysUntilDue,
  dueDate,
  gearPreset,
  gearFormSchema,
  gearStatus,
  lifePct,
  sortByUrgency,
  useActivePetGear,
  useGearStore,
  type GearFormValues,
  type GearStatus,
  type GearItem,
} from '@features/gear'
import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useToday } from '@hooks/useToday'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Gear.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_BADGE: Record<GearStatus, 'default' | 'success' | 'warning' | 'error'> = {
  overdue: 'error',
  soon: 'warning',
  ok: 'success',
  monitor: 'default',
}

const STATUS_PROGRESS: Record<GearStatus, 'primary' | 'success' | 'warning' | 'error'> = {
  overdue: 'error',
  soon: 'warning',
  ok: 'success',
  monitor: 'primary',
}

function Gear() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('gear.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})
  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId),
    [speciesList, profile.speciesId],
  )

  const items = useActivePetGear()
  const addItem = useGearStore((s) => s.addItem)
  const markReplaced = useGearStore((s) => s.markReplaced)
  const removeItem = useGearStore((s) => s.removeItem)

  const today = useToday()
  const sorted = useMemo(() => sortByUrgency(items, today), [items, today])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GearFormValues>({
    resolver: zodResolver(gearFormSchema),
    defaultValues: {
      typeId: 'uvbBulb',
      name: '',
      installedAt: today,
      intervalMonths: gearPreset('uvbBulb').defaultIntervalMonths,
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addItem({
      typeId: values.typeId,
      name: values.name,
      installedAt: values.installedAt,
      intervalMonths: values.intervalMonths,
      notes: values.notes?.trim() || '',
    })
    toast(t('gear.added'), 'success')
    reset({
      typeId: values.typeId,
      name: '',
      installedAt: todayIso(),
      intervalMonths: gearPreset(values.typeId).defaultIntervalMonths,
      notes: '',
    })
  })

  function dDayLabel(item: GearItem): string {
    const days = daysUntilDue(item, today)
    if (days === null) return t('gear.dday.monitor')
    if (days === 0) return t('gear.dday.today')
    if (days < 0) return t('gear.dday.overdue', { count: Math.abs(days) })
    return t('gear.dday.remaining', { count: days })
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('gear.title')}</h1>
        <p className={styles.subtitle}>{t('gear.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            {activeSpecies.heroEmoji} {activeSpecies.koreanName}
          </p>
        )}
      </header>

      <Alert variant="warning" title={t('gear.uvbAlertTitle')}>
        {t('gear.uvbAlertBody')}
      </Alert>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('gear.newItem')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('gear.type')}
                options={GEAR_TYPE_IDS.map((id) => ({
                  value: id,
                  label: t(`gear.types.${id}`),
                }))}
                {...register('typeId', {
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const preset = gearPreset(e.target.value as GearFormValues['typeId'])
                    setValue('intervalMonths', preset.defaultIntervalMonths, {
                      shouldValidate: true,
                    })
                  },
                })}
              />
              <Input
                label={t('gear.name')}
                placeholder={t('gear.namePlaceholder')}
                error={errors.name?.message ? t(errors.name.message) : undefined}
                {...register('name')}
              />
            </div>
            <div className={styles.formRow}>
              <Input
                type="date"
                label={t('gear.installedAt')}
                error={errors.installedAt?.message ? t(errors.installedAt.message) : undefined}
                {...register('installedAt')}
              />
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                label={t('gear.intervalMonths')}
                helperText={t('gear.intervalHelper')}
                error={
                  errors.intervalMonths?.message ? t(errors.intervalMonths.message) : undefined
                }
                {...register('intervalMonths', { valueAsNumber: true })}
              />
            </div>
            <Textarea
              label={t('gear.notes')}
              rows={2}
              placeholder={t('gear.notesPlaceholder')}
              error={errors.notes?.message ? t(errors.notes.message) : undefined}
              {...register('notes')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('gear.addItem')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState icon="🔧" title={t('gear.emptyTitle')} description={t('gear.emptyDesc')} />
      ) : (
        <ul className={styles.grid}>
          {sorted.map((item) => {
            const status = gearStatus(item, today)
            const due = dueDate(item)
            const pct = lifePct(item, today)
            return (
              <li key={item.id}>
                <Card padding="md" className={styles.gearCard}>
                  <Card.Body>
                    <div className={styles.cardTop}>
                      <Badge variant="primary">{t(`gear.types.${item.typeId}`)}</Badge>
                      <Badge variant={STATUS_BADGE[status]}>{dDayLabel(item)}</Badge>
                    </div>
                    <h3 className={styles.gearName}>{item.name}</h3>
                    <dl className={styles.meta}>
                      <div>
                        <dt>{t('gear.installedAt')}</dt>
                        <dd>{item.installedAt}</dd>
                      </div>
                      <div>
                        <dt>{t('gear.dueDate')}</dt>
                        <dd>{due ?? t('gear.noSchedule')}</dd>
                      </div>
                    </dl>
                    {pct !== null && (
                      <Progress
                        value={pct}
                        variant={STATUS_PROGRESS[status]}
                        size="sm"
                        showLabel
                        label={t('gear.lifeUsed', { pct: Math.round(pct) })}
                      />
                    )}
                    {item.notes && <p className={styles.gearNotes}>{item.notes}</p>}
                    <div className={styles.cardActions}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          markReplaced(item.id, todayIso())
                          toast(t('gear.replacedToast'), 'success')
                        }}
                      >
                        {t('gear.markReplaced')}
                      </Button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem(item.id)}
                      >
                        {t('gear.remove')}
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default Gear
