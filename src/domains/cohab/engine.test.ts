import { describe, expect, it } from 'vitest'

import { cohabVerdict, verdictSeverity } from './engine'

import type { CohabSpecies } from './schema'

function sp(slug: string, category: string, koreanName = slug): CohabSpecies {
  return { slug, category, koreanName }
}

const ballPython = sp('ball-python', 'reptile', '볼파이톤')
const cornSnake = sp('corn-snake', 'reptile', '콘 스네이크')
const tarantula = sp('mexican-redknee-tarantula', 'arthropod', '멕시칸 레드니')
const pacman = sp('pacman-frog', 'amphibian', '팩맨 개구리')
const budgie = sp('budgerigar', 'bird', '잉꼬')
const cockatiel = sp('cockatiel', 'bird', '코카티엘')
const sugarGlider = sp('sugar-glider', 'mammal', '슈가글라이더')
const roach = sp('madagascar-hissing-cockroach', 'arthropod', '휘파람 바퀴')

describe('cohabVerdict — different species', () => {
  it('two different reptiles → no with mixSpeciesNever', () => {
    const r = cohabVerdict(ballPython, cornSnake)
    expect(r.verdict).toBe('no')
    expect(r.reasonCodes).toContain('mixSpeciesNever')
    expect(r.reasonCodes).toContain('diseaseRisk')
    expect(r.reasonCodes).toContain('differentNeeds')
  })

  it('cross-category pair (snake + tarantula) → no with predation + sizeMismatch', () => {
    const r = cohabVerdict(ballPython, tarantula)
    expect(r.verdict).toBe('no')
    expect(r.reasonCodes).toContain('mixSpeciesNever')
    expect(r.reasonCodes).toContain('predation')
    expect(r.reasonCodes).toContain('sizeMismatch')
  })

  it('two different social birds are still never mixed', () => {
    const r = cohabVerdict(budgie, cockatiel)
    expect(r.verdict).toBe('no')
    expect(r.reasonCodes).toContain('mixSpeciesNever')
  })

  it('is order-independent in its verdict', () => {
    expect(cohabVerdict(ballPython, tarantula).verdict).toBe(
      cohabVerdict(tarantula, ballPython).verdict,
    )
  })

  it('never returns reasons containing user-facing text (codes only)', () => {
    const r = cohabVerdict(ballPython, cornSnake)
    for (const code of r.reasonCodes) {
      expect(code).toMatch(/^[a-zA-Z]+$/)
    }
  })
})

describe('cohabVerdict — same species, solitary', () => {
  it('solitary reptile with itself → caution (aggression, not cannibalism)', () => {
    const r = cohabVerdict(ballPython, ballPython)
    expect(r.verdict).toBe('caution')
    expect(r.reasonCodes).toContain('soloMandatory')
    expect(r.reasonCodes).toContain('territorial')
  })

  it('solitary arthropod with itself → no with cannibalism', () => {
    const r = cohabVerdict(tarantula, tarantula)
    expect(r.verdict).toBe('no')
    expect(r.reasonCodes).toContain('cannibalism')
    expect(r.reasonCodes).toContain('soloMandatory')
  })

  it('solitary amphibian with itself → no with cannibalism', () => {
    const r = cohabVerdict(pacman, pacman)
    expect(r.verdict).toBe('no')
    expect(r.reasonCodes).toContain('cannibalism')
  })
})

describe('cohabVerdict — same species, social', () => {
  it('budgerigar with itself → sameSpeciesOnly', () => {
    const r = cohabVerdict(budgie, budgie)
    expect(r.verdict).toBe('sameSpeciesOnly')
    expect(r.reasonCodes).toContain('socialNeedsGroup')
    expect(r.reasonCodes).toContain('spaceRequired')
  })

  it('social arthropod (hissing cockroach) with itself → sameSpeciesOnly, not cannibalism', () => {
    const r = cohabVerdict(roach, roach)
    expect(r.verdict).toBe('sameSpeciesOnly')
    expect(r.reasonCodes).not.toContain('cannibalism')
  })

  it('sugar glider with itself → ok (isolation is harmful)', () => {
    const r = cohabVerdict(sugarGlider, sugarGlider)
    expect(r.verdict).toBe('ok')
    expect(r.reasonCodes).toContain('socialNeedsGroup')
    expect(r.reasonCodes).toContain('sexRatio')
  })

  it('reason codes are de-duplicated', () => {
    const r = cohabVerdict(sugarGlider, sugarGlider)
    expect(new Set(r.reasonCodes).size).toBe(r.reasonCodes.length)
  })
})

describe('verdictSeverity', () => {
  it('ranks no as the most severe and ok as the least', () => {
    expect(verdictSeverity('no')).toBeGreaterThan(verdictSeverity('caution'))
    expect(verdictSeverity('caution')).toBeGreaterThan(verdictSeverity('sameSpeciesOnly'))
    expect(verdictSeverity('sameSpeciesOnly')).toBeGreaterThan(verdictSeverity('ok'))
  })

  it('sorts a mixed list worst-first', () => {
    const sorted = (['ok', 'no', 'sameSpeciesOnly', 'caution'] as const)
      .slice()
      .sort((a, b) => verdictSeverity(b) - verdictSeverity(a))
    expect(sorted).toEqual(['no', 'caution', 'sameSpeciesOnly', 'ok'])
  })
})
