import { describe, expect, it } from 'vitest'

import { ancestors, byId, hasParents, knownAncestorCount, offspringOf, pedigree } from './engine'

import type { LineageAnimal } from './schema'

function animal(overrides: Partial<LineageAnimal> = {}): LineageAnimal {
  return {
    id: overrides.id ?? 'a1',
    name: overrides.name ?? 'Animal',
    speciesId: overrides.speciesId ?? null,
    sex: overrides.sex ?? 'unknown',
    morph: overrides.morph ?? '',
    sireId: overrides.sireId ?? null,
    damId: overrides.damId ?? null,
    notes: overrides.notes ?? '',
    createdAt: overrides.createdAt ?? '2024-01-01T00:00:00.000Z',
  }
}

/**
 * A complete 3-generation family used across the pedigree tests:
 *
 *            grand-pp   grand-pm   grand-mp   grand-mm
 *                  \     /              \     /
 *                   sire                 dam
 *                       \               /
 *                            child
 */
function family(): LineageAnimal[] {
  return [
    animal({ id: 'child', name: 'Child', sireId: 'sire', damId: 'dam' }),
    animal({ id: 'sire', name: 'Sire', sex: 'male', sireId: 'gpp', damId: 'gpm' }),
    animal({ id: 'dam', name: 'Dam', sex: 'female', sireId: 'gmp', damId: 'gmm' }),
    animal({ id: 'gpp', name: 'GrandPaternalSire', sex: 'male' }),
    animal({ id: 'gpm', name: 'GrandPaternalDam', sex: 'female' }),
    animal({ id: 'gmp', name: 'GrandMaternalSire', sex: 'male' }),
    animal({ id: 'gmm', name: 'GrandMaternalDam', sex: 'female' }),
  ]
}

describe('byId', () => {
  it('indexes every animal by its id', () => {
    const map = byId(family())
    expect(map.size).toBe(7)
    expect(map.get('child')?.name).toBe('Child')
    expect(map.get('gmm')?.name).toBe('GrandMaternalDam')
  })

  it('is empty for an empty registry', () => {
    expect(byId([]).size).toBe(0)
  })

  it('keeps the last entry when ids collide', () => {
    const map = byId([animal({ id: 'dup', name: 'First' }), animal({ id: 'dup', name: 'Second' })])
    expect(map.size).toBe(1)
    expect(map.get('dup')?.name).toBe('Second')
  })
})

describe('hasParents', () => {
  it('is false when both parents are unknown', () => {
    expect(hasParents(animal())).toBe(false)
  })

  it('is true when only the sire is known', () => {
    expect(hasParents(animal({ sireId: 'x' }))).toBe(true)
  })

  it('is true when only the dam is known', () => {
    expect(hasParents(animal({ damId: 'y' }))).toBe(true)
  })
})

describe('pedigree', () => {
  it('returns null for an animal not in the registry', () => {
    expect(pedigree('nope', family(), 2)).toBeNull()
  })

  it('builds self + parents + grandparents (3 generations) at depth 2', () => {
    const tree = pedigree('child', family(), 2)
    expect(tree).not.toBeNull()
    expect(tree?.animal.id).toBe('child')
    expect(tree?.depth).toBe(0)

    // Parents
    expect(tree?.sire?.animal.id).toBe('sire')
    expect(tree?.dam?.animal.id).toBe('dam')
    expect(tree?.sire?.depth).toBe(1)

    // Grandparents
    expect(tree?.sire?.sire?.animal.id).toBe('gpp')
    expect(tree?.sire?.dam?.animal.id).toBe('gpm')
    expect(tree?.dam?.sire?.animal.id).toBe('gmp')
    expect(tree?.dam?.dam?.animal.id).toBe('gmm')
    expect(tree?.sire?.sire?.depth).toBe(2)

    // Great-grandparents are pruned at depth 2.
    expect(tree?.sire?.sire?.sire).toBeNull()
    expect(tree?.sire?.sire?.dam).toBeNull()
  })

  it('stops at depth 1 (self + parents only)', () => {
    const tree = pedigree('child', family(), 1)
    expect(tree?.sire?.animal.id).toBe('sire')
    // Grandparents are not expanded.
    expect(tree?.sire?.sire).toBeNull()
    expect(tree?.sire?.dam).toBeNull()
  })

  it('returns just the self node at depth 0', () => {
    const tree = pedigree('child', family(), 0)
    expect(tree?.animal.id).toBe('child')
    expect(tree?.sire).toBeNull()
    expect(tree?.dam).toBeNull()
  })

  it('handles a missing parent (id points nowhere)', () => {
    const animals = [
      animal({ id: 'child', sireId: 'ghost', damId: 'dam' }),
      animal({ id: 'dam', name: 'Dam' }),
    ]
    const tree = pedigree('child', animals, 2)
    expect(tree?.sire).toBeNull() // ghost sire pruned
    expect(tree?.dam?.animal.id).toBe('dam')
  })

  it('handles an animal with no parents at all', () => {
    const tree = pedigree('lone', [animal({ id: 'lone', name: 'Lone' })], 3)
    expect(tree?.animal.id).toBe('lone')
    expect(tree?.sire).toBeNull()
    expect(tree?.dam).toBeNull()
  })

  it('breaks a direct cycle without looping forever (A is its own sire)', () => {
    const tree = pedigree('a', [animal({ id: 'a', sireId: 'a' })], 5)
    // The self-reference is pruned because `a` is already on the path.
    expect(tree?.animal.id).toBe('a')
    expect(tree?.sire).toBeNull()
  })

  it('breaks a two-node cycle (A sire B, B sire A)', () => {
    const animals = [animal({ id: 'a', sireId: 'b' }), animal({ id: 'b', sireId: 'a' })]
    const tree = pedigree('a', animals, 10)
    // a -> b expands, but b -> a is pruned (a already on path).
    expect(tree?.sire?.animal.id).toBe('b')
    expect(tree?.sire?.sire).toBeNull()
  })
})

