import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import { useToast } from '@components/common/Toast'
import {
  SUPPLY_KINDS,
  supplyFormSchema,
  supplyStatus,
  useSuppliesStore,
  type SupplyFormValues,
} from '@features/supplies'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Supplies.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
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

  const items = useSuppliesStore((s) => s.items)
  const addItem = useSuppliesStore((s) => s.addItem)
  const restock = useSuppliesStore((s) => s.restock)
  const removeItem = useSuppliesStore((s) => s.removeItem)

  const [restockDrafts, setRestockDrafts] = useState<Record<string, string>>({})

  const form = useForm<SupplyFormValues>({
    resolver: zodResolver(supplyFormSchema),
    defaultValues: {
      name: '',
      kind: 'live-food',
      unit: '마리',
      lastRestockedAt: todayIso(),
      lastQuantity: 0,
      weeklyConsumption: 0,
      preferredVendor: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    addItem(values)
    toast(t('supplies.save'), 'success')
    form.reset({
      name: '',
      kind: values.kind,
      unit: values.unit,
      lastRestockedAt: todayIso(),
      lastQuantity: 0,
      weeklyConsumption: 0,
      preferredVendor: values.preferredVendor,
    })
  })

  function numberSetter(value: unknown): number {
    if (value === '' || value === null || value === undefined) return 0
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  return (
    <section className={styles.page}>
      <header className={styles.heroHeader}>
        <h1>{t('supplies.title')}</h1>
        <p className={styles.subtitle}>{t('supplies.subtitle')}</p>
      </header>

      {items.length === 0 ? (
        <EmptyState icon="🦗" title={t('supplies.empty')} />
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

                <form
                  className={styles.restockForm}
                  onSubmit={(e) => {
                    e.preventDefault()
                    const raw = restockDrafts[item.id] ?? ''
                    const qty = Number(raw)
                    if (!raw || !Number.isFinite(qty) || qty <= 0) return
                    restock(item.id, todayIso(), Math.round(qty))
                    toast(t('supplies.restockShort'), 'success')
                    setRestockDrafts((d) => ({ ...d, [item.id]: '' }))
                  }}
                >
                  <label className={styles.restockLabel}>
                    <span>{t('supplies.addRestock')}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      className={styles.restockInput}
                      value={restockDrafts[item.id] ?? ''}
                      onChange={(e) =>
                        setRestockDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                      }
                    />
                  </label>
                  <Button type="submit" variant="outline" size="sm">
                    {t('supplies.restockShort')}
                  </Button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                  >
                    {t('supplies.remove')}
                  </button>
                </form>
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
              options={SUPPLY_KINDS.map((k) => ({
                value: k,
                label: t(`supplies.kinds.${k}`),
              }))}
              {...form.register('kind')}
            />
            <Input
              label={t('supplies.unit')}
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
              step="0.5"
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
              placeholder={t('supplies.preferredVendorPlaceholder')}
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
