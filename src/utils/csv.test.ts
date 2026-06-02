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
        ],
      ),
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
})
