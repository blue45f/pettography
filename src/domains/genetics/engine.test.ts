import { describe, expect, it } from 'vitest'

import {
  asOdds,
  calculateOutcomes,
  formatPercent,
  groupByPhenotype,
  offspringZygosityDist,
} from './engine'

import type { GeneTrait } from './schema'

const albino: GeneTrait = {
  id: 'albino',
  speciesSlug: 'x',
  name: 'Albino',
  mode: 'recessive',
  singleLabel: 'het Albino',
  doubleLabel: 'Albino',
}

const pastel: GeneTrait = {
  id: 'pastel',
  speciesSlug: 'x',
  name: 'Pastel',
  mode: 'codominant',
  singleLabel: 'Pastel',
  doubleLabel: 'Super Pastel',
}

const spider: GeneTrait = {
  id: 'spider',
  speciesSlug: 'x',
  name: 'Spider',
  mode: 'dominant',
  singleLabel: 'Spider',
  doubleLabel: 'Spider',
}

function totalProbability(outcomes: { probability: number }[]): number {
  return outcomes.reduce((sum, o) => sum + o.probability, 0)
}

describe('offspringZygosityDist', () => {
  it('normal × normal → all wild-type', () => {
    expect(offspringZygosityDist(0, 0)).toEqual([1, 0, 0])
  })

  it('het × het → 1:2:1 Mendelian ratio', () => {
    expect(offspringZygosityDist(1, 1)).toEqual([0.25, 0.5, 0.25])
  })

  it('visual × normal → 100% single copy', () => {
    expect(offspringZygosityDist(2, 0)).toEqual([0, 1, 0])
  })

  it('visual × het → half single, half double', () => {
    expect(offspringZygosityDist(2, 1)).toEqual([0, 0.5, 0.5])
  })

  it('visual × visual → all double copy', () => {
    expect(offspringZygosityDist(2, 2)).toEqual([0, 0, 1])
  })
})

describe('calculateOutcomes', () => {
  it('het × het recessive yields 25/50/25 normal/het/visual', () => {
    const outcomes = calculateOutcomes([albino], { albino: 1 }, { albino: 1 })
    expect(totalProbability(outcomes)).toBeCloseTo(1)
    const visual = outcomes.find((o) => o.visible.includes('Albino'))
    const carrier = outcomes.find((o) => o.hets.includes('Albino'))
    const normal = outcomes.find((o) => o.visible.length === 0 && o.hets.length === 0)
    expect(visual?.probability).toBeCloseTo(0.25)
    expect(carrier?.probability).toBeCloseTo(0.5)
    expect(normal?.probability).toBeCloseTo(0.25)
  })

  it('visual recessive × normal → 100% het carriers, none visual', () => {
    const outcomes = calculateOutcomes([albino], { albino: 2 }, { albino: 0 })
    expect(outcomes).toHaveLength(1)
    expect(outcomes[0].probability).toBeCloseTo(1)
    expect(outcomes[0].hets).toContain('Albino')
    expect(outcomes[0].visible).toHaveLength(0)
  })

  it('codominant single × single → 25 normal, 50 base, 25 super', () => {
    const outcomes = calculateOutcomes([pastel], { pastel: 1 }, { pastel: 1 })
    const sup = outcomes.find((o) => o.visible.includes('Super Pastel'))
    const base = outcomes.find((o) => o.visible.includes('Pastel'))
    const normal = outcomes.find((o) => o.visible.length === 0)
    expect(sup?.probability).toBeCloseTo(0.25)
    expect(base?.probability).toBeCloseTo(0.5)
    expect(normal?.probability).toBeCloseTo(0.25)
  })

  it('dominant single × normal → 50% visible, no super', () => {
    const outcomes = calculateOutcomes([spider], { spider: 1 }, { spider: 0 })
    const visible = outcomes.filter((o) => o.visible.includes('Spider'))
    expect(totalProbability(visible)).toBeCloseTo(0.5)
    expect(outcomes.some((o) => o.visible.includes('Spider') && o.genotype.spider === 2)).toBe(
      false
    )
  })

  it('two independent genes multiply to a full probability space', () => {
    const outcomes = calculateOutcomes(
      [albino, pastel],
      { albino: 1, pastel: 1 },
      { albino: 1, pastel: 1 }
    )
    expect(totalProbability(outcomes)).toBeCloseTo(1)
    // visual Albino + Super Pastel = 0.25 * 0.25
    const both = outcomes.find(
      (o) => o.visible.includes('Albino') && o.visible.includes('Super Pastel')
    )
    expect(both?.probability).toBeCloseTo(0.0625)
  })
})

describe('groupByPhenotype', () => {
  it('het × het gives the classic 66% possible het', () => {
    const outcomes = calculateOutcomes([albino], { albino: 1 }, { albino: 1 })
    const groups = groupByPhenotype(outcomes, 'Normal')
    const normalGroup = groups.find((g) => g.label === 'Normal')
    expect(normalGroup?.probability).toBeCloseTo(0.75)
    const hetAlbino = normalGroup?.possibleHets.find((h) => h.name === 'Albino')
    expect(hetAlbino?.percent).toBe(67) // 2/3 ≈ 66.7%
  })

  it('normal × het gives 50% possible het', () => {
    const outcomes = calculateOutcomes([albino], { albino: 0 }, { albino: 1 })
    const groups = groupByPhenotype(outcomes, 'Normal')
    const normalGroup = groups.find((g) => g.label === 'Normal')
    expect(normalGroup?.possibleHets[0].percent).toBe(50)
  })
})

describe('formatPercent / asOdds', () => {
  it('formats edge probabilities', () => {
    expect(formatPercent(0.5)).toBe('50%')
    expect(formatPercent(0.004)).toBe('<1%')
    expect(formatPercent(0.999)).toBe('>99%')
  })

  it('reduces odds to 1 in N', () => {
    expect(asOdds(0.25)).toBe('1/4')
    expect(asOdds(0.0625)).toBe('1/16')
    expect(asOdds(1)).toBeNull()
  })
})
