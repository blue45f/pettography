import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  ancestors,
  lineageFormSchema,
  offspringOf,
  pedigree,
  SEXES,
  useLineageStore,
  type LineageAnimal,
  type LineageFormValues,
  type PedigreeNode,
  type Sex,
} from '@features/lineage'
import { useSpeciesList, type Species } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Lineage.module.css'

/** How many generations the pedigree expands: self + parents + grandparents. */
const PEDIGREE_DEPTH = 2

const SEX_BADGE: Record<Sex, 'primary' | 'error' | 'default'> = {
  male: 'primary',
  female: 'error',
  unknown: 'default',
}

const SEX_SYMBOL: Record<Sex, string> = {
  male: '♂',
  female: '♀',
  unknown: '?',
}

function Lineage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('lineage.title'))

  const animals = useLineageStore((s) => s.animals)
  const addAnimal = useLineageStore((s) => s.addAnimal)
  const removeAnimal = useLineageStore((s) => s.removeAnimal)

  const { data: speciesList = [] } = useSpeciesList({})

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Lookups ───────────────────────────────────────────────────
  const speciesById = useMemo(() => {
    const map = new Map<string, Species>()
    for (const sp of speciesList) map.set(sp.id, sp)
    return map
  }, [speciesList])

  function speciesLabel(speciesId: string | null): { name: string; emoji: string } {
    const sp = speciesId ? speciesById.get(speciesId) : undefined
    return { name: sp?.koreanName ?? t('lineage.speciesUnspecified'), emoji: sp?.heroEmoji ?? '🧬' }
  }

  // The currently selected animal still exists? (it may have been removed)
  const selected = useMemo(
    () => (selectedId ? (animals.find((a) => a.id === selectedId) ?? null) : null),
    [animals, selectedId]
  )

  const tree = useMemo(
    () => (selected ? pedigree(selected.id, animals, PEDIGREE_DEPTH) : null),
    [animals, selected]
  )

  const offspring = useMemo(
    () => (selected ? offspringOf(selected.id, animals) : []),
    [animals, selected]
  )

  const ancestorCountById = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of animals) map.set(a.id, ancestors(a.id, animals, PEDIGREE_DEPTH).length)
    return map
  }, [animals])

  // ── Form ──────────────────────────────────────────────────────
  const defaults: LineageFormValues = {
    name: '',
    speciesId: '',
    sex: 'unknown',
    morph: '',
    sireId: '',
    damId: '',
    notes: '',
  }

  const form = useForm<LineageFormValues>({
    resolver: zodResolver(lineageFormSchema),
    defaultValues: defaults,
  })

  const onSubmit = form.handleSubmit((values) => {
    const created = addAnimal({
      name: values.name.trim(),
      speciesId: values.speciesId || null,
      sex: values.sex,
      morph: values.morph.trim(),
      sireId: values.sireId || null,
      damId: values.damId || null,
      notes: values.notes.trim(),
    })
    toast(t('lineage.toast.added', { name: created.name }), 'success')
    form.reset(defaults)
    setSelectedId(created.id)
  })

  function handleRemove(animal: LineageAnimal) {
    removeAnimal(animal.id)
    if (selectedId === animal.id) setSelectedId(null)
    toast(t('lineage.toast.removed', { name: animal.name }), 'info')
  }

  // ── Select options ────────────────────────────────────────────
  const speciesOptions = [
    { value: '', label: t('lineage.form.speciesNone') },
    ...speciesList.map((sp) => ({ value: sp.id, label: `${sp.heroEmoji} ${sp.koreanName}` })),
  ]

  const sexOptions = SEXES.map((s) => ({ value: s, label: t(`lineage.sex.${s}`) }))

  // Parent options exclude nothing on the add form (a new animal can't be its
  // own parent because it doesn't exist yet); the "unknown" option is first.
  const parentOptions = [
    { value: '', label: t('lineage.form.parentUnknown') },
    ...animals.map((a) => ({ value: a.id, label: parentOptionLabel(a) })),
  ]

  function parentOptionLabel(a: LineageAnimal): string {
    const symbol = SEX_SYMBOL[a.sex]
    const morph = a.morph.trim() ? ` · ${a.morph.trim()}` : ''
    return `${symbol} ${a.name}${morph}`
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('lineage.title')}</h1>
        <p className={styles.subtitle}>{t('lineage.subtitle')}</p>
      </header>

      {/* ── Add form ─────────────────────────────────────────── */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('lineage.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                label={t('lineage.form.name')}
                placeholder={t('lineage.form.namePlaceholder')}
                error={
                  form.formState.errors.name?.message
                    ? t(form.formState.errors.name.message)
                    : undefined
                }
                {...form.register('name')}
              />
              <Select
                label={t('lineage.form.species')}
                options={speciesOptions}
                {...form.register('speciesId')}
              />
              <Select
                label={t('lineage.form.sex')}
                options={sexOptions}
                {...form.register('sex')}
              />
            </div>

            <div className={styles.formRow}>
              <Input
                label={t('lineage.form.morph')}
                placeholder={t('lineage.form.morphPlaceholder')}
                helperText={t('lineage.form.optional')}
                error={
                  form.formState.errors.morph?.message
                    ? t(form.formState.errors.morph.message)
                    : undefined
                }
                {...form.register('morph')}
              />
              <Select
                label={t('lineage.form.sire')}
                helperText={t('lineage.form.sireHelper')}
                options={parentOptions}
                {...form.register('sireId')}
              />
              <Select
                label={t('lineage.form.dam')}
                helperText={t('lineage.form.damHelper')}
                options={parentOptions}
                {...form.register('damId')}
              />
            </div>

            <Textarea
              label={t('lineage.form.notes')}
              rows={2}
              helperText={t('lineage.form.notesHelper')}
              error={
                form.formState.errors.notes?.message
                  ? t(form.formState.errors.notes.message)
                  : undefined
              }
              {...form.register('notes')}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={form.formState.isSubmitting}>
                {t('lineage.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* ── Roster ───────────────────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('lineage.roster.title')}</h2>
        <p className={styles.sectionIntro}>{t('lineage.roster.intro')}</p>

        {animals.length === 0 ? (
          <EmptyState
            icon="🧬"
            title={t('lineage.roster.emptyTitle')}
            description={t('lineage.roster.emptyDesc')}
            headingLevel={3}
          />
        ) : (
          <ul className={styles.roster}>
            {animals.map((animal) => {
              const sp = speciesLabel(animal.speciesId)
              const isSelected = animal.id === selectedId
              const ancestorCount = ancestorCountById.get(animal.id) ?? 0
              return (
                <li key={animal.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.rosterRow}>
                        <button
                          type="button"
                          className={[styles.rosterMain, isSelected ? styles.rosterMainActive : '']
                            .filter(Boolean)
                            .join(' ')}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedId(isSelected ? null : animal.id)}
                        >
                          <span className={styles.rosterEmoji} aria-hidden="true">
                            {sp.emoji}
                          </span>
                          <span className={styles.rosterText}>
                            <span className={styles.rosterName}>{animal.name}</span>
                            <span className={styles.rosterMeta}>
                              <Badge variant={SEX_BADGE[animal.sex]}>
                                <span aria-hidden="true">{SEX_SYMBOL[animal.sex]}</span>{' '}
                                {t(`lineage.sex.${animal.sex}`)}
                              </Badge>
                              <span className={styles.rosterSpecies}>{sp.name}</span>
                              {animal.morph.trim() && (
                                <span className={styles.rosterMorph}>{animal.morph}</span>
                              )}
                            </span>
                          </span>
                          <span className={styles.rosterAncestors}>
                            {t('lineage.roster.ancestorCount', { count: ancestorCount })}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemove(animal)}
                        >
                          {t('lineage.remove')}
                        </button>
                      </div>
                    </Card.Body>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Pedigree + offspring for the selected animal ─────── */}
      {selected && tree && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t('lineage.pedigree.title', { name: selected.name })}
          </h2>
          <p className={styles.sectionIntro}>{t('lineage.pedigree.intro')}</p>

          <Card padding="lg">
            <Card.Body>
              <PedigreeTree node={tree} speciesLabel={speciesLabel} />
            </Card.Body>
          </Card>

          <h3 className={styles.subTitle}>
            {t('lineage.offspring.title', { count: offspring.length })}
          </h3>
          {offspring.length === 0 ? (
            <p className={styles.offspringEmpty}>{t('lineage.offspring.empty')}</p>
          ) : (
            <ul className={styles.offspringList}>
              {offspring.map((child) => {
                const sp = speciesLabel(child.speciesId)
                return (
                  <li key={child.id}>
                    <button
                      type="button"
                      className={styles.offspringChip}
                      onClick={() => setSelectedId(child.id)}
                    >
                      <span aria-hidden="true">{SEX_SYMBOL[child.sex]}</span>
                      <span aria-hidden="true">{sp.emoji}</span>
                      <span>{child.name}</span>
                      {child.morph.trim() && (
                        <span className={styles.offspringMorph}>{child.morph}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

interface PedigreeTreeProps {
  node: PedigreeNode
  speciesLabel: (speciesId: string | null) => { name: string; emoji: string }
}

/**
 * Three-column pedigree: the subject on the left, parents in the middle,
 * grandparents on the right. Each generation is a flex column so the boxes
 * line up vertically; connector lines are drawn with CSS borders on the cells.
 */
function PedigreeTree({ node, speciesLabel }: PedigreeTreeProps) {
  const { t } = useTranslation()

  // Flatten each generation into ordered slots so columns align (4 grandparent
  // slots, 2 parent slots, 1 self slot), with `null` for unknown branches.
  const sire = node.sire
  const dam = node.dam
  const grandparents: (PedigreeNode | null)[] = [
    sire?.sire ?? null,
    sire?.dam ?? null,
    dam?.sire ?? null,
    dam?.dam ?? null,
  ]

  return (
    <div
      className={styles.tree}
      role="img"
      aria-label={t('lineage.pedigree.ariaLabel', { name: node.animal.name })}
    >
      <div className={styles.treeColumn}>
        <span className={styles.genLabel}>{t('lineage.pedigree.genSelf')}</span>
        <div className={styles.selfSlot}>
          <PedigreeBox node={node} speciesLabel={speciesLabel} highlight />
        </div>
      </div>

      <div className={styles.treeColumn}>
        <span className={styles.genLabel}>{t('lineage.pedigree.genParents')}</span>
        <div className={styles.parentSlot}>
          <NodeOrPlaceholder
            node={sire}
            speciesLabel={speciesLabel}
            relationLabel={t('lineage.relation.sire')}
          />
        </div>
        <div className={styles.parentSlot}>
          <NodeOrPlaceholder
            node={dam}
            speciesLabel={speciesLabel}
            relationLabel={t('lineage.relation.dam')}
          />
        </div>
      </div>

      <div className={styles.treeColumn}>
        <span className={styles.genLabel}>{t('lineage.pedigree.genGrandparents')}</span>
        {grandparents.map((gp, i) => (
          <div className={styles.grandSlot} key={i}>
            <NodeOrPlaceholder node={gp} speciesLabel={speciesLabel} />
          </div>
        ))}
      </div>
    </div>
  )
}

interface NodeOrPlaceholderProps {
  node: PedigreeNode | null
  speciesLabel: (speciesId: string | null) => { name: string; emoji: string }
  relationLabel?: string
}

function NodeOrPlaceholder({ node, speciesLabel, relationLabel }: NodeOrPlaceholderProps) {
  const { t } = useTranslation()
  if (!node) {
    return (
      <div className={styles.placeholder}>
        {relationLabel ? <span className={styles.placeholderRelation}>{relationLabel}</span> : null}
        <span className={styles.placeholderText}>{t('lineage.pedigree.unknown')}</span>
      </div>
    )
  }
  return <PedigreeBox node={node} speciesLabel={speciesLabel} relationLabel={relationLabel} />
}

interface PedigreeBoxProps {
  node: PedigreeNode
  speciesLabel: (speciesId: string | null) => { name: string; emoji: string }
  relationLabel?: string
  highlight?: boolean
}

function PedigreeBox({ node, speciesLabel, relationLabel, highlight = false }: PedigreeBoxProps) {
  const { t } = useTranslation()
  const { animal } = node
  const sp = speciesLabel(animal.speciesId)
  return (
    <div className={[styles.box, highlight ? styles.boxSelf : ''].filter(Boolean).join(' ')}>
      {relationLabel ? <span className={styles.boxRelation}>{relationLabel}</span> : null}
      <span className={styles.boxName}>
        <span className={styles.boxSex} aria-hidden="true">
          {SEX_SYMBOL[animal.sex]}
        </span>
        {animal.name}
      </span>
      <span className={styles.boxSpecies}>
        <span aria-hidden="true">{sp.emoji}</span> {sp.name}
      </span>
      {animal.morph.trim() ? (
        <span className={styles.boxMorph}>{animal.morph}</span>
      ) : (
        <span className={styles.boxMorphMuted}>{t('lineage.pedigree.noMorph')}</span>
      )}
    </div>
  )
}

export default Lineage
