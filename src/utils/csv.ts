/**
 * Tiny RFC 4180 CSV builder for exporting logs (weight, feeding) so a keeper can
 * chart them in a spreadsheet or share them with a vet. Pure and deterministic.
 */

type Cell = string | number | boolean | null | undefined

/** Leading characters a spreadsheet may execute as a formula (CSV injection, CWE-1236). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

/**
 * Escape a single cell:
 * 1. User-provided strings that begin with a formula trigger (= + - @, tab, CR) are
 *    prefixed with a single quote so spreadsheets render them as text, not formulas.
 *    Typed numbers/booleans are never altered, so negative numbers stay numeric.
 * 2. Quote the cell when it contains a comma, quote or newline; double inner quotes.
 */
function escapeCell(value: Cell): string {
  let s = value === null || value === undefined ? '' : String(value)
  if (typeof value === 'string' && FORMULA_TRIGGER.test(value)) {
    s = `'${s}`
  }
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
