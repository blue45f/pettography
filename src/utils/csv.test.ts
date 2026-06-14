import { describe, expect, it } from 'vitest'

import { buildCsv } from './csv'

describe('buildCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(
      buildCsv(
        ['a', 'b'],
        [
          [1, 2],
          [3, 4],
        ]
      )
    ).toBe('a,b\r\n1,2\r\n3,4')
  })

  it('escapes commas, quotes and newlines per RFC 4180', () => {
    const out = buildCsv(['x'], [['a,b'], ['he said "hi"'], ['line\nbreak']])
    expect(out).toContain('"a,b"')
    expect(out).toContain('"he said ""hi"""')
    expect(out).toContain('"line\nbreak"')
  })

  it('renders null/undefined as empty and booleans as text', () => {
    expect(buildCsv(['x', 'y', 'z'], [[null, undefined, true]])).toBe('x,y,z\r\n,,true')
  })

  it('neutralizes formula-injection strings with a leading quote', () => {
    expect(buildCsv(['note'], [['=1+1']])).toBe("note\r\n'=1+1")
    expect(buildCsv(['note'], [['@cmd']])).toBe("note\r\n'@cmd")
    expect(buildCsv(['note'], [['+ping']])).toBe("note\r\n'+ping")
    expect(buildCsv(['note'], [['-5 today']])).toBe("note\r\n'-5 today")
  })

  it('still quotes a guarded cell that also contains a comma', () => {
    expect(buildCsv(['note'], [['=a,b']])).toBe('note\r\n"\'=a,b"')
  })

  it('does not mangle typed negative numbers', () => {
    expect(buildCsv(['delta'], [[-5]])).toBe('delta\r\n-5')
  })
})
