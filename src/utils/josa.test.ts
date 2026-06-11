import { describe, expect, it } from 'vitest'

import { getJosa, hasFinalConsonant, withJosa } from './josa'

describe('hasFinalConsonant', () => {
  it('detects a final consonant (받침 있음)', () => {
    expect(hasFinalConsonant('볼파이톤')).toBe(true) // 톤 → ㄴ
    expect(hasFinalConsonant('밀웜')).toBe(true) // 웜 → ㅁ
  })

  it('detects no final consonant (받침 없음)', () => {
    expect(hasFinalConsonant('레오파드 게코')).toBe(false) // 코 → 받침 없음
    expect(hasFinalConsonant('거북이')).toBe(false) // 이 → 받침 없음
  })

  it('returns null for non-Hangul trailing characters', () => {
    expect(hasFinalConsonant('Leopard Gecko')).toBeNull()
    expect(hasFinalConsonant('123')).toBeNull()
    expect(hasFinalConsonant('')).toBeNull()
    expect(hasFinalConsonant('   ')).toBeNull()
  })
})

describe('getJosa', () => {
  it('chooses 을/를 by 받침', () => {
    expect(getJosa('볼파이톤', '을')).toBe('을')
    expect(getJosa('레오파드 게코', '을')).toBe('를')
    // Either form of the pair resolves identically.
    expect(getJosa('레오파드 게코', '를')).toBe('를')
  })

  it('chooses 은/는 by 받침', () => {
    expect(getJosa('볼파이톤', '은')).toBe('은')
    expect(getJosa('레오파드 게코', '은')).toBe('는')
  })

  it('chooses 이/가 by 받침', () => {
    expect(getJosa('크레스티드 게코', '이')).toBe('가')
    expect(getJosa('사막왕전갈', '이')).toBe('이') // 갈 → ㄹ
  })

  it('chooses 과/와 by 받침', () => {
    expect(getJosa('밀웜', '과')).toBe('과')
    expect(getJosa('귀뚜라미', '과')).toBe('와')
  })

  it('handles 로/으로 with the ㄹ special case', () => {
    expect(getJosa('병원', '로')).toBe('으로') // 원 → ㄴ
    expect(getJosa('카페', '로')).toBe('로') // 페 → 받침 없음
    expect(getJosa('서울', '로')).toBe('로') // 울 → ㄹ, reads like vowel-final
  })

  it('falls back to the vowel-final form for non-Hangul names', () => {
    expect(getJosa('Gecko', '을')).toBe('를')
    expect(getJosa('Python', '은')).toBe('는')
  })

  it('accepts an explicit particle pair', () => {
    expect(getJosa('볼파이톤', { withFinal: '으로', withoutFinal: '로' })).toBe('으로')
  })
})

describe('withJosa', () => {
  it('appends the resolved particle to the word', () => {
    // The QA-reported case: no more "레오파드 게코을(를)".
    expect(withJosa('레오파드 게코', '을')).toBe('레오파드 게코를')
    expect(withJosa('볼파이톤', '을')).toBe('볼파이톤을')
    expect(withJosa('볼파이톤', '은')).toBe('볼파이톤은')
    expect(withJosa('레오파드 게코', '은')).toBe('레오파드 게코는')
  })
})
