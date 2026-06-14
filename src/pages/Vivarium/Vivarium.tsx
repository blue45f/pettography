import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import PetBadge, { ShowAllPetsToggle } from '@components/common/PetBadge'
import Progress from '@components/common/Progress'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import {
  CLEANUP_CREW,
  PLANTS,
  SUBSTRATE_LAYERS,
  crewById,
  maintenanceScore,
  orderedLayers,
  plantById,
  readinessChecklist,
  substrateById,
  templateForSpecies,
  useActivePetBuilds,
  useVivariumStore,
  type ChecklistId,
  type MaintenanceFactor,
  type MaintenanceLevel,
  type SubstrateRole,
  type VivariumBuild,
} from '@domains/vivarium'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Vivarium.module.css'

const LEVEL_VARIANT: Record<MaintenanceLevel, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

/** Earthy band colors keyed by substrate role, for the cross-section diagram. */
const ROLE_BAND: Record<SubstrateRole, { bg: string; fg: string }> = {
  drainage: { bg: '#9aa7b2', fg: '#1f2933' },
  barrier: { bg: '#cbd5e1', fg: '#1f2933' },
  substrate: { bg: '#6b4f3a', fg: '#fdf6ee' },
  topper: { bg: '#5a7a3f', fg: '#f4faf0' },
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function Vivarium() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('vivarium.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId]
  )
  const template = useMemo(
    () => templateForSpecies(activeSpecies?.slug, profile.category),
    [activeSpecies?.slug, profile.category]
  )
  const isAquatic = template?.aquatic === true

  const builds = useActivePetBuilds()
  const allBuilds = useVivariumStore((s) => s.builds)
  const [showAllPets, setShowAllPets] = useState(false)
  const buildList = showAllPets ? allBuilds : builds
  const saveBuild = useVivariumStore((s) => s.saveBuild)
  const removeBuild = useVivariumStore((s) => s.removeBuild)

  // Composer selections.
  const [substrateIds, setSubstrateIds] = useState<string[]>([])
  const [crewIds, setCrewIds] = useState<string[]>([])
  const [plantIds, setPlantIds] = useState<string[]>([])
  const [tempHot, setTempHot] = useState('')
  const [tempCool, setTempCool] = useState('')
  const [humidity, setHumidity] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  function applyTemplate() {
    if (!template) return
    setSubstrateIds(template.recommendedSubstrateIds)
    setCrewIds(template.recommendedCrewIds)
    setPlantIds(template.recommendedPlantIds)
    setTempHot(String(template.tempHotC))
    setTempCool(String(template.tempCoolC))
    setHumidity(String(template.humidityPct))
    toast(t('vivarium.templateApplied'), 'success')
  }

  const selection = useMemo(
    () => ({
      substrateIds,
      crewIds,
      plantIds,
      humidityPct: toNumberOrNull(humidity),
    }),
    [substrateIds, crewIds, plantIds, humidity]
  )

  const maintenance = useMemo(() => maintenanceScore(selection), [selection])
  const checklist = useMemo(() => readinessChecklist(selection), [selection])
  const diagramRoles = useMemo(() => orderedLayers(substrateIds), [substrateIds])
  const readyCount = checklist.filter((c) => c.ok).length

  const hasSelection = substrateIds.length > 0 || crewIds.length > 0 || plantIds.length > 0

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast(t('vivarium.errors.nameRequired'), 'error')
      return
    }
    if (!hasSelection) {
      toast(t('vivarium.errors.emptyBuild'), 'error')
      return
    }
    saveBuild({
      speciesId: profile.speciesId,
      name: trimmed,
      substrateIds,
      crewIds,
      plantIds,
      tempHotC: toNumberOrNull(tempHot),
      tempCoolC: toNumberOrNull(tempCool),
      humidityPct: toNumberOrNull(humidity),
      notes,
    })
    toast(t('vivarium.saveToast'), 'success')
    setName('')
    setNotes('')
  }

  function loadBuild(build: VivariumBuild) {
    setSubstrateIds(build.substrateIds)
    setCrewIds(build.crewIds)
    setPlantIds(build.plantIds)
    setTempHot(build.tempHotC != null ? String(build.tempHotC) : '')
    setTempCool(build.tempCoolC != null ? String(build.tempCoolC) : '')
    setHumidity(build.humidityPct != null ? String(build.humidityPct) : '')
    setName(build.name)
    setNotes(build.notes)
    toast(t('vivarium.loaded'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('vivarium.title')}</h1>
        <p className={styles.subtitle}>{t('vivarium.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {activeSpecies.koreanName}
          </p>
        )}
      </header>

      {isAquatic ? (
        <Card padding="lg" className={styles.aquaticCard}>
          <Card.Body>
            <h2 className={styles.sectionTitle}>{t('vivarium.aquatic.title')}</h2>
            <p className={styles.aquaticBody}>{t('vivarium.aquatic.body')}</p>
            {template?.tip && <p className={styles.tip}>{template.tip}</p>}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card padding="lg" className={styles.introCard}>
            <Card.Body>
              <p className={styles.introText}>{t('vivarium.intro')}</p>
              {template?.tip && (
                <p className={styles.tip}>
                  <span aria-hidden="true">💡</span> {template.tip}
                </p>
              )}
              {template && (
                <div className={styles.introActions}>
                  <Button type="button" variant="primary" onClick={applyTemplate}>
                    {t('vivarium.loadTemplate')}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          <div className={styles.workArea}>
            <div className={styles.composerColumn}>
              <Card padding="lg">
                <Card.Body>
                  <h2 className={styles.sectionTitle}>{t('vivarium.composer.title')}</h2>

                  <ChipGroup
                    title={t('vivarium.composer.substrate')}
                    hint={t('vivarium.composer.substrateHint')}
                  >
                    {SUBSTRATE_LAYERS.map((s) => (
                      <Chip
                        key={s.id}
                        label={s.name}
                        sub={t(`vivarium.roles.${s.role}`)}
                        active={substrateIds.includes(s.id)}
                        onToggle={() => setSubstrateIds((prev) => toggle(prev, s.id))}
                      />
                    ))}
                  </ChipGroup>

                  <ChipGroup
                    title={t('vivarium.composer.crew')}
                    hint={t('vivarium.composer.crewHint')}
                  >
                    {CLEANUP_CREW.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.name}
                        sub={t(`vivarium.humidity.${c.humidity}`)}
                        active={crewIds.includes(c.id)}
                        onToggle={() => setCrewIds((prev) => toggle(prev, c.id))}
                      />
                    ))}
                  </ChipGroup>

                  <ChipGroup
                    title={t('vivarium.composer.plants')}
                    hint={t('vivarium.composer.plantsHint')}
                  >
                    {PLANTS.map((p) => (
                      <Chip
                        key={p.id}
                        label={p.name}
                        sub={t(`vivarium.light.${p.light}`)}
                        active={plantIds.includes(p.id)}
                        onToggle={() => setPlantIds((prev) => toggle(prev, p.id))}
                      />
                    ))}
                  </ChipGroup>

                  <div className={styles.gradientRow}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      label={t('vivarium.gradient.hot')}
                      value={tempHot}
                      onChange={(e) => setTempHot(e.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      label={t('vivarium.gradient.cool')}
                      value={tempCool}
                      onChange={(e) => setTempCool(e.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      label={t('vivarium.gradient.humidity')}
                      value={humidity}
                      onChange={(e) => setHumidity(e.target.value)}
                    />
                  </div>
                </Card.Body>
              </Card>

              <Card padding="lg">
                <Card.Body>
                  <h2 className={styles.sectionTitle}>{t('vivarium.save.title')}</h2>
                  <div className={styles.saveForm}>
                    <Input
                      label={t('vivarium.save.name')}
                      placeholder={t('vivarium.save.namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                    />
                    <Textarea
                      label={t('vivarium.save.notes')}
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                    />
                    <div className={styles.saveActions}>
                      <Button type="button" variant="primary" onClick={handleSave}>
                        {t('vivarium.save.action')}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <div className={styles.previewColumn}>
              <Card padding="lg">
                <Card.Body>
                  <h2 className={styles.sectionTitle}>{t('vivarium.diagram.title')}</h2>
                  {diagramRoles.length === 0 ? (
                    <p className={styles.diagramEmpty}>{t('vivarium.diagram.empty')}</p>
                  ) : (
                    <div
                      className={styles.diagram}
                      role="img"
                      aria-label={t('vivarium.diagram.aria')}
                    >
                      {diagramRoles.map((role) => (
                        <div
                          key={role}
                          className={styles.band}
                          style={{
                            background: ROLE_BAND[role].bg,
                            color: ROLE_BAND[role].fg,
                          }}
                        >
                          <span className={styles.bandRole}>{t(`vivarium.roles.${role}`)}</span>
                          <span className={styles.bandNames}>
                            {substrateIds
                              .map((id) => substrateById(id))
                              .filter((s) => s?.role === role)
                              .map((s) => s?.name)
                              .join(' · ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className={styles.diagramCaption}>{t('vivarium.diagram.caption')}</p>
                </Card.Body>
              </Card>

              <Card padding="lg">
                <Card.Body>
                  <div className={styles.maintenanceHead}>
                    <h2 className={styles.sectionTitle}>{t('vivarium.maintenance.title')}</h2>
                    <Badge variant={LEVEL_VARIANT[maintenance.level]}>
                      {t(`vivarium.levels.${maintenance.level}`)}
                    </Badge>
                  </div>
                  <Progress value={maintenance.score} variant={LEVEL_VARIANT[maintenance.level]} />
                  <p className={styles.maintenanceHint}>
                    {t('vivarium.maintenance.scoreLabel', { score: maintenance.score })}
                  </p>
                  {maintenance.factors.length > 0 && (
                    <ul className={styles.factorChips}>
                      {maintenance.factors.map((f) => (
                        <li key={f}>
                          <span className={`${styles.factorChip} ${factorTone(f)}`}>
                            {t(`vivarium.factors.${f}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>

              <Card padding="lg">
                <Card.Body>
                  <div className={styles.maintenanceHead}>
                    <h2 className={styles.sectionTitle}>{t('vivarium.checklist.title')}</h2>
                    <span className={styles.checklistCount}>
                      {t('vivarium.checklist.progress', {
                        done: readyCount,
                        total: checklist.length,
                      })}
                    </span>
                  </div>
                  <ul className={styles.checklist}>
                    {checklist.map((item) => (
                      <li
                        key={item.id}
                        className={`${styles.checkItem} ${item.ok ? styles.checkOk : styles.checkOff}`}
                      >
                        <span className={styles.checkMark} aria-hidden="true">
                          {item.ok ? '✓' : '✗'}
                        </span>
                        {t(`vivarium.checklist.${item.id as ChecklistId}`)}
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </div>
          </div>

          <section className={styles.savedSection}>
            <h2 className={styles.sectionTitle}>{t('vivarium.saved.title')}</h2>
            <ShowAllPetsToggle checked={showAllPets} onChange={setShowAllPets} />
            {buildList.length === 0 ? (
              <EmptyState
                icon="🌿"
                title={t('vivarium.saved.emptyTitle')}
                description={t('vivarium.saved.emptyDesc')}
              />
            ) : (
              <ul className={styles.buildList}>
                {buildList.map((build) => {
                  return (
                    <li key={build.id}>
                      <Card padding="md">
                        <Card.Body>
                          <div className={styles.buildHead}>
                            <div className={styles.buildHeadLeft}>
                              <strong className={styles.buildName}>{build.name}</strong>
                              <PetBadge petId={build.petId} hideWhenActive={!showAllPets} />
                            </div>
                            <div className={styles.buildActions}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => loadBuild(build)}
                              >
                                {t('vivarium.saved.load')}
                              </Button>
                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => removeBuild(build.id)}
                              >
                                {t('vivarium.saved.remove')}
                              </button>
                            </div>
                          </div>
                          <p className={styles.buildSummary}>
                            {buildSummary(build).map((part) => (
                              <span key={part} className={styles.summaryChip}>
                                {part}
                              </span>
                            ))}
                          </p>
                          {build.notes && <p className={styles.buildNotes}>{build.notes}</p>}
                        </Card.Body>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  )

  function buildSummary(build: VivariumBuild): string[] {
    const parts: string[] = []
    const subs = build.substrateIds
      .map((id) => substrateById(id)?.name)
      .filter((n): n is string => Boolean(n))
    const crew = build.crewIds
      .map((id) => crewById(id)?.name)
      .filter((n): n is string => Boolean(n))
    const plants = build.plantIds
      .map((id) => plantById(id)?.name)
      .filter((n): n is string => Boolean(n))
    if (subs.length) parts.push(t('vivarium.saved.layers', { count: subs.length }))
    if (crew.length) parts.push(t('vivarium.saved.crew', { count: crew.length }))
    if (plants.length) parts.push(t('vivarium.saved.plants', { count: plants.length }))
    if (build.humidityPct != null) {
      parts.push(t('vivarium.saved.humidity', { value: build.humidityPct }))
    }
    if (build.tempHotC != null && build.tempCoolC != null) {
      parts.push(t('vivarium.saved.temp', { hot: build.tempHotC, cool: build.tempCoolC }))
    }
    return parts
  }

  function factorTone(factor: MaintenanceFactor): string {
    if (factor === 'noDrainage' || factor === 'noCrew' || factor === 'noPlants') {
      return styles.factorWarn
    }
    return styles.factorGood
  }
}

interface ChipGroupProps {
  title: string
  hint: string
  children: React.ReactNode
}

function ChipGroup({ title, hint, children }: ChipGroupProps) {
  return (
    <div className={styles.chipGroup}>
      <div className={styles.chipGroupHead}>
        <h3 className={styles.chipGroupTitle}>{title}</h3>
        <span className={styles.chipGroupHint}>{hint}</span>
      </div>
      <div className={styles.chips}>{children}</div>
    </div>
  )
}

interface ChipProps {
  label: string
  sub: string
  active: boolean
  onToggle: () => void
}

function Chip({ label, sub, active, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      aria-pressed={active}
      onClick={onToggle}
    >
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipSub}>{sub}</span>
    </button>
  )
}

export default Vivarium
