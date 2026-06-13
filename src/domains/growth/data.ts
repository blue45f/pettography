import type { GrowthNorm } from './schema'

/**
 * Approximate healthy adult size bands, keyed by species slug. Sourced from
 * common keeper care sheets (ranges vary by sex/line; treat as guidance).
 * Species without a reliable simple band are omitted — the tracker still
 * logs weight, it just won't draw the norm band.
 */
export const GROWTH_NORMS: Readonly<Record<string, GrowthNorm>> = {
  'leopard-gecko': {
    adultWeightMinG: 45,
    adultWeightMaxG: 90,
    adultLengthMinCm: 18,
    adultLengthMaxCm: 25,
    monthsToAdult: 18,
  },
  'crested-gecko': {
    adultWeightMinG: 35,
    adultWeightMaxG: 55,
    adultLengthMinCm: 20,
    adultLengthMaxCm: 25,
    monthsToAdult: 18,
  },
  'ball-python': {
    adultWeightMinG: 1200,
    adultWeightMaxG: 2500,
    adultLengthMinCm: 100,
    adultLengthMaxCm: 150,
    monthsToAdult: 36,
  },
  'corn-snake': {
    adultWeightMinG: 700,
    adultWeightMaxG: 900,
    adultLengthMinCm: 120,
    adultLengthMaxCm: 150,
    monthsToAdult: 36,
  },
  'bearded-dragon': {
    adultWeightMinG: 350,
    adultWeightMaxG: 600,
    adultLengthMinCm: 40,
    adultLengthMaxCm: 60,
    monthsToAdult: 18,
  },
  'russian-tortoise': {
    adultWeightMinG: 250,
    adultWeightMaxG: 1500,
    adultLengthMinCm: 13,
    adultLengthMaxCm: 25,
    monthsToAdult: 60,
  },
  axolotl: {
    adultWeightMinG: 120,
    adultWeightMaxG: 300,
    adultLengthMinCm: 18,
    adultLengthMaxCm: 28,
    monthsToAdult: 18,
  },
  cockatiel: {
    adultWeightMinG: 80,
    adultWeightMaxG: 120,
    adultLengthMinCm: 30,
    adultLengthMaxCm: 33,
    monthsToAdult: 12,
  },
  budgerigar: {
    adultWeightMinG: 30,
    adultWeightMaxG: 45,
    adultLengthMinCm: 18,
    adultLengthMaxCm: 20,
    monthsToAdult: 8,
  },
  'sugar-glider': {
    adultWeightMinG: 95,
    adultWeightMaxG: 160,
    adultLengthMinCm: 24,
    adultLengthMaxCm: 30,
    monthsToAdult: 12,
  },
  'african-pygmy-hedgehog': {
    adultWeightMinG: 250,
    adultWeightMaxG: 600,
    monthsToAdult: 6,
  },
  'veiled-chameleon': {
    adultWeightMinG: 90,
    adultWeightMaxG: 200,
    adultLengthMinCm: 35,
    adultLengthMaxCm: 60,
    monthsToAdult: 12,
  },
  'pacman-frog': {
    adultWeightMinG: 150,
    adultWeightMaxG: 350,
    adultLengthMinCm: 10,
    adultLengthMaxCm: 18,
    monthsToAdult: 18,
  },
}

export function growthNorm(speciesSlug: string | null | undefined): GrowthNorm | null {
  if (!speciesSlug) return null
  return GROWTH_NORMS[speciesSlug] ?? null
}
