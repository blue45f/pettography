import type { GearType } from './schema'

/**
 * Default replacement cadence for each gear type, in months.
 *
 * `defaultIntervalMonths === 0` means there is no scheduled replacement — the
 * item is tracked / monitored only (e.g. a thermostat you watch for failure
 * rather than swap on a clock).
 *
 * UVB bulbs are the headline case: compact / T8 tubes lose usable UV output in
 * ~6 months, while high-output T5 tubes last ~12 — see the `gear.types.uvbBulb`
 * note copy in the locales.
 */
export interface GearTypePreset {
  id: GearType
  defaultIntervalMonths: number
}

export const GEAR_TYPES: readonly GearTypePreset[] = [
  { id: 'uvbBulb', defaultIntervalMonths: 6 },
  { id: 'heatBulb', defaultIntervalMonths: 12 },
  { id: 'thermostat', defaultIntervalMonths: 0 },
  { id: 'filter', defaultIntervalMonths: 1 },
  { id: 'filterMedia', defaultIntervalMonths: 3 },
  { id: 'substrate', defaultIntervalMonths: 3 },
  { id: 'other', defaultIntervalMonths: 0 },
] as const

const PRESET_BY_ID = new Map<GearType, GearTypePreset>(GEAR_TYPES.map((p) => [p.id, p]))

/** Preset for a gear type. Always defined for valid `GearType` values. */
export function gearPreset(typeId: GearType): GearTypePreset {
  return PRESET_BY_ID.get(typeId) ?? { id: typeId, defaultIntervalMonths: 0 }
}
