import Alert from '@components/common/Alert'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import {
  CLEANUP_CREW,
  PLANTS,
  SUBSTRATE_LAYERS,
  orderedLayers,
  substrateById,
  useActivePetBuilds,
  useVivariumStore,
  type SubstrateRole,
  type VivariumBuild,
} from '@domains/vivarium'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Vivarium.module.css'

const MSD_HUSBANDRY_URL =
  'https://www.msdvetmanual.com/exotic-and-laboratory-animals/reptiles/management-and-husbandry-of-reptiles'
const REVIEW_ITEMS = ['species', 'materials', 'gradient', 'escape', 'cleaning'] as const

const ROLE_BAND: Record<SubstrateRole, { bg: string; fg: string }> = {
  drainage: { bg: '#9aa7b2', fg: '#1f2933' },
  barrier: { bg: '#cbd5e1', fg: '#1f2933' },
  substrate: { bg: '#6b4f3a', fg: '#fdf6ee' },
  topper: { bg: '#5a7a3f', fg: '#f4faf0' },
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function Vivarium() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('vivarium.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: speciesList = [] } = useSpeciesList({})
  const activeSpecies = useMemo(
    () => speciesList.find((species) => species.id === profile.speciesId) ?? null,
    [profile.speciesId, speciesList]
  )
  const isAquatic = activeSpecies?.slug === 'axolotl'
  const builds = useActivePetBuilds()
  const saveBuild = useVivariumStore((state) => state.saveBuild)
  const removeBuild = useVivariumStore((state) => state.removeBuild)

  const [substrateIds, setSubstrateIds] = useState<string[]>([])
  const [crewIds, setCrewIds] = useState<string[]>([])
  const [plantIds, setPlantIds] = useState<string[]>([])
  const [tempHot, setTempHot] = useState('')
  const [tempCool, setTempCool] = useState('')
  const [humidity, setHumidity] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const diagramRoles = useMemo(() => orderedLayers(substrateIds), [substrateIds])
  const selectedCount = substrateIds.length + crewIds.length + plantIds.length

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  }

  function handleSave() {
    if (!activePetId) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast(t('vivarium.errors.nameRequired'), 'error')
      return
    }
    if (selectedCount === 0) {
      toast(t('vivarium.errors.emptyBuild'), 'error')
      return
    }

    const hot = toNumberOrNull(tempHot)
    const cool = toNumberOrNull(tempCool)
    const humidityValue = toNumberOrNull(humidity)
    if (
      (tempHot.trim() && hot === null) ||
      (tempCool.trim() && cool === null) ||
      (humidity.trim() && humidityValue === null)
    ) {
      toast(t('vivarium.errors.numberInvalid'), 'error')
      return
    }
    if (
      (hot !== null && (hot < -20 || hot > 60)) ||
      (cool !== null && (cool < -20 || cool > 60)) ||
      (humidityValue !== null && (humidityValue < 0 || humidityValue > 100))
    ) {
      toast(t('vivarium.errors.range'), 'error')
      return
    }
    if (hot !== null && cool !== null && hot < cool) {
      toast(t('vivarium.errors.gradientOrder'), 'error')
      return
    }

    saveBuild({
      petId: activePetId,
      speciesId: profile.speciesId,
      name: trimmedName,
      substrateIds,
      crewIds,
      plantIds,
      tempHotC: hot,
      tempCoolC: cool,
      humidityPct: humidityValue,
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
    setTempHot(build.tempHotC == null ? '' : String(build.tempHotC))
    setTempCool(build.tempCoolC == null ? '' : String(build.tempCoolC))
    setHumidity(build.humidityPct == null ? '' : String(build.humidityPct))
    setName(build.name)
    setNotes(build.notes)
    toast(t('vivarium.loaded'), 'success')
  }

  function handleRemove(build: VivariumBuild) {
    if (!window.confirm(t('vivarium.saved.removeConfirm', { name: build.name }))) return
    removeBuild(build.id)
    toast(t('vivarium.saved.removed'), 'info')
  }

  function buildSummary(build: VivariumBuild): string[] {
    const summary: string[] = []
    if (build.substrateIds.length)
      summary.push(t('vivarium.saved.layers', { count: build.substrateIds.length }))
    if (build.crewIds.length)
      summary.push(t('vivarium.saved.crew', { count: build.crewIds.length }))
    if (build.plantIds.length)
      summary.push(t('vivarium.saved.plants', { count: build.plantIds.length }))
    if (build.humidityPct != null)
      summary.push(t('vivarium.saved.humidity', { value: build.humidityPct }))
    if (build.tempHotC != null && build.tempCoolC != null)
      summary.push(t('vivarium.saved.temp', { hot: build.tempHotC, cool: build.tempCoolC }))
    return summary
  }

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('vivarium.eyebrow')}</p>
          <h1>{t('vivarium.title')}</h1>
          <p className={styles.subtitle}>{t('vivarium.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🌿
            </span>
            <h2>{t('vivarium.petRequiredTitle')}</h2>
            <p>{t('vivarium.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('vivarium.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('vivarium.eyebrow')}</p>
        <h1>{t('vivarium.title')}</h1>
        <p className={styles.subtitle}>{t('vivarium.subtitle')}</p>
        <span className={styles.petContext}>
          <span aria-hidden="true">{activeSpecies?.heroEmoji ?? '🐾'}</span>
          {profile.petName?.trim() || activeSpecies?.koreanName || t('vivarium.aPet')}
        </span>
      </header>

      <Alert variant="warning" title={t('vivarium.safetyTitle')}>
        <p>{t('vivarium.safetyBody')}</p>
        <a className={styles.sourceLink} href={MSD_HUSBANDRY_URL} target="_blank" rel="noreferrer">
          {t('vivarium.sourceLink')}
        </a>
      </Alert>

      {isAquatic ? (
        <Card padding="lg" className={styles.aquaticCard}>
          <Card.Body>
            <h2 className={styles.sectionTitle}>{t('vivarium.aquatic.title')}</h2>
            <p className={styles.aquaticBody}>{t('vivarium.aquatic.body')}</p>
            <Link to="/water" className={styles.aquaticLink}>
              {t('vivarium.aquatic.openWater')}
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <>
          <div className={styles.workArea}>
            <div className={styles.composerColumn}>
              <Card padding="lg">
                <Card.Body>
                  <h2 className={styles.sectionTitle}>{t('vivarium.composer.title')}</h2>
                  <p className={styles.composerNote}>{t('vivarium.composer.note')}</p>
                  <ChipGroup
                    title={t('vivarium.composer.substrate')}
                    hint={t('vivarium.composer.substrateHint')}
                  >
                    {SUBSTRATE_LAYERS.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.name}
                        sub={t(`vivarium.roles.${item.role}`)}
                        active={substrateIds.includes(item.id)}
                        onToggle={() => setSubstrateIds((current) => toggle(current, item.id))}
                      />
                    ))}
                  </ChipGroup>
                  <ChipGroup
                    title={t('vivarium.composer.crew')}
                    hint={t('vivarium.composer.crewHint')}
                  >
                    {CLEANUP_CREW.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.name}
                        sub={t(`vivarium.humidity.${item.humidity}`)}
                        active={crewIds.includes(item.id)}
                        onToggle={() => setCrewIds((current) => toggle(current, item.id))}
                      />
                    ))}
                  </ChipGroup>
                  <ChipGroup
                    title={t('vivarium.composer.plants')}
                    hint={t('vivarium.composer.plantsHint')}
                  >
                    {PLANTS.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.name}
                        sub={t(`vivarium.light.${item.light}`)}
                        active={plantIds.includes(item.id)}
                        onToggle={() => setPlantIds((current) => toggle(current, item.id))}
                      />
                    ))}
                  </ChipGroup>
                  <div className={styles.gradientRow}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="-20"
                      max="60"
                      step="0.1"
                      label={t('vivarium.gradient.hot')}
                      value={tempHot}
                      onChange={(event) => setTempHot(event.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="-20"
                      max="60"
                      step="0.1"
                      label={t('vivarium.gradient.cool')}
                      value={tempCool}
                      onChange={(event) => setTempCool(event.target.value)}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.1"
                      label={t('vivarium.gradient.humidity')}
                      value={humidity}
                      onChange={(event) => setHumidity(event.target.value)}
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
                      onChange={(event) => setName(event.target.value)}
                      maxLength={80}
                    />
                    <Textarea
                      label={t('vivarium.save.notes')}
                      rows={3}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
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
                          style={{ background: ROLE_BAND[role].bg, color: ROLE_BAND[role].fg }}
                        >
                          <span className={styles.bandRole}>{t(`vivarium.roles.${role}`)}</span>
                          <span className={styles.bandNames}>
                            {substrateIds
                              .map((id) => substrateById(id))
                              .filter((item) => item?.role === role)
                              .map((item) => item?.name)
                              .join(' · ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className={styles.diagramCaption}>{t('vivarium.diagram.caption')}</p>
                </Card.Body>
              </Card>

              <Card padding="lg" className={styles.selectionSummary}>
                <Card.Body>
                  <h2 className={styles.sectionTitle}>{t('vivarium.summary.title')}</h2>
                  <dl className={styles.summaryStats} aria-live="polite">
                    <div>
                      <dt>{t('vivarium.summary.layers')}</dt>
                      <dd>{substrateIds.length}</dd>
                    </div>
                    <div>
                      <dt>{t('vivarium.summary.crew')}</dt>
                      <dd>{crewIds.length}</dd>
                    </div>
                    <div>
                      <dt>{t('vivarium.summary.plants')}</dt>
                      <dd>{plantIds.length}</dd>
                    </div>
                  </dl>
                  <p className={styles.summaryNote}>{t('vivarium.summary.note')}</p>
                </Card.Body>
              </Card>

              <Card padding="lg">
                <Card.Body>
                  <h2 className={styles.sectionTitle}>{t('vivarium.review.title')}</h2>
                  <ul className={styles.reviewList}>
                    {REVIEW_ITEMS.map((item) => (
                      <li key={item}>{t(`vivarium.review.${item}`)}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </div>
          </div>

          <section className={styles.savedSection} aria-labelledby="vivarium-saved-title">
            <h2 id="vivarium-saved-title" className={styles.sectionTitle}>
              {t('vivarium.saved.title')}
            </h2>
            {builds.length === 0 ? (
              <EmptyState
                icon="🌿"
                title={t('vivarium.saved.emptyTitle')}
                description={t('vivarium.saved.emptyDesc')}
              />
            ) : (
              <ul className={styles.buildList}>
                {builds.map((build) => (
                  <li key={build.id}>
                    <Card padding="md">
                      <Card.Body>
                        <div className={styles.buildHead}>
                          <strong className={styles.buildName}>{build.name}</strong>
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
                              onClick={() => handleRemove(build)}
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
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  )
}

function ChipGroup({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: ReactNode
}) {
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

function Chip({
  label,
  sub,
  active,
  onToggle,
}: {
  label: string
  sub: string
  active: boolean
  onToggle: () => void
}) {
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
