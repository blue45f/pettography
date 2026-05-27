import { describe, it, expect } from 'vitest'

import {
  cn,
  truncate,
  removeUndefined,
  deepClone,
  chunk,
  isValidEmail,
  generateId,
  formatCurrency,
} from './helpers'

describe('cn', () => {
  it('여러 클래스를 결합한다', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('falsy 값을 필터링한다', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b')
  })

  it('빈 문자열을 반환한다', () => {
    expect(cn()).toBe('')
  })
})

describe('truncate', () => {
  it('긴 텍스트를 자른다', () => {
    expect(truncate('Hello World!', 8)).toBe('Hello...')
  })

  it('짧은 텍스트는 그대로 반환한다', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })
})

describe('removeUndefined', () => {
  it('undefined 값을 제거한다', () => {
    const result = removeUndefined({ a: 1, b: undefined, c: 'hello' })
    expect(result).toEqual({ a: 1, c: 'hello' })
  })
})

describe('deepClone', () => {
  it('깊은 복사를 수행한다', () => {
    const original = { a: { b: [1, 2, 3] } }
    const cloned = deepClone(original)
    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.a).not.toBe(original.a)
  })
})

describe('chunk', () => {
  it('배열을 청크로 분할한다', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('빈 배열을 처리한다', () => {
    expect(chunk([], 3)).toEqual([])
  })
})

describe('isValidEmail', () => {
  it('유효한 이메일을 검증한다', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('잘못된 이메일을 거부한다', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })
})

describe('generateId', () => {
  it('UUID 형식의 ID를 생성한다', () => {
    const id = generateId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('매번 고유한 ID를 생성한다', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })
})

describe('formatCurrency', () => {
  it('KRW 통화 형식으로 포맷한다', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1,000')
  })
})
