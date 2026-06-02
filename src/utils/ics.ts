/**
 * Minimal RFC 5545 iCalendar (`.ics`) builder for all-day care events, so a
 * keeper can export the in-app care schedule and import it into their phone
 * calendar (Apple/Google) for real reminders. Pure and deterministic: DTSTAMP
 * is derived from each event's own date, so output is stable in tests and across
 * reloads (no `Date.now()`).
 */

export interface IcsEvent {
  /** Globally-unique id for the event (stable across exports). */
  uid: string
  /** All-day event date; only the `YYYY-MM-DD` prefix is used. */
  date: string
  summary: string
  description?: string
}

/** Escape the characters RFC 5545 reserves in TEXT values. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function toYmd(date: string): string {
  return date.slice(0, 10).replace(/-/g, '')
}

/** Build an iCalendar document (CRLF line endings) from all-day care events. */
export function buildIcs(events: readonly IcsEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pettography//Care Schedule//EN',
    'CALSCALE:GREGORIAN',
  ]

  for (const event of events) {
    const ymd = toYmd(event.date)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.uid}`)
    lines.push(`DTSTAMP:${ymd}T000000Z`)
    lines.push(`DTSTART;VALUE=DATE:${ymd}`)
    lines.push(`SUMMARY:${escapeText(event.summary)}`)
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
