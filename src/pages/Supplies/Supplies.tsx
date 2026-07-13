import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import {
  SUPPLY_KINDS,
  supplyFormSchema,
  supplyStatus,
  useActivePetSupplies,
  useSuppliesStore,
  type SupplyFormValues,
} from '@domains/supplies'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Supplies.module.css'

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

const LEVEL_VARIANT = {
  ok: 'success',
  warning: 'warning',
  critical: 'error',
  depleted: 'error',
} as const

function Supplies() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('supplies.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const items = useActivePetSupplies()
  const addItem = useSuppliesStore((state) => state.addItem)
  const restock = useSuppliesStore((state) => state.restock)
  const removeItem = useSuppliesStore((state) => state.removeItem)
  const [restockDrafts, setRestockDrafts] = useState<Record<string, string>>({})
  const today = localTodayIso()

  const form = useForm<SupplyFormValues>({
    resolver: zodResolver(supplyFormSchema),
    defaultValues: {
      name: '',
      kind: 'live-food',
      unit: '',
      lastRestockedAt: today,
      lastQuantity: 0,
      weeklyConsumption: 0,
      preferredVendor: '',
    },
  })

  function numberSetter(value: unknown): number {
    if (value === '' || value === null || value === undefined) return 0
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const onSubmit = form.handleSubmit((values) => {
    if (!activePetId) return
    addItem({ ...values, petId: activePetId })
    toast(t('supplies.save'), 'success')
    form.reset({
      name: '',
      kind: values.kind,
      unit: values.unit,
      lastRestockedAt: today,
      lastQuantity: 0,
      weeklyConsumption: 0,
      preferredVendor: values.preferredVendor,
    })
  })

  function handleRestock(id: string) {
    const raw = restockDrafts[id] ?? ''
    const quantity = Number(raw)
    if (!raw || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
      toast(t('supplies.errors.restockRange'), 'error')
      return
    }
    restock(id, today, Math.round(quantity))
    toast(t('supplies.restockShort'), 'success')
    setRestockDrafts((drafts) => ({ ...drafts, [id]: '' }))
  }

  function handleRemove(id: string, name: string) {
    if (!window.confirm(t('supplies.removeConfirm', { name }))) return
    removeItem(id)
    toast(t('supplies.removed'), 'info')
  }

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.heroHeader}>
          <p className={styles.eyebrow}>{t('supplies.eyebrow')}</p>
          <h1>{t('supplies.title')}</h1>
          <p className={styles.subtitle}>{t('supplies.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              📦
            </span>
            <h2>{t('supplies.petRequiredTitle')}</h2>
            <p>{t('supplies.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('supplies.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.heroHeader}>
        <p className={styles.eyebrow}>{t('supplies.eyebrow')}</p>
        <h1>{t('supplies.title')}</h1>
        <p className={styles.subtitle}>{t('supplies.subtitle')}</p>
        <span className={styles.petPill}>
          <span aria-hidden="true">{species?.heroEmoji ?? '🐾'}</span>
          {profile.petName?.trim() || species?.koreanName || t('supplies.aPet')}
        </span>
      </header>

      <p className={styles.estimateNote}>{t('supplies.estimateNote')}</p>

      {items.length === 0 ? (
        <EmptyState icon="📦" title={t('supplies.empty')} />
      ) : (
        <ul className={styles.itemList}>
          {items.map((item) => {
            const status = supplyStatus(item)
            return (
              <li key={item.id} className={styles.itemCard}>
                <header className={styles.itemHeader}>
                  <div>
                    <h2 className={styles.itemTitle}>{item.name}</h2>
                    <p className={styles.itemMeta}>
                      {t(`supplies.kinds.${item.kind}`)} ·{' '}
                      {t('supplies.weekly', { count: item.weeklyConsumption })} {item.unit}
                      {item.preferredVendor && ` · ${item.preferredVendor}`}
                    </p>
                  </div>
                  <Badge variant={LEVEL_VARIANT[status.level]}>
                    {t(`supplies.level.${status.level}`)}
                  </Badge>
                </header>
                <dl className={styles.statsRow}>
                  <div>
                    <dt>{t('supplies.remaining')}</dt>
                    <dd>
                      {status.remaining} {item.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('supplies.lastRestocked')}</dt>
                    <dd>{item.lastRestockedAt}</dd>
                  </div>
                  <div>
                    <dt>
                      {status.level === 'depleted'
                        ? t('supplies.depleted')
                        : t('supplies.daysLeft', { count: status.daysLeft })}
                    </dt>
                    <dd>
                      <div className={styles.gauge} aria-hidden="true">
                        <span
                          className={`${styles.gaugeFill} ${styles[`gauge-${status.level}`]}`}
                          style={{
                            width: `${Math.min(100, (status.daysLeft / 14) * 100).toFixed(1)}%`,
                          }}
                        />
                      </div>
                    </dd>
                  </div>
                </dl>
                <div className={styles.restockForm}>
                  <label className={styles.restockLabel}>
                    <span>{t('supplies.addRestock')}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="1000000"
                      step="1"
                      className={styles.restockInput}
                      value={restockDrafts[item.id] ?? ''}
                      onChange={(event) =>
                        setRestockDrafts((drafts) => ({ ...drafts, [item.id]: event.target.value }))
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestock(item.id)}
                  >
                    {t('supplies.restockShort')}
                  </Button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemove(item.id, item.name)}
                  >
                    {t('supplies.remove')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Card padding="lg" className={styles.formCard}>
        <Card.Body>
          <h2 className={styles.formTitle}>{t('supplies.addTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.formGrid} noValidate>
            <Input
              label={t('supplies.name')}
              maxLength={60}
              placeholder={t('supplies.namePlaceholder')}
              error={
                form.formState.errors.name?.message
                  ? t(form.formState.errors.name.message)
                  : undefined
              }
              {...form.register('name')}
            />
            <Select
              label={t('supplies.kind')}
              options={SUPPLY_KINDS.map((kind) => ({
                value: kind,
                label: t(`supplies.kinds.${kind}`),
              }))}
              {...form.register('kind')}
            />
            <Input
              label={t('supplies.unit')}
              maxLength={20}
              placeholder={t('supplies.unitPlaceholder')}
              error={
                form.formState.errors.unit?.message
                  ? t(form.formState.errors.unit.message)
                  : undefined
              }
              {...form.register('unit')}
            />
            <Input
              type="date"
              max={today}
              label={t('supplies.lastRestockedAt')}
              error={
                form.formState.errors.lastRestockedAt?.message
                  ? t(form.formState.errors.lastRestockedAt.message)
                  : undefined
              }
              {...form.register('lastRestockedAt')}
            />
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="1000000"
              step="1"
              label={t('supplies.lastQuantity')}
              error={
                form.formState.errors.lastQuantity?.message
                  ? t(form.formState.errors.lastQuantity.message)
                  : undefined
              }
              {...form.register('lastQuantity', { setValueAs: numberSetter })}
            />
            <Input
              type="number"
              inputMode="decimal"
              min="0.1"
              max="1000000"
              step="0.1"
              label={t('supplies.weeklyConsumption')}
              error={
                form.formState.errors.weeklyConsumption?.message
                  ? t(form.formState.errors.weeklyConsumption.message)
                  : undefined
              }
              {...form.register('weeklyConsumption', { setValueAs: numberSetter })}
            />
            <Input
              label={t('supplies.preferredVendor')}
              maxLength={60}
              autoComplete="off"
              placeholder={t('supplies.preferredVendorPlaceholder')}
              error={
                form.formState.errors.preferredVendor?.message
                  ? t(form.formState.errors.preferredVendor.message)
                  : undefined
              }
              {...form.register('preferredVendor')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {t('supplies.save')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </section>
  )
}

export default Supplies
