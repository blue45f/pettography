import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Input from '@components/common/Input'
import PetBadge from '@components/common/PetBadge'
import Select from '@components/common/Select'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import {
  BUILTIN_ROUTINES,
  isDoneWithinWindow,
  ROUTINE_CADENCES,
  routineFormSchema,
  useActivePetCustomTasks,
  useRoutineStore,
  type RoutineCadence,
  type RoutineFormValues,
  type RoutineTask,
} from '@domains/routine'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Routine.module.css'

function Routine() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('routine.title'))

  const category = useOnboardingStore((s) => s.profile.category)
  const customTasks = useActivePetCustomTasks()
  const completions = useRoutineStore((s) => s.completions)
  const addTask = useRoutineStore((s) => s.addTask)
  const removeTask = useRoutineStore((s) => s.removeTask)
  const markDone = useRoutineStore((s) => s.markDone)
  const unmark = useRoutineStore((s) => s.unmark)

  const builtIn = useMemo(() => (category ? (BUILTIN_ROUTINES[category] ?? []) : []), [category])
  const allTasks = useMemo<RoutineTask[]>(
    () => [...builtIn, ...customTasks],
    [builtIn, customTasks],
  )

  const grouped = useMemo(() => {
    const map: Record<RoutineCadence, RoutineTask[]> = { daily: [], weekly: [], monthly: [] }
    for (const task of allTasks) map[task.cadence].push(task)
    return map
  }, [allTasks])

  const progress = useMemo(() => {
    const total = allTasks.length
    if (total === 0) return { done: 0, total: 0, percent: 0 }
    const done = allTasks.filter((t) => isDoneWithinWindow(completions[t.id], t.cadence)).length
    return { done, total, percent: Math.round((done / total) * 100) }
  }, [allTasks, completions])

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: { label: '', cadence: 'daily' },
  })

  const onAdd = form.handleSubmit((values) => {
    addTask(values)
    toast(t('routine.addedToast'), 'success')
    form.reset({ label: '', cadence: values.cadence })
  })

  function handleToggle(task: RoutineTask) {
    if (isDoneWithinWindow(completions[task.id], task.cadence)) {
      unmark(task.id)
    } else {
      markDone(task.id)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('routine.title')}</h1>
        <p className={styles.subtitle}>{t('routine.subtitle')}</p>
      </header>

      <div className={styles.summary}>
        <div>
          <p className={styles.summaryLabel}>{t('routine.progressLabel')}</p>
          <p className={styles.summaryValue}>
            {progress.done} / {progress.total}
            {progress.total > 0 && (
              <span className={styles.summaryPercent}> · {progress.percent}%</span>
            )}
          </p>
        </div>
        {!category && <p className={styles.gateNote}>{t('routine.noCategory')}</p>}
      </div>

      {ROUTINE_CADENCES.map((cad) => (
        <section key={cad} aria-labelledby={`cad-${cad}-heading`} className={styles.section}>
          <h2 id={`cad-${cad}-heading`} className={styles.sectionTitle}>
            {t(`routine.cadence.${cad}`)}{' '}
            <span className={styles.sectionCount}>({grouped[cad].length})</span>
          </h2>
          {grouped[cad].length === 0 ? (
            <p className={styles.emptyHint}>{t('routine.empty')}</p>
          ) : (
            <ul className={styles.taskList}>
              {grouped[cad].map((task) => {
                const done = isDoneWithinWindow(completions[task.id], task.cadence)
                return (
                  <li
                    key={task.id}
                    className={[styles.task, done ? styles.taskDone : ''].join(' ')}
                  >
                    <label className={styles.taskCheck}>
                      <input type="checkbox" checked={done} onChange={() => handleToggle(task)} />
                      <span className={styles.taskLabel}>{task.label}</span>
                    </label>
                    <div className={styles.taskMeta}>
                      {task.builtIn ? (
                        <Badge variant="default">{t('routine.builtIn')}</Badge>
                      ) : (
                        <>
                          <PetBadge petId={task.petId} hideWhenActive />
                          <button
                            type="button"
                            className={styles.taskRemove}
                            onClick={() => removeTask(task.id)}
                            aria-label={t('routine.remove')}
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}

      <section aria-labelledby="add-heading" className={styles.section}>
        <h2 id="add-heading" className={styles.sectionTitle}>
          {t('routine.addTitle')}
        </h2>
        <form className={styles.addForm} onSubmit={onAdd} noValidate>
          <Input
            label={t('routine.fields.label')}
            placeholder={t('routine.placeholders.label')}
            error={
              form.formState.errors.label?.message
                ? t(form.formState.errors.label.message)
                : undefined
            }
            {...form.register('label')}
          />
          <Select
            label={t('routine.fields.cadence')}
            options={ROUTINE_CADENCES.map((c) => ({
              value: c,
              label: t(`routine.cadence.${c}`),
            }))}
            {...form.register('cadence')}
          />
          <div className={styles.addFormActions}>
            <Button type="submit" variant="primary">
              {t('routine.add')}
            </Button>
          </div>
        </form>
      </section>
    </section>
  )
}

export default Routine
