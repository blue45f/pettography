/** Dimensions in centimetres. A null value means "not entered yet". */
export interface Dimensions {
  l: number | null
  w: number | null
  h: number | null
}

/** A fully specified minimum (no nulls). */
export interface MinDimensions {
  l: number
  w: number
  h: number
}

export interface ShortfallMap {
  l: boolean
  w: boolean
  h: boolean
}

export interface MeetsResult {
  ok: boolean
  shortfall: ShortfallMap
}

export type Verdict = 'adequate' | 'upgrade' | 'unknown'

/**
 * Converts a length × width × height box (centimetres) into litres.
 * 1 litre == 1000 cm³. Result is rounded to one decimal place.
 */
export function enclosureVolumeLiters(l: number, w: number, h: number): number {
  const cm3 = l * w * h
  return Math.round((cm3 / 1000) * 10) / 10
}

/**
 * Returns whether every dimension of `current` meets or exceeds `min`, plus a
 * per-dimension shortfall map (true == that dimension is below the minimum).
 * Comparison is strict — minimums are floors, so being exactly at the floor
 * passes but anything under it is flagged.
 */
export function meetsMinimum(current: Dimensions, min: MinDimensions): MeetsResult {
  const shortfall: ShortfallMap = {
    l: current.l === null ? false : current.l < min.l,
    w: current.w === null ? false : current.w < min.w,
    h: current.h === null ? false : current.h < min.h,
  }
  const ok = !shortfall.l && !shortfall.w && !shortfall.h
  return { ok, shortfall }
}

/** True when any of the three current dimensions has not been entered. */
function hasMissingDimension(current: Dimensions): boolean {
  return current.l === null || current.w === null || current.h === null
}

/**
 * Verdict for the keeper's current enclosure against the recommended minimum.
 * Returns 'unknown' when any current dimension is missing, otherwise
 * 'adequate' when all dimensions meet the floor and 'upgrade' when one or
 * more fall short.
 */
export function verdict(current: Dimensions, min: MinDimensions): Verdict {
  if (hasMissingDimension(current)) return 'unknown'
  return meetsMinimum(current, min).ok ? 'adequate' : 'upgrade'
}
