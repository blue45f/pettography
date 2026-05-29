/**
 * Approximate incubation reference values per species.
 *
 * These are real, commonly-cited keeper figures (typical ranges + setpoints)
 * — NOT precise predictions. Actual hatch timing varies with exact
 * temperature, humidity, substrate, and clutch. The UI surfaces this caveat.
 *
 * Sources: World of Ball Pythons, The Gecko Spot / leopardgecko.com,
 * Cornsnakes.com, bearded dragon & crested gecko keeper consensus, and
 * Ambystoma axolotl husbandry references — summarised.
 */
export interface IncubationRef {
  /** Shortest commonly-observed incubation, in days. */
  minDays: number
  /** Longest commonly-observed incubation, in days. */
  maxDays: number
  /** Typical incubation setpoint, °C (omitted for the generic fallback). */
  typicalTempC?: number
  /** True when incubation temperature influences hatchling sex (TDSD). */
  tdsd: boolean
  /** Short Korean note shown alongside the estimate. */
  note: string
}

export const INCUBATION_REF: Readonly<Record<string, IncubationRef>> = {
  'ball-python': {
    minDays: 55,
    maxDays: 60,
    typicalTempC: 31.5,
    tdsd: false,
    note: '약 31~32°C에서 클러치를 인공 부화하는 것이 일반적입니다.',
  },
  'leopard-gecko': {
    minDays: 35,
    maxDays: 89,
    typicalTempC: 29,
    tdsd: true,
    note: '온도 의존 성결정(TDSD) 종입니다. 부화 온도가 높을수록 빨리 부화하고 성비도 달라집니다(약 28~30°C가 일반적).',
  },
  'corn-snake': {
    minDays: 55,
    maxDays: 65,
    typicalTempC: 28,
    tdsd: false,
    note: '약 28°C에서 부화하며 온도가 성별에 영향을 주지 않습니다.',
  },
  'bearded-dragon': {
    minDays: 55,
    maxDays: 75,
    typicalTempC: 29,
    tdsd: false,
    note: '약 29°C가 표준입니다. TDSD는 아니지만 극단적인 고온은 성전환을 유발할 수 있습니다.',
  },
  'crested-gecko': {
    minDays: 60,
    maxDays: 90,
    typicalTempC: 23.5,
    tdsd: false,
    note: '비교적 저온(약 22~25°C)에서 천천히 부화합니다. 고온은 기형 위험을 높입니다.',
  },
  axolotl: {
    minDays: 14,
    maxDays: 21,
    typicalTempC: 20,
    tdsd: false,
    note: '수중란으로 약 20°C에서 2~3주면 부화합니다. 깨끗한 수질 유지가 중요합니다.',
  },
}

/** Used when the species slug is unknown / unmapped. */
export const FALLBACK_INCUBATION_REF: IncubationRef = {
  minDays: 45,
  maxDays: 70,
  tdsd: false,
  note: '해당 종의 기준 자료가 없어 일반적인 범위(45~70일)로 추정합니다.',
}

/** Resolve the incubation reference for a species slug, falling back safely. */
export function incubationRef(slug: string | null | undefined): IncubationRef {
  if (!slug) return FALLBACK_INCUBATION_REF
  return INCUBATION_REF[slug] ?? FALLBACK_INCUBATION_REF
}
