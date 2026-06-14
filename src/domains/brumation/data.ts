/**
 * Reference templates for a controlled brumation (동면) cycle.
 *
 * Brumation is the reptile analogue of hibernation — a deliberate, cool
 * dormancy some species (bearded dragons, certain geckos, many tortoises)
 * undergo seasonally or to trigger breeding. Done carelessly it can kill the
 * animal, so the schedule is broken into ordered, well-defined phases with a
 * gut-clearing fast, a gradual temperature step-down, the cool dormant
 * stretch, then a gradual warm-up and recovery.
 *
 * The day counts below are sensible default *durations* drawn from common
 * keeper consensus (e.g. bearded dragon / Russian tortoise care references).
 * They are starting points the keeper can override per plan, NOT precise
 * prescriptions — actual timing depends on species, individual, and a vet's
 * guidance. The UI surfaces that caveat. All human-readable copy lives in i18n
 * under `brumation.phases.<id>.{title,desc}` and `brumation.safety.<id>`.
 */

/** Stable identifiers for the ordered brumation phases. */
export const BRUMATION_PHASE_IDS = [
  'vetCheck',
  'fasting',
  'coolDown',
  'dormancy',
  'warmUp',
  'recovery',
] as const

export type BrumationPhaseId = (typeof BRUMATION_PHASE_IDS)[number]

export interface BrumationPhaseTemplate {
  /** Stable phase id, also the i18n sub-key. */
  id: BrumationPhaseId
  /** Default duration in days, used when the plan omits an override. */
  defaultDays: number
}

/**
 * The ordered phases of a brumation cycle. Order is load-bearing: the engine
 * lays them out cumulatively from the plan's start date.
 */
export const BRUMATION_PHASES: readonly BrumationPhaseTemplate[] = [
  { id: 'vetCheck', defaultDays: 7 },
  { id: 'fasting', defaultDays: 14 },
  { id: 'coolDown', defaultDays: 10 },
  { id: 'dormancy', defaultDays: 60 },
  { id: 'warmUp', defaultDays: 10 },
  { id: 'recovery', defaultDays: 14 },
] as const

/** Default duration for a phase id, falling back to 0 for unknown ids. */
export function defaultDaysFor(id: BrumationPhaseId): number {
  return BRUMATION_PHASES.find((p) => p.id === id)?.defaultDays ?? 0
}

/**
 * Identifiers for the safety notes shown above the planner. Copy lives in i18n
 * under `brumation.safety.<id>` so the warnings stay translatable.
 */
export const SAFETY_NOTES = [
  'healthyOnly',
  'vetFirst',
  'noJuvenile',
  'fastBeforeCool',
  'monitorWeight',
  'tempControl',
] as const

export type SafetyNoteId = (typeof SAFETY_NOTES)[number]
