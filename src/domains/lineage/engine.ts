import type { LineageAnimal } from './schema'

/**
 * Pure, side-effect-free pedigree math over the lineage registry.
 *
 * The registry is a directed graph: each animal points "up" at its sire/dam.
 * A well-formed registry is a DAG, but users can fat-finger a cycle (A's sire
 * is B, B's sire is A) or point at a deleted parent — every traversal here is
 * defensively guarded so a malformed graph can never loop forever.
 */

/** Index the registry by id for O(1) parent lookups. */
export function byId(animals: LineageAnimal[]): Map<string, LineageAnimal> {
  const map = new Map<string, LineageAnimal>()
  for (const animal of animals) map.set(animal.id, animal)
  return map
}

/** Whether an animal points at a sire or a dam (i.e. has any known parent). */
export function hasParents(animal: LineageAnimal): boolean {
  return animal.sireId !== null || animal.damId !== null
}

/** Relation of an ancestor to the subject animal. */
export type Relation = 'sire' | 'dam'

export interface Ancestor {
  animal: LineageAnimal
  /** 1 = parent, 2 = grandparent, … */
  depth: number
  /** Whether this node sits on the sire (paternal) or dam (maternal) side. */
  relation: Relation
}

/**
 * Flatten the ancestry of `animalId` up to `maxDepth` generations into a list,
 * breadth-first (parents before grandparents). Missing parents are skipped and
 * cycles are broken via a visited set so the subject can never reappear as its
 * own ancestor.
 *
 * `relation` reflects the *immediate* side taken from the subject: the
 * paternal grandparents are reached through the sire, so they carry
 * `relation: 'sire'`, and likewise for the maternal side.
 */
export function ancestors(
  animalId: string,
  animals: LineageAnimal[],
  maxDepth: number
): Ancestor[] {
  const index = byId(animals)
  const out: Ancestor[] = []
  if (maxDepth <= 0) return out

  const root = index.get(animalId)
  if (!root) return out

  // Seed the queue with the direct parents, each tagged with its side.
  const visited = new Set<string>([animalId])
  let frontier: { id: string; relation: Relation }[] = []
  if (root.sireId) frontier.push({ id: root.sireId, relation: 'sire' })
  if (root.damId) frontier.push({ id: root.damId, relation: 'dam' })

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: { id: string; relation: Relation }[] = []
    for (const { id, relation } of frontier) {
      if (visited.has(id)) continue // cycle / duplicate guard
      const animal = index.get(id)
      if (!animal) continue // missing parent guard
      visited.add(id)
      out.push({ animal, depth, relation })
      if (animal.sireId) next.push({ id: animal.sireId, relation })
      if (animal.damId) next.push({ id: animal.damId, relation })
    }
    frontier = next
  }

  return out
}

/** A node in the recursive pedigree tree. */
export interface PedigreeNode {
  animal: LineageAnimal
  /** 0 = self, 1 = parents, … */
  depth: number
  /** Paternal subtree, or null when the sire is unknown / missing / pruned. */
  sire: PedigreeNode | null
  /** Maternal subtree, or null when the dam is unknown / missing / pruned. */
  dam: PedigreeNode | null
}

/**
 * Build a normalized pedigree tree rooted at `animalId`, expanding parents up
 * to `depth` generations (e.g. `depth: 2` → self + parents + grandparents).
 *
 * Returns `null` when the id is not in the registry. A `visited` set carried
 * down the recursion prunes any branch that would revisit an ancestor already
 * on the current path, so a cyclic registry yields a finite tree instead of
 * looping forever.
 */
export function pedigree(
  animalId: string,
  animals: LineageAnimal[],
  depth: number
): PedigreeNode | null {
  const index = byId(animals)
  const root = index.get(animalId)
  if (!root) return null
  return build(root, 0, depth, index, new Set<string>())
}

function build(
  animal: LineageAnimal,
  depth: number,
  maxDepth: number,
  index: Map<string, LineageAnimal>,
  path: Set<string>
): PedigreeNode {
  // Mark this animal as on the current ancestry path for cycle detection.
  const nextPath = new Set(path)
  nextPath.add(animal.id)

  const node: PedigreeNode = { animal, depth, sire: null, dam: null }
  if (depth >= maxDepth) return node

  const sire = resolveParent(animal.sireId, index, nextPath)
  if (sire) node.sire = build(sire, depth + 1, maxDepth, index, nextPath)

  const dam = resolveParent(animal.damId, index, nextPath)
  if (dam) node.dam = build(dam, depth + 1, maxDepth, index, nextPath)

  return node
}

/** Resolve a parent id to its animal, skipping unknown, missing, or cyclic refs. */
function resolveParent(
  parentId: string | null,
  index: Map<string, LineageAnimal>,
  path: Set<string>
): LineageAnimal | null {
  if (!parentId) return null
  if (path.has(parentId)) return null // cycle guard
  return index.get(parentId) ?? null // missing-parent guard
}

/**
 * Direct offspring of `animalId`: every animal whose sire OR dam is this one.
 * Order follows the input array so callers control sorting upstream.
 */
export function offspringOf(animalId: string, animals: LineageAnimal[]): LineageAnimal[] {
  return animals.filter((a) => a.sireId === animalId || a.damId === animalId)
}

/**
 * Count of distinct known ancestors up to `maxDepth`. Useful for a roster
 * summary ("3 ancestors recorded") without rendering the whole tree.
 */
export function knownAncestorCount(
  animalId: string,
  animals: LineageAnimal[],
  maxDepth: number
): number {
  return ancestors(animalId, animals, maxDepth).length
}
