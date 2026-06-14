import { describe, expect, it } from 'vitest'

import {
  humidityProfileForCategory,
  maintenanceScore,
  orderedLayers,
  readinessChecklist,
  type BuildSelection,
} from './engine'

const EMPTY: BuildSelection = {
  substrateIds: [],
  crewIds: [],
  plantIds: [],
  humidityPct: null,
}

function sel(overrides: Partial<BuildSelection>): BuildSelection {
  return { ...EMPTY, ...overrides }
}

describe('maintenanceScore', () => {
  it('a bare enclosure scores high-maintenance with noCrew/noPlants flags', () => {
    const result = maintenanceScore(EMPTY)
    expect(result.score).toBe(35)
    expect(result.level).toBe('high')
    expect(result.factors).toContain('noCrew')
    expect(result.factors).toContain('noPlants')
  })

  it('adding a cleanup crew raises the score and flags hasCrew', () => {
    const result = maintenanceScore(sel({ crewIds: ['crew-dairy-cow'] }))
    expect(result.score).toBeGreaterThan(maintenanceScore(EMPTY).score)
    expect(result.factors).toContain('hasCrew')
    expect(result.factors).not.toContain('noCrew')
  })

  it('plants and leaf litter each push the score toward self-sustaining', () => {
    const plants = maintenanceScore(sel({ plantIds: ['plant-pothos'] }))
    expect(plants.factors).toContain('hasPlants')
    const litter = maintenanceScore(sel({ substrateIds: ['sub-leaf-litter'] }))
    expect(litter.factors).toContain('goodLitter')
    expect(litter.score).toBeGreaterThan(maintenanceScore(EMPTY).score)
  })

  it('isopods + springtails together earn the balancedCrew bonus', () => {
    const result = maintenanceScore(sel({ crewIds: ['crew-dairy-cow', 'crew-springtail'] }))
    expect(result.factors).toContain('balancedCrew')
    const single = maintenanceScore(sel({ crewIds: ['crew-dairy-cow'] }))
    expect(single.factors).not.toContain('balancedCrew')
  })

  it('a humid build with no drainage is penalised with noDrainage', () => {
    const result = maintenanceScore(sel({ substrateIds: ['sub-organic'], humidityPct: 80 }))
    expect(result.factors).toContain('noDrainage')
    const drained = maintenanceScore(
      sel({ substrateIds: ['sub-hydroball', 'sub-organic'], humidityPct: 80 })
    )
    expect(drained.factors).not.toContain('noDrainage')
    expect(drained.score).toBeGreaterThan(result.score)
  })

  it('a dry build never triggers the drainage penalty', () => {
    const result = maintenanceScore(sel({ substrateIds: ['sub-arid-mix'], humidityPct: 35 }))
    expect(result.factors).not.toContain('noDrainage')
  })

  it('a complete bioactive build reaches the low-maintenance level', () => {
    const result = maintenanceScore(
      sel({
        substrateIds: ['sub-hydroball', 'sub-mesh', 'sub-organic', 'sub-leaf-litter'],
        crewIds: ['crew-dairy-cow', 'crew-springtail'],
        plantIds: ['plant-pothos', 'plant-bromeliad'],
        humidityPct: 70,
      })
    )
    expect(result.level).toBe('low')
    expect(result.score).toBeGreaterThanOrEqual(70)
  })

  it('clamps the score within 0–100', () => {
    const result = maintenanceScore(sel({ substrateIds: ['sub-organic'], humidityPct: 90 }))
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

describe('readinessChecklist', () => {
  it('an empty build fails every item', () => {
    const items = readinessChecklist(EMPTY)
    expect(items.map((i) => i.id)).toEqual([
      'hasDrainage',
      'hasSubstrate',
      'hasCrew',
      'hasPlants',
      'hasTopper',
    ])
    expect(items.every((i) => !i.ok)).toBe(true)
  })

  it('a full humid build passes every item', () => {
    const items = readinessChecklist(
      sel({
        substrateIds: ['sub-hydroball', 'sub-organic', 'sub-leaf-litter'],
        crewIds: ['crew-springtail'],
        plantIds: ['plant-pothos'],
      })
    )
    const byId = Object.fromEntries(items.map((i) => [i.id, i.ok]))
    expect(byId.hasDrainage).toBe(true)
    expect(byId.hasSubstrate).toBe(true)
    expect(byId.hasCrew).toBe(true)
    expect(byId.hasPlants).toBe(true)
    expect(byId.hasTopper).toBe(true)
  })

  it('detects substrate without drainage or topper', () => {
    const items = readinessChecklist(sel({ substrateIds: ['sub-organic'] }))
    const byId = Object.fromEntries(items.map((i) => [i.id, i.ok]))
    expect(byId.hasSubstrate).toBe(true)
    expect(byId.hasDrainage).toBe(false)
    expect(byId.hasTopper).toBe(false)
  })
})

describe('orderedLayers', () => {
  it('orders selected roles bottom → top regardless of input order', () => {
    const ordered = orderedLayers(['sub-leaf-litter', 'sub-organic', 'sub-hydroball', 'sub-mesh'])
    expect(ordered).toEqual(['drainage', 'barrier', 'substrate', 'topper'])
  })

  it('dedupes roles when two layers share a role', () => {
    const ordered = orderedLayers(['sub-organic', 'sub-arid-mix'])
    expect(ordered).toEqual(['substrate'])
  })

  it('ignores unknown ids', () => {
    expect(orderedLayers(['nope', 'sub-organic'])).toEqual(['substrate'])
  })
})

describe('humidityProfileForCategory', () => {
  it('amphibians are humid', () => {
    expect(humidityProfileForCategory('amphibian')).toBe('humid')
  })

  it('reptiles and arthropods default to mid', () => {
    expect(humidityProfileForCategory('reptile')).toBe('mid')
    expect(humidityProfileForCategory('arthropod')).toBe('mid')
  })

  it('null falls back to mid', () => {
    expect(humidityProfileForCategory(null)).toBe('mid')
    expect(humidityProfileForCategory(undefined)).toBe('mid')
  })
})
