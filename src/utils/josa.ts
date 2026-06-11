/**
 * Korean postposition (조사) selection.
 *
 * Korean particles such as 을/를, 이/가, 은/는, 과/와, 으로/로 are chosen by
 * whether the *preceding* syllable ends in a final consonant (받침/종성). A
 * naive `"{{name}}을(를)"` fallback prints awkward double forms like
 * "레오파드 게코을(를)" — this util resolves the correct single particle so the
 * sentence reads naturally for any species / pet name.
 *
 * Detection works off the trailing Hangul syllable's Unicode code point. Hangul
 * syllables occupy U+AC00–U+D7A3 and are composed as
 *   code = 0xAC00 + (lead * 21 + vowel) * 28 + tail
 * so `(code - 0xAC00) % 28 === 0` means there is no final consonant. The
 * particle 로/으로 is special-cased: after ㄹ (tail index 8) it behaves like a
 * vowel-final word and takes 로.
 */

const HANGUL_BASE = 0xac00
const HANGUL_LAST = 0xd7a3
const JONGSEONG_COUNT = 28
/** Tail (종성) index of ㄹ within a composed Hangul syllable. */
const RIEUL_JONGSEONG_INDEX = 8

export interface JosaPair {
  /** Particle used after a syllable that ends in a final consonant (받침 있음). */
  withFinal: string
  /** Particle used after a syllable with no final consonant (받침 없음). */
  withoutFinal: string
}

/** Built-in particle pairs keyed by their "with final consonant" form. */
export const JOSA_PAIRS = {
  을: { withFinal: '을', withoutFinal: '를' },
  를: { withFinal: '을', withoutFinal: '를' },
  이: { withFinal: '이', withoutFinal: '가' },
  가: { withFinal: '이', withoutFinal: '가' },
  은: { withFinal: '은', withoutFinal: '는' },
  는: { withFinal: '은', withoutFinal: '는' },
  과: { withFinal: '과', withoutFinal: '와' },
  와: { withFinal: '과', withoutFinal: '와' },
  으로: { withFinal: '으로', withoutFinal: '로' },
  로: { withFinal: '으로', withoutFinal: '로' },
} as const satisfies Record<string, JosaPair>

export type JosaKey = keyof typeof JOSA_PAIRS

/**
 * Whether `word`'s final Hangul syllable carries a final consonant (받침).
 *
 * Returns `null` when the trailing character is not a composed Hangul syllable
 * (e.g. a digit, Latin letter or punctuation) so callers can decide on a
 * fallback rather than guessing a particle.
 */
export function hasFinalConsonant(word: string): boolean | null {
  const trimmed = word.trim()
  if (!trimmed) return null
  const code = trimmed.charCodeAt(trimmed.length - 1)
  if (code < HANGUL_BASE || code > HANGUL_LAST) return null
  return (code - HANGUL_BASE) % JONGSEONG_COUNT !== 0
}

function jongseongIndex(word: string): number | null {
  const trimmed = word.trim()
  if (!trimmed) return null
  const code = trimmed.charCodeAt(trimmed.length - 1)
  if (code < HANGUL_BASE || code > HANGUL_LAST) return null
  return (code - HANGUL_BASE) % JONGSEONG_COUNT
}

/**
 * Pick the correct Korean particle for `word`.
 *
 * @param word  The noun the particle attaches to.
 * @param pair  Either a known particle (e.g. `'을'`, `'은'`, `'로'`) or an
 *              explicit `{ withFinal, withoutFinal }` pair.
 *
 * When the trailing character is non-Hangul (e.g. an English species name) the
 * `withoutFinal` form is used, matching how 외래어 reads aloud most of the time
 * and keeping output free of the awkward "을(를)" double form.
 */
export function getJosa(word: string, pair: JosaKey | JosaPair): string {
  const resolved: JosaPair = typeof pair === 'string' ? JOSA_PAIRS[pair] : pair
  const index = jongseongIndex(word)
  // Non-Hangul trailing char: fall back to the vowel-final form.
  if (index === null) return resolved.withoutFinal
  // 로/으로: ㄹ-final words read like vowel-final words and take 로.
  if (resolved.withFinal === '으로' && index === RIEUL_JONGSEONG_INDEX) {
    return resolved.withoutFinal
  }
  return index !== 0 ? resolved.withFinal : resolved.withoutFinal
}

/**
 * Append the correct particle to `word`, e.g. `withJosa('레오파드 게코', '을')`
 * → `'레오파드 게코를'`.
 */
export function withJosa(word: string, pair: JosaKey | JosaPair): string {
  return `${word}${getJosa(word, pair)}`
}

/** Matches an i18next format spec like `josa(을/를)` and captures the particle. */
const JOSA_FORMAT_RE = /^josa\((.+)\)$/

/**
 * Resolve an i18next interpolation `format` spec of the shape `josa(을/를)` for a
 * given interpolated `value`. Returns `null` when the format is not a josa spec
 * so the caller can fall through to its default formatting.
 *
 * Either side of the slash works (`josa(을/를)` ≡ `josa(를)`); the particle is
 * normalised via {@link JOSA_PAIRS}.
 */
export function formatJosa(value: unknown, format: string | undefined): string | null {
  if (!format) return null
  const match = JOSA_FORMAT_RE.exec(format.trim())
  if (!match) return null
  const particle = match[1].split('/')[0].trim() as JosaKey
  if (!(particle in JOSA_PAIRS)) return null
  return withJosa(value == null ? '' : String(value), particle)
}
