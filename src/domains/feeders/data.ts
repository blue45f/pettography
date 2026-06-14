import type { FeederType } from './schema'

/**
 * Static per-feeder-type care reference.
 *
 * Each colony type has a small, practical care note (gut-load tips, a rough
 * temperature band, and how long until the culture is productive) plus an emoji
 * for the type chip. All human-readable copy lives in i18n under
 * `feeders.care.<type>` and `feeders.types.<type>`; only stable,
 * non-translatable facts (temperature numbers, emoji) live here.
 */
export interface FeederCare {
  /** Feeder type id, also the i18n sub-key for label + care copy. */
  type: FeederType
  /** Decorative emoji for the type chip. */
  emoji: string
  /** Rough husbandry temperature band in Celsius, or null when not applicable. */
  tempMinC: number | null
  tempMaxC: number | null
  /**
   * Whether this culture is a bioactive cleanup crew (isopods / springtails)
   * rather than a feeder you gut-load and offer directly. Used to soften the
   * "feed the feeders" cadence copy.
   */
  cleanupCrew: boolean
}

export const FEEDER_CARE: Record<FeederType, FeederCare> = {
  dubia: { type: 'dubia', emoji: '🪳', tempMinC: 27, tempMaxC: 32, cleanupCrew: false },
  cricket: { type: 'cricket', emoji: '🦗', tempMinC: 24, tempMaxC: 30, cleanupCrew: false },
  mealworm: { type: 'mealworm', emoji: '🐛', tempMinC: 21, tempMaxC: 27, cleanupCrew: false },
  superworm: { type: 'superworm', emoji: '🪱', tempMinC: 24, tempMaxC: 28, cleanupCrew: false },
  isopod: { type: 'isopod', emoji: '🦐', tempMinC: 20, tempMaxC: 26, cleanupCrew: true },
  springtail: { type: 'springtail', emoji: '✨', tempMinC: 18, tempMaxC: 24, cleanupCrew: true },
  other: { type: 'other', emoji: '🧫', tempMinC: null, tempMaxC: null, cleanupCrew: false },
}

/** Care reference for a feeder type. */
export function careFor(type: FeederType): FeederCare {
  return FEEDER_CARE[type]
}
