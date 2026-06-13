import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import { useToast } from '@components/common/Toast'
import {
  asOdds,
  calculateOutcomes,
  formatPercent,
  GENETICS_SPECIES,
  groupByPhenotype,
  POLYGENIC_NOTE_SPECIES,
  traitsForSpecies,
  useActivePetPairings,
  useGeneticsStore,
  type GeneTrait,
  type ParentGenotype,
  type Zygosity,
} from '@domains/genetics'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Genetics.module.css'

const ZYGOSITY_STATES: readonly Zygosity[] = [0, 1, 2]

function zygosityLabel(trait: GeneTrait, z: Zygosity, t: (k: string) => string): string {
  if (z === 0) return t('genetics.normal')
  if (z === 1) return trait.mode === 'dominant' ? t('genetics.expressed') : trait.singleLabel
  return trait.mode === 'dominant' ? t('genetics.homozygous') : trait.doubleLabel
}

function Genetics() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('genetics.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeSlug = useMemo(() => {
    const match = speciesList.find((s) => s.id === profile.speciesId)
    return match && GENETICS_SPECIES.includes(match.slug) ? match.slug : null
  }, [speciesList, profile.speciesId])

  // Until the keeper explicitly picks a species, follow the active pet's
  // species (once the list resolves), falling back to the first catalog entry.
  // Derived — no effect needed.
  const [chosenSlug, setChosenSlug] = useState<string | null>(null)
  const speciesSlug = chosenSlug ?? activeSlug ?? GENETICS_SPECIES[0]
  const [sire, setSire] = useState<ParentGenotype>({})
  const [dam, setDam] = useState<ParentGenotype>({})
  const [showGenotype, setShowGenotype] = useState(false)
  const [label, setLabel] = useState('')

  // Switching species clears the (species-specific) parent genotypes.
  const selectSpecies = (slug: string) => {
    setChosenSlug(slug)
    setSire({})
    setDam({})
  }

  const traits = useMemo(() => traitsForSpecies(speciesSlug), [speciesSlug])
  const outcomes = useMemo(() => calculateOutcomes(traits, sire, dam), [traits, sire, dam])
  const groups = useMemo(() => groupByPhenotype(outcomes, t('genetics.normal')), [outcomes, t])

  const savePairing = useGeneticsStore((s) => s.savePairing)
  const removePairing = useGeneticsStore((s) => s.removePairing)
  const pairings = useActivePetPairings()

  const speciesName = (slug: string) => {
    const sp = speciesList.find((s) => s.slug === slug)
    return { name: sp?.koreanName ?? slug, emoji: sp?.heroEmoji ?? '🧬' }
  }

  const activeCount =
    Object.values(sire).filter(Boolean).length + Object.values(dam).filter(Boolean).length

  const setZygosity = (side: 'sire' | 'dam', traitId: string, z: Zygosity) => {
    const setter = side === 'sire' ? setSire : setDam
    setter((prev) => ({ ...prev, [traitId]: z }))
  }

  const onSave = () => {
    if (activeCount === 0) {
      toast(t('genetics.save.needTrait'), 'warning')
      return
    }
    savePairing({ speciesSlug, label: label || t('genetics.save.untitled'), sire, dam })
    setLabel('')
    toast(t('genetics.save.saved'), 'success')
  }

  const loadPairing = (slug: string, s: ParentGenotype, d: ParentGenotype) => {
    setChosenSlug(slug)
    setSire(s)
    setDam(d)
  }

  const isPolygenic = POLYGENIC_NOTE_SPECIES.includes(speciesSlug)
  const current = speciesName(speciesSlug)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('genetics.title')}</h1>
        <p className={styles.subtitle}>{t('genetics.subtitle')}</p>
      </header>

      <div className={styles.speciesChips} role="tablist" aria-label={t('genetics.speciesLabel')}>
        {GENETICS_SPECIES.map((slug) => {
          const sp = speciesName(slug)
          const active = slug === speciesSlug
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              onClick={() => selectSpecies(slug)}
            >
              <span aria-hidden="true">{sp.emoji}</span> {sp.name}
            </button>
          )
        })}
      </div>

      {isPolygenic && (
        <Card padding="md" className={styles.caveat}>
          <Card.Body>
            <p className={styles.caveatText}>⚠️ {t('genetics.polygenicNote')}</p>
          </Card.Body>
        </Card>
      )}

      <div className={styles.parents}>
        {(['sire', 'dam'] as const).map((side) => {
          const genotype = side === 'sire' ? sire : dam
          return (
            <Card key={side} padding="lg" className={styles.parentCard}>
              <Card.Body>
                <h2 className={styles.parentTitle}>
                  <span aria-hidden="true">{side === 'sire' ? '♂' : '♀'}</span>{' '}
                  {t(`genetics.${side}`)}
                </h2>
                <ul className={styles.traitList}>
                  {traits.map((trait) => {
                    const z = genotype[trait.id] ?? 0
                    return (
                      <li key={trait.id} className={styles.traitRow}>
                        <span className={styles.traitName}>{trait.name}</span>
                        <div
                          className={styles.segmented}
                          role="group"
                          aria-label={`${current.name} ${trait.name}`}
                        >
                          {ZYGOSITY_STATES.map((state) => (
                            <button
                              key={state}
                              type="button"
                              aria-pressed={z === state}
                              className={`${styles.seg} ${z === state ? styles.segActive : ''} ${
                                state === 2 ? styles.segStrong : ''
                              }`}
                              onClick={() => setZygosity(side, trait.id, state)}
                            >
                              {zygosityLabel(trait, state, t)}
                            </button>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card.Body>
            </Card>
          )
        })}
      </div>

      <Card padding="lg" className={styles.resultCard}>
        <Card.Body>
          <div className={styles.resultHeader}>
            <h2 className={styles.resultTitle}>{t('genetics.results.title')}</h2>
            <span className={styles.resultMeta}>
              {t('genetics.results.distinct', { count: groups.length })}
            </span>
          </div>

          {activeCount === 0 ? (
            <p className={styles.hint}>{t('genetics.results.hint')}</p>
          ) : (
            <ul className={styles.groupList}>
              {groups.map((g) => {
                const odds = asOdds(g.probability)
                return (
                  <li key={g.label} className={styles.group}>
                    <div className={styles.groupTop}>
                      <span className={styles.groupLabel}>{g.label}</span>
                      <span className={styles.groupPct}>{formatPercent(g.probability)}</span>
                    </div>
                    <div
                      className={styles.bar}
                      role="meter"
                      aria-valuenow={Math.round(g.probability * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span
                        className={styles.barFill}
                        style={{ inlineSize: `${Math.max(2, g.probability * 100)}%` }}
                      />
                    </div>
                    <div className={styles.groupFooter}>
                      {odds && <span className={styles.odds}>≈ {odds}</span>}
                      {g.possibleHets.map((h) => (
                        <Badge key={h.name} variant="warning">
                          {h.percent}% het {h.name}
                        </Badge>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {activeCount > 0 && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowGenotype((v) => !v)}
              aria-expanded={showGenotype}
            >
              {showGenotype
                ? t('genetics.results.hideGenotype')
                : t('genetics.results.showGenotype')}
            </button>
          )}

          {showGenotype && activeCount > 0 && (
            <table className={styles.genoTable}>
              <thead>
                <tr>
                  <th>{t('genetics.results.phenotype')}</th>
                  <th>{t('genetics.results.carriers')}</th>
                  <th className={styles.right}>{t('genetics.results.odds')}</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map((o, i) => (
                  <tr key={i}>
                    <td>{o.visible.length ? o.visible.join(' · ') : t('genetics.normal')}</td>
                    <td className={styles.hetCell}>
                      {o.hets.length ? o.hets.map((h) => `het ${h}`).join(', ') : '—'}
                    </td>
                    <td className={styles.right}>{formatPercent(o.probability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card.Body>
      </Card>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.saveTitle}>{t('genetics.save.title')}</h2>
          <div className={styles.saveRow}>
            <Input
              label={t('genetics.save.label')}
              placeholder={t('genetics.save.placeholder')}
              value={label}
              maxLength={80}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Button type="button" variant="primary" onClick={onSave}>
              {t('genetics.save.cta')}
            </Button>
          </div>

          {pairings.length === 0 ? (
            <p className={styles.hint}>{t('genetics.save.empty')}</p>
          ) : (
            <ul className={styles.pairingList}>
              {pairings.map((p) => {
                const sp = speciesName(p.speciesSlug)
                return (
                  <li key={p.id} className={styles.pairing}>
                    <button
                      type="button"
                      className={styles.pairingLoad}
                      onClick={() => loadPairing(p.speciesSlug, p.sire, p.dam)}
                    >
                      <span aria-hidden="true">{sp.emoji}</span>
                      <span className={styles.pairingLabel}>{p.label}</span>
                      <span className={styles.pairingSpecies}>{sp.name}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removePairing(p.id)}
                      aria-label={t('common.delete')}
                    >
                      {t('common.delete')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card.Body>
      </Card>

      <EmptyState
        className={styles.legend}
        icon="🧬"
        title={t('genetics.legend.title')}
        description={t('genetics.legend.body')}
        headingLevel={2}
      />
    </section>
  )
}

export default Genetics
