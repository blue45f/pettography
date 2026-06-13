import { z } from 'zod'

/**
 * The four meteorological seasons of the northern hemisphere (Korea / Japan).
 * Husbandry priorities shift across them — winter heating & dry air, summer
 * overheating, spring breeding cues, autumn cool-down — so the season is the
 * primary axis of this reference guide.
 */
export const seasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter'])
export type Season = z.infer<typeof seasonSchema>

/** Seasons in calendar order (spring first). */
export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'] as const
