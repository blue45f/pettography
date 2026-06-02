import { describe, expect, it } from 'vitest'

import { buildIcs } from './ics'

describe('buildIcs', () => {
  it('wraps events in a VCALENDAR envelope with CRLF line endings', () => {
    const out = buildIcs([])
    expect(out.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0')).toBe(true)
    expect(out.endsWith('END:VCALENDAR')).toBe(true)
    expect(out).not.toContain('BEGIN:VEVENT')
  })

  it('renders an all-day VEVENT with a compact YYYYMMDD date', () => {
    const out = buildIcs([{ uid: 'a@pg', date: '2026-02-03', summary: 'Rabies booster' }])
    expect(out).toContain('BEGIN:VEVENT')
    expect(out).toContain('UID:a@pg')
    expect(out).toContain('DTSTART;VALUE=DATE:20260203')
    expect(out).toContain('SUMMARY:Rabies booster')
    expect(out).toContain('END:VEVENT')
  })

  it('escapes commas/semicolons and omits an absent description', () => {
    const out = buildIcs([{ uid: 'b', date: '2026-02-03', summary: 'weigh, dust; calcium' }])
    expect(out).toContain('SUMMARY:weigh\\, dust\\; calcium')
    expect(out).not.toContain('DESCRIPTION:')
  })

  it('includes a description when provided', () => {
    const out = buildIcs([{ uid: 'c', date: '2026-02-03', summary: 'Clean', description: 'Spot' }])
    expect(out).toContain('DESCRIPTION:Spot')
  })
})
