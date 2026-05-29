/**
 * Reference thresholds for the freshwater nitrogen cycle, used by the pure engine.
 * Display copy lives in i18n — these are numeric husbandry constants only.
 *
 * Sources: standard aquarium cycling guidance. Ammonia (NH3) and nitrite (NO2)
 * are acutely toxic; the goal of cycling is a bacterial colony that converts both
 * to comparatively safe nitrate (NO3), which is then exported via water changes.
 */

/** Below this, a kit reading rounds to "0" in practice (test kits are approximate). */
export const TRACE_PPM = 0.05

/** Ammonia / nitrite at or above this is acutely dangerous. */
export const TOXIN_DANGER_PPM = 0.25

/** Nitrate accumulation bands (ppm). */
export const NITRATE_WARN_PPM = 40
export const NITRATE_DANGER_PPM = 80

/** Generic freshwater pH comfort band; outside this warrants attention. */
export const PH_MIN = 6.5
export const PH_MAX = 8

/** Generic temperate water band (°C) before a generic warn fires. */
export const TEMP_MIN_C = 10
export const TEMP_MAX_C = 26

/**
 * Axolotls are cold-water amphibians: 16–18 °C is ideal and they should not be
 * kept warm. pH around 7.4–7.6 suits them. Referenced in i18n copy.
 */
export const AXOLOTL_TEMP_IDEAL_MIN_C = 16
export const AXOLOTL_TEMP_IDEAL_MAX_C = 18
export const AXOLOTL_PH_IDEAL_MIN = 7.4
export const AXOLOTL_PH_IDEAL_MAX = 7.6
