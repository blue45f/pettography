/**
 * Tiny RFC 4180 CSV builder for exporting logs (weight, feeding) so a keeper can
 * chart them in a spreadsheet or share them with a vet. Pure and deterministic.
 */

type Cell = string | number | boolean | null | undefined

/** Quote a cell when it contains a comma, quote or newline; double inner quotes. */
function escapeCell(value: Cell): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Build a CSV document (CRLF line endings) from headers + rows. */
export function buildCsv(headers: readonly string[], rows: ReadonlyArray<readonly Cell[]>): string {
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ]
  return lines.join('\r\n')
}
