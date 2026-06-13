import type { GeneTrait, OffspringOutcome, ParentGenotype, Zygosity } from './schema'

/** Probability that a parent passes the mutant allele for one gene. */
function mutantAlleleProb(z: Zygosity): number {
  return z / 2
}

/**
 * Distribution of offspring zygosity for a single gene given both parents'
 * zygosity. Returns [P(0 copies), P(1 copy), P(2 copies)].
 *
 * Each parent contributes one allele; the offspring's copy count is the sum.
 */
export function offspringZygosityDist(
  sire: Zygosity,
  dam: Zygosity,
): readonly [number, number, number] {
  const ps = mutantAlleleProb(sire)
  const pd = mutantAlleleProb(dam)
  const p2 = ps * pd
  const p0 = (1 - ps) * (1 - pd)
  const p1 = 1 - p0 - p2
  return [p0, p1, p2]
}

/** What a single gene at a given zygosity contributes to the visible / het labels. */
function geneContribution(
  trait: GeneTrait,
  z: Zygosity,
): { visible: string | null; het: string | null } {
  if (z === 0) return { visible: null, het: null }
  switch (trait.mode) {
    case 'recessive':
      // One copy is an invisible carrier; two copies show.
      return z === 2
        ? { visible: trait.doubleLabel, het: null }
        : { visible: null, het: trait.name }
    case 'dominant':
      // One or two copies look identical.
      return { visible: z === 2 ? trait.doubleLabel : trait.singleLabel, het: null }
    case 'codominant':
      // One copy = base morph, two copies = distinct super form.
      return { visible: z === 2 ? trait.doubleLabel : trait.singleLabel, het: null }
  }
}

const ZYGOSITIES: readonly Zygosity[] = [0, 1, 2]

/**
 * Enumerate every offspring genotype outcome across the selected genes,
 * assuming independent (unlinked) loci. Probabilities multiply across genes.
 *
 * Outcomes with non-trivial probability are returned sorted high → low and
 * merged when they share an identical genotype.
 */
export function calculateOutcomes(
  traits: GeneTrait[],
  sire: ParentGenotype,
  dam: ParentGenotype,
): OffspringOutcome[] {
  let outcomes: OffspringOutcome[] = [{ genotype: {}, visible: [], hets: [], probability: 1 }]

  for (const trait of traits) {
    const dist = offspringZygosityDist(sire[trait.id] ?? 0, dam[trait.id] ?? 0)
    const next: OffspringOutcome[] = []
    for (const outcome of outcomes) {
      for (const z of ZYGOSITIES) {
        const p = dist[z]
        if (p <= 0) continue
        const { visible, het } = geneContribution(trait, z)
        next.push({
          genotype: { ...outcome.genotype, [trait.id]: z },
          visible: visible ? [...outcome.visible, visible] : outcome.visible,
          hets: het ? [...outcome.hets, het] : outcome.hets,
          probability: outcome.probability * p,
        })
      }
    }
    outcomes = next
  }

  return outcomes.filter((o) => o.probability > 0).sort((a, b) => b.probability - a.probability)
}

export interface PhenotypeGroup {
  /** Human label for what the clutch member looks like (e.g. "Albino" or "Normal"). */
  label: string
  visible: string[]
  probability: number
  /**
   * Possible-het annotations among the look-alike offspring, e.g.
   * "66% het Albino" — the chance a non-visual sibling carries the trait.
   */
  possibleHets: { name: string; percent: number }[]
}

/**
 * Collapse genotype outcomes into visible phenotype groups, computing the
 * classic "possible het" percentages within each look-alike group.
 */
export function groupByPhenotype(
  outcomes: OffspringOutcome[],
  normalLabel: string,
): PhenotypeGroup[] {
  const groups = new Map<string, OffspringOutcome[]>()
  for (const o of outcomes) {
    const key = o.visible.length ? [...o.visible].sort().join(' · ') : normalLabel
    const bucket = groups.get(key)
    if (bucket) bucket.push(o)
    else groups.set(key, [o])
  }

  const result: PhenotypeGroup[] = []
  for (const [label, bucket] of groups) {
    const probability = bucket.reduce((sum, o) => sum + o.probability, 0)
    // For each het trait that appears in some (but maybe not all) siblings of
    // this look-alike group, the carrier chance = P(het branch) / P(group).
    const hetProb = new Map<string, number>()
    for (const o of bucket) {
      for (const het of o.hets) {
        hetProb.set(het, (hetProb.get(het) ?? 0) + o.probability)
      }
    }
    const possibleHets = [...hetProb.entries()]
      .map(([name, p]) => ({ name, percent: Math.round((p / probability) * 100) }))
      .sort((a, b) => b.percent - a.percent)
    result.push({ label, visible: bucket[0].visible, probability, possibleHets })
  }

  return result.sort((a, b) => b.probability - a.probability)
}

/** Format a probability as a friendly percentage string. */
export function formatPercent(p: number): string {
  const pct = p * 100
  if (pct > 0 && pct < 1) return '<1%'
  if (pct >= 99 && pct < 100) return '>99%'
  return `${Math.round(pct)}%`
}

/** Reduce a probability to the smallest "1 in N" odds for clutch intuition. */
export function asOdds(p: number): string | null {
  if (p <= 0 || p >= 1) return null
  const n = Math.round(1 / p)
  return n >= 2 ? `1/${n}` : null
}
