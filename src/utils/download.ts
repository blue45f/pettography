/**
 * Trigger a client-side download of a text payload (CSV, ICS, JSON, …).
 * Browser-only: uses an object URL + a transient anchor. Shared by the calendar
 * `.ics` export and the log CSV exports.
 */
export function downloadTextFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
