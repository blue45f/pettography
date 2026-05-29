import { z } from 'zod'

/**
 * How a morph gene is inherited.
 * - `recessive`: needs two copies (homozygous) to show. One copy = invisible "het" carrier.
 * - `dominant`: one copy shows fully; a second copy looks identical (no super form).
 * - `codominant`: one copy shows the base morph, two copies show a distinct "super" form
 *   (incomplete dominance, e.g. Mack Snow → Super Snow, Pastel → Super Pastel).
 */
export const inheritanceModeSchema = z.enum(['recessive', 'dominant', 'codominant'])
export type InheritanceMode = z.infer<typeof inheritanceModeSchema>

/**
 * Number of mutant alleles an animal carries for a single gene locus.
 * 0 = wild-type, 1 = single copy (het / base morph), 2 = double copy (visual / super).
 */
export const zygositySchema = z.union([z.literal(0), z.literal(1), z.literal(2)])
export type Zygosity = z.infer<typeof zygositySchema>

export const geneTraitSchema = z.object({
  id: z.string(),
  speciesSlug: z.string(),
  /** Display name of the base morph, e.g. "알비노 (Tremper)". */
  name: z.string(),
  mode: inheritanceModeSchema,
  /** Label for a single-copy animal: het carrier (recessive) or base morph (codom/dom). */
  singleLabel: z.string(),
  /** Label for a double-copy animal: visual (recessive/dom) or super form (codom). */
  doubleLabel: z.string(),
  note: z.string().optional(),
})
export type GeneTrait = z.infer<typeof geneTraitSchema>

/** A parent's chosen zygosity for each selected gene, keyed by trait id. */
export type ParentGenotype = Record<string, Zygosity>

/** One enumerated offspring genotype outcome with its exact probability. */
export interface OffspringOutcome {
  /** Per-gene resulting zygosity, keyed by trait id. */
  genotype: Record<string, Zygosity>
  /** Visible morph labels (what the animal looks like). Empty → wild-type. */
  visible: string[]
  /** Definite het carriers in this branch (invisible recessive single copies). */
  hets: string[]
  /** Exact probability in [0, 1]. */
  probability: number
}

/** A saved pairing the keeper wants to keep around. */
export const savedPairingSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesSlug: z.string(),
  label: z.string().max(80),
  sire: z.record(z.string(), zygositySchema),
  dam: z.record(z.string(), zygositySchema),
  createdAt: z.string(),
})
export type SavedPairing = z.infer<typeof savedPairingSchema>