describe('ancestors', () => {
  it('returns an empty list for maxDepth 0', () => {
    expect(ancestors('child', family(), 0)).toEqual([])
  })

  it('returns an empty list for an unknown animal', () => {
    expect(ancestors('nope', family(), 3)).toEqual([])
  })

  it('lists parents at depth 1 with the correct relation', () => {
    const result = ancestors('child', family(), 1)
    expect(result).toHaveLength(2)
    const sire = result.find((a) => a.animal.id === 'sire')
    const dam = result.find((a) => a.animal.id === 'dam')
    expect(sire?.depth).toBe(1)
    expect(sire?.relation).toBe('sire')
    expect(dam?.relation).toBe('dam')
  })

  it('includes grandparents at depth 2 carrying the paternal/maternal side', () => {
    const result = ancestors('child', family(), 2)
    expect(result).toHaveLength(6) // 2 parents + 4 grandparents
    const gpp = result.find((a) => a.animal.id === 'gpp')
    const gmm = result.find((a) => a.animal.id === 'gmm')
    expect(gpp?.depth).toBe(2)
    expect(gpp?.relation).toBe('sire') // reached via the sire side
    expect(gmm?.relation).toBe('dam') // reached via the dam side
  })

  it('skips missing parents', () => {
    const animals = [
      animal({ id: 'child', sireId: 'ghost', damId: 'dam' }),
      animal({ id: 'dam', name: 'Dam' }),
    ]
    const result = ancestors('child', animals, 3)
    expect(result.map((a) => a.animal.id)).toEqual(['dam'])
  })

  it('does not loop on a cycle and never lists the subject as its own ancestor', () => {
    const animals = [animal({ id: 'a', sireId: 'b' }), animal({ id: 'b', sireId: 'a' })]
    const result = ancestors('a', animals, 50)
    // Only b is reachable; a is the subject and is excluded from the start.
    expect(result.map((a) => a.animal.id)).toEqual(['b'])
  })
})

describe('knownAncestorCount', () => {
  it('counts every distinct known ancestor up to the depth', () => {
    expect(knownAncestorCount('child', family(), 2)).toBe(6)
    expect(knownAncestorCount('child', family(), 1)).toBe(2)
  })

  it('is 0 for an animal with no recorded parents', () => {
    expect(knownAncestorCount('lone', [animal({ id: 'lone' })], 3)).toBe(0)
  })
})

describe('offspringOf', () => {
  it('returns animals whose sire is the subject', () => {
    const kids = offspringOf('sire', family())
    expect(kids.map((k) => k.id)).toContain('child')
  })

  it('returns animals whose dam is the subject', () => {
    const kids = offspringOf('dam', family())
    expect(kids.map((k) => k.id)).toContain('child')
  })

  it('matches on either parent without duplicating when both point to the subject', () => {
    // self-paired edge case: an animal listed as both sire and dam of a child.
    const animals = [
      animal({ id: 'p', name: 'Parent' }),
      animal({ id: 'kid', sireId: 'p', damId: 'p' }),
    ]
    const kids = offspringOf('p', animals)
    expect(kids).toHaveLength(1)
    expect(kids[0].id).toBe('kid')
  })

  it('returns an empty list when the animal has no offspring', () => {
    expect(offspringOf('child', family())).toEqual([])
  })
})
